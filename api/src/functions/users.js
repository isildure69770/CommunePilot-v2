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

app.http("users", {
  methods: ["GET", "PUT"], authLevel: "anonymous", route: "users",
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
        const value = { id: `azure-${user.userId}`, firstName, lastName: lastName.join(" ") || "Microsoft", role, active: true, email: user.userDetails.includes("@") ? user.userDetails : undefined };
        await client.upsertEntity({ partitionKey: "users", rowKey: user.userId, payload: JSON.stringify(value), updatedAt: new Date().toISOString() }, "Replace");
      }
      return { status: 200, jsonBody: { users: await list(client) } };
    } catch (error) {
      context.error(error);
      return { status: 503, jsonBody: { error: "Annuaire CommunePilot indisponible." } };
    }
  },
});
