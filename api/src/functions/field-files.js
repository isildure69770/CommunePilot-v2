import { app } from "@azure/functions";
import { BlobServiceClient } from "@azure/storage-blob";
import { clientPrincipal, hasRole, isAuthenticated } from "../auth.js";

const containerName = process.env.FIELD_FILES_CONTAINER_NAME || "field-files";
const roles = new Set(["maire", "adjoint", "conseiller", "agent-administratif", "agent-technique"]);
const maximumBytes = 15 * 1024 * 1024;

function mayAccess(user) { return hasRole(user, roles); }
function safeId(value) { return typeof value === "string" && /^[a-zA-Z0-9._-]{1,180}$/.test(value) ? value : null; }

async function container() {
  const connectionString = process.env.FIELD_FILES_STORAGE_CONNECTION_STRING || process.env.FIELD_ALERTS_STORAGE_CONNECTION_STRING;
  if (!connectionString) throw new Error("Configuration de stockage des fichiers terrain absente.");
  const client = BlobServiceClient.fromConnectionString(connectionString).getContainerClient(containerName);
  await client.createIfNotExists();
  return client;
}

app.http("field-files-upload", {
  methods: ["POST"], authLevel: "anonymous", route: "field-files",
  handler: async (request, context) => {
    const user = clientPrincipal(request);
    if (!isAuthenticated(user)) return { status: 401, jsonBody: { error: "Authentification Azure requise." } };
    if (!mayAccess(user)) return { status: 403, jsonBody: { error: "Rôle CommunePilot requis." } };
    try {
      const body = await request.json();
      const id = safeId(body?.id); const match = /^data:([^;,]+)?;base64,(.+)$/.exec(body?.dataUrl || "");
      if (!id || !match) return { status: 400, jsonBody: { error: "Fichier invalide." } };
      const bytes = Buffer.from(match[2], "base64");
      if (!bytes.length || bytes.length > maximumBytes) return { status: 413, jsonBody: { error: "Le fichier dépasse la limite de 15 Mo." } };
      const blob = (await container()).getBlockBlobClient(id);
      await blob.uploadData(bytes, { blobHTTPHeaders: { blobContentType: body.type || match[1] || "application/octet-stream" }, metadata: { filename: Buffer.from(String(body.name || "fichier")).toString("base64") } });
      return { status: 201, jsonBody: { dataUrl: `/api/field-files/${encodeURIComponent(id)}` } };
    } catch (error) { context.error(error); return { status: 503, jsonBody: { error: "Stockage du fichier indisponible." } }; }
  }
});

app.http("field-files-download", {
  methods: ["GET"], authLevel: "anonymous", route: "field-files/{id}",
  handler: async (request, context) => {
    const user = clientPrincipal(request);
    if (!isAuthenticated(user)) return { status: 401, jsonBody: { error: "Authentification Azure requise." } };
    if (!mayAccess(user)) return { status: 403, jsonBody: { error: "Rôle CommunePilot requis." } };
    try {
      const id = safeId(request.params.id);
      if (!id) return { status: 400, jsonBody: { error: "Identifiant invalide." } };
      const blob = (await container()).getBlockBlobClient(id); const properties = await blob.getProperties(); const download = await blob.downloadToBuffer();
      const filename = properties.metadata?.filename ? Buffer.from(properties.metadata.filename, "base64").toString("utf8") : "fichier";
      return { status: 200, body: download, headers: { "content-type": properties.contentType || "application/octet-stream", "content-disposition": `inline; filename*=UTF-8''${encodeURIComponent(filename)}`, "cache-control": "private, max-age=300" } };
    } catch (error) {
      if (error.statusCode === 404) return { status: 404, jsonBody: { error: "Fichier introuvable." } };
      context.error(error); return { status: 503, jsonBody: { error: "Lecture du fichier indisponible." } };
    }
  }
});
