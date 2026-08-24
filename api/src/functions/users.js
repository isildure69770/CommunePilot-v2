import { app } from "@azure/functions";
import { TableClient } from "@azure/data-tables";

const tableName = process.env.COMMUNEPILOT_USERS_TABLE_NAME || "CommunePilotUsers";
const allowedRoles = new Map([
  ["maire", "Maire"],
  ["adjoint", "Adjoint"],
  ["conseiller", "Conseiller"],
  ["agent-administratif", "Agent administratif"],
  ["agent-technique", "Agent technique"],
]);

function principal(request) {
  const encoded = request.headers.get("x-ms-client-principal");
  if (!encoded) return null;
  try { return JSON.parse(Buffer.from(encoded, "base64").toString("utf8")); } catch { return null; }
}

function communeRole(userRoles = []) {
  for (const role of userRoles) {
    const value = allowedRoles.get(role.toLocaleLowerCase("fr-FR"));
    if (value) return value;
  }
  return null;
}

function displayName(userDetails = "") {
  const label = userDetails.split("@")[0].replace(/[._-]+/g, " ").trim() || "Utilisateur Microsoft";
  return label.replace(/(^|\s)\p{L}/gu, (letter) => letter.toLocaleUpperCase("fr-FR"));
}

async function table() {
  const connectionString = process.env.COMMUNEPILOT_STORAGE_CONNECTION_STRING || process.env.FIELD_ALERTS_STORAGE_CONNECTION_STRING;
  if (!connectionString) throw new Error("Configuration de stockage CommunePilot absente.");
  const client = TableClient.fromConnectionString(connectionString, tableName);
  await client.createTable().catch((error) => { if (error.statusCode !== 409) throw error; });
  return client;
}

async function list(client) {
  const users = [];
  for await (const entity of client.listEntities({ queryOptions: { filter: "PartitionKey eq 'users'" } })) users.push(JSON.parse(entity.payload));
  return users.sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`, "fr"));
}

async function entries(client) {
  const values = [];
  for await (const entity of client.listEntities({ queryOptions: { filter: "PartitionKey eq 'users'" } })) values.push({ entity, user: JSON.parse(entity.payload) });
  return values;
}

app.http("users", {
  methods: ["GET", "PUT", "POST", "PATCH"], authLevel: "anonymous", route: "users",
  handler: async (request, context) => {
    const user = principal(request);
    if (!user?.userRoles?.includes("authenticated")) return { status: 401, jsonBody: { error: "Authentification Azure requise." } };
    const role = communeRole(user.userRoles);
    if (!role) return { status: 403, jsonBody: { error: "Rôle CommunePilot requis." } };
    try {
      const client = await table();
      if (request.method === "PUT") {
        const fullName = displayName(user.userDetails);
        const [firstName, ...lastName] = fullName.split(/\s+/);
        const email = user.userDetails.includes("@") ? user.userDetails.toLocaleLowerCase("fr-FR") : undefined;
        const existing = (await entries(client)).find((entry) => email && entry.user.email?.toLocaleLowerCase("fr-FR") === email);
        const value = { id: existing?.user.id ?? `azure-${user.userId}`, firstName: existing?.user.firstName ?? firstName, lastName: existing?.user.lastName ?? (lastName.join(" ") || "Microsoft"), role: existing?.user.role ?? role, active: true, email, azureUserId: user.userId };
        await client.upsertEntity({ partitionKey: "users", rowKey: existing?.entity.rowKey ?? user.userId, payload: JSON.stringify(value), updatedAt: new Date().toISOString() }, "Replace");
        return { status: 200, jsonBody: { users: await list(client), currentUserId: value.id } };
      }
      if (request.method === "POST") {
        if (!user.userRoles.includes("maire")) return { status: 403, jsonBody: { error: "Seul le maire peut créer un profil." } };
        const body = await request.json(); const profileRole = [...allowedRoles.values()].find((value) => value === body?.role);
        const email = String(body?.email ?? "").trim().toLocaleLowerCase("fr-FR");
        if (!profileRole || !email.includes("@") || !String(body?.firstName ?? "").trim() || !String(body?.lastName ?? "").trim()) return { status: 400, jsonBody: { error: "Profil incomplet." } };
        const existing = (await entries(client)).find((entry) => entry.user.email?.toLocaleLowerCase("fr-FR") === email);
        if (existing) return { status: 409, jsonBody: { error: "Un profil existe déjà pour cette adresse." } };
        const key = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const value = { id: `profile-${key}`, firstName: String(body.firstName).trim(), lastName: String(body.lastName).trim(), role: profileRole, active: true, email };
        await client.upsertEntity({ partitionKey: "users", rowKey: key, payload: JSON.stringify(value), updatedAt: new Date().toISOString() }, "Replace");
        return { status: 201, jsonBody: { users: await list(client), created: value } };
      }
      if (request.method === "PATCH") {
        if (!user.userRoles.includes("maire")) return { status: 403, jsonBody: { error: "Seul le maire peut modifier un profil." } };
        const body = await request.json(); const existing = (await entries(client)).find((entry) => entry.user.id === body?.id);
        const profileRole = [...allowedRoles.values()].find((value) => value === body?.role);
        if (!existing || !profileRole) return { status: 404, jsonBody: { error: "Profil introuvable." } };
        const value = { ...existing.user, role: profileRole, active: body.active !== false };
        await client.upsertEntity({ partitionKey: "users", rowKey: existing.entity.rowKey, payload: JSON.stringify(value), updatedAt: new Date().toISOString() }, "Replace");
        return { status: 200, jsonBody: { users: await list(client) } };
      }
      return { status: 200, jsonBody: { users: await list(client) } };
    } catch (error) {
      context.error(error);
      return { status: 503, jsonBody: { error: "Annuaire CommunePilot indisponible." } };
    }
  },
});
