import { app } from "@azure/functions";
import { TableClient } from "@azure/data-tables";
import { clientPrincipal, hasRole, isAuthenticated } from "../auth.js";

const tableName = process.env.USERS_TABLE_NAME || "DirectoryUsers";
const readers = new Set(["maire", "adjoint", "conseiller", "agent-administratif", "agent-technique"]);
const writers = new Set(["maire", "adjoint", "agent-administratif"]);
const groups = new Set(["Maire et adjoints", "Conseillers municipaux", "Agents administratifs", "Agents techniques"]);
const roles = new Set(["Maire", "Adjoint", "Conseiller", "Agent administratif", "Agent technique"]);
const visibility = new Set(["administrators", "directory"]);

async function table() {
  const connection = process.env.USERS_STORAGE_CONNECTION_STRING || process.env.MISSIONS_STORAGE_CONNECTION_STRING || process.env.FIELD_ALERTS_STORAGE_CONNECTION_STRING;
  if (!connection) throw new Error("Configuration de stockage de l’annuaire absente.");
  const client = TableClient.fromConnectionString(connection, tableName);
  await client.createTable().catch((error) => { if (error.statusCode !== 409) throw error; }); return client;
}
function cleanText(value, maximum = 240) { return typeof value === "string" ? value.trim().slice(0, maximum) : ""; }
export function validateDirectoryUser(raw, existing) {
  const id = cleanText(raw?.id || existing?.id, 100);
  const firstName = cleanText(raw?.firstName, 80); const lastName = cleanText(raw?.lastName, 80);
  if (!/^[a-zA-Z0-9._-]{1,100}$/.test(id) || !firstName || !lastName || !groups.has(raw?.group) || !roles.has(raw?.role)) throw new Error("Fiche utilisateur invalide.");
  const now = new Date().toISOString();
  return { id, firstName, lastName, role: raw.role, group: raw.group, jobTitle: cleanText(raw.jobTitle, 120), active: raw.active !== false, email: cleanText(raw.email, 160), phone: cleanText(raw.phone, 40), address: cleanText(raw.address, 300), addressVisibility: visibility.has(raw.addressVisibility) ? raw.addressVisibility : "administrators", commissionIds: Array.isArray(raw.commissionIds) ? [...new Set(raw.commissionIds.map((v) => cleanText(v, 60)).filter(Boolean))].slice(0, 30) : [], notes: cleanText(raw.notes, 2000), photoUrl: /^\/api\/directory-photos\//.test(raw.photoUrl || "") ? raw.photoUrl : existing?.photoUrl, thumbnailUrl: /^\/api\/directory-photos\//.test(raw.thumbnailUrl || "") ? raw.thumbnailUrl : existing?.thumbnailUrl, createdAt: existing?.createdAt || raw.createdAt || now, updatedAt: now };
}
function maySeeAddress(user) { return hasRole(user, writers); }
export function visibleDirectoryUser(record, user) { return record.addressVisibility === "directory" || maySeeAddress(user) ? record : { ...record, address: undefined, notes: undefined }; }

app.http("directory-users", { methods: ["GET", "PUT"], authLevel: "anonymous", route: "users/{id?}", handler: async (request, context) => {
  const principal = clientPrincipal(request);
  if (!isAuthenticated(principal)) return { status: 401, jsonBody: { error: "Authentification Azure requise." } };
  if (!hasRole(principal, readers)) return { status: 403, jsonBody: { error: "Accès à l’annuaire refusé." } };
  try {
    const client = await table();
    if (request.method === "PUT") {
      if (!hasRole(principal, writers)) return { status: 403, jsonBody: { error: "Modification de l’annuaire non autorisée." } };
      const id = request.params.id; let existing;
      try { const entity = await client.getEntity("users", id); existing = JSON.parse(entity.payload); } catch (error) { if (error.statusCode !== 404) throw error; }
      const record = validateDirectoryUser(await request.json(), existing);
      if (record.id !== id) return { status: 400, jsonBody: { error: "Identifiant incohérent." } };
      await client.upsertEntity({ partitionKey: "users", rowKey: record.id, updatedAt: record.updatedAt, payload: JSON.stringify(record) }, "Replace");
      return { status: existing ? 200 : 201, jsonBody: { user: visibleDirectoryUser(record, principal) } };
    }
    const users = []; for await (const entity of client.listEntities({ queryOptions: { filter: "PartitionKey eq 'users'" } })) users.push(visibleDirectoryUser(JSON.parse(entity.payload), principal));
    return { status: 200, jsonBody: { users } };
  } catch (error) { context.error(error); return { status: error.message === "Fiche utilisateur invalide." ? 400 : 503, jsonBody: { error: error.message === "Fiche utilisateur invalide." ? error.message : "Stockage de l’annuaire indisponible." } }; }
} });
