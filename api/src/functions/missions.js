import { app } from "@azure/functions";
import { TableClient } from "@azure/data-tables";
import { clientPrincipal, hasRole, isAuthenticated } from "../auth.js";

const tableName = process.env.MISSIONS_TABLE_NAME || "Missions";
const createRoles = new Set(["maire", "adjoint", "agent-administratif", "agent-technique"]);
const updateRoles = new Set(["maire", "adjoint", "agent-administratif", "agent-technique"]);
const viewRoles = new Set([...createRoles, "conseiller"]);

function may(user, allowed) { return hasRole(user, allowed); }
function cleanAttachment(attachment) { const { dataUrl, thumbnailDataUrl, ...metadata } = attachment ?? {}; return { ...metadata, dataUrl: typeof dataUrl === "string" && dataUrl.startsWith("/api/field-files/") ? dataUrl : "", thumbnailDataUrl: typeof thumbnailDataUrl === "string" && thumbnailDataUrl.startsWith("/api/field-files/") ? thumbnailDataUrl : undefined }; }
function cleanMission(mission) {
  return { ...mission, attachments: Array.isArray(mission.attachments) ? mission.attachments.map(cleanAttachment) : [], reports: Array.isArray(mission.reports) ? mission.reports.map((report) => ({ ...report, photos: Array.isArray(report.photos) ? report.photos.map(cleanAttachment) : [] })) : [], problems: Array.isArray(mission.problems) ? mission.problems.map((problem) => ({ ...problem, photos: Array.isArray(problem.photos) ? problem.photos.map(cleanAttachment) : [] })) : [] };
}
function entityToMission(entity) { return JSON.parse(entity.payload); }

async function table() {
  const connectionString = process.env.MISSIONS_STORAGE_CONNECTION_STRING || process.env.FIELD_ALERTS_STORAGE_CONNECTION_STRING;
  if (!connectionString) throw new Error("Configuration de stockage des missions absente.");
  const client = TableClient.fromConnectionString(connectionString, tableName);
  await client.createTable().catch((error) => { if (error.statusCode !== 409) throw error; });
  return client;
}
async function list(client) {
  const missions = [];
  for await (const entity of client.listEntities({ queryOptions: { filter: "PartitionKey eq 'missions'" } })) missions.push(entityToMission(entity));
  return missions;
}

app.http("missions", {
  methods: ["GET", "PUT"], authLevel: "anonymous", route: "missions",
  handler: async (request, context) => {
    const user = clientPrincipal(request);
    if (!isAuthenticated(user)) return { status: 401, jsonBody: { error: "Authentification Azure requise." } };
    if (!may(user, viewRoles)) return { status: 403, jsonBody: { error: "Rôle CommunePilot requis." } };
    try {
      const client = await table();
      if (request.method === "PUT") {
        const body = await request.json(); const incoming = Array.isArray(body?.missions) ? body.missions : [];
        const remote = new Map((await list(client)).map((mission) => [mission.id, mission]));
        for (const raw of incoming) {
          if (!raw?.id || !raw?.updatedAt) continue;
          const existing = remote.get(raw.id);
          if (existing && !may(user, updateRoles)) continue;
          if (!existing && !may(user, createRoles)) continue;
          const candidate = cleanMission(raw);
          if (!existing || candidate.updatedAt > existing.updatedAt) {
            await client.upsertEntity({ partitionKey: "missions", rowKey: candidate.id, updatedAt: candidate.updatedAt, payload: JSON.stringify(candidate) }, "Replace");
            remote.set(candidate.id, candidate);
          }
        }
      }
      return { status: 200, jsonBody: { missions: await list(client) } };
    } catch (error) { context.error(error); return { status: 503, jsonBody: { error: "Stockage des missions indisponible." } }; }
  }
});
