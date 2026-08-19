import { app } from "@azure/functions";
import { BlobServiceClient } from "@azure/storage-blob";
import { clientPrincipal, hasRole, isAuthenticated } from "../auth.js";

const containerName = process.env.USERS_PHOTOS_CONTAINER_NAME || "directory-photos";
const readers = new Set(["maire", "adjoint", "conseiller", "agent-administratif", "agent-technique"]);
const writers = new Set(["maire", "adjoint", "agent-administratif"]);
const maximumBytes = 8 * 1024 * 1024;
const safeId = (value) => typeof value === "string" && /^[a-zA-Z0-9._-]{1,100}$/.test(value) ? value : null;
async function container() { const connection = process.env.USERS_STORAGE_CONNECTION_STRING || process.env.FIELD_FILES_STORAGE_CONNECTION_STRING || process.env.FIELD_ALERTS_STORAGE_CONNECTION_STRING; if (!connection) throw new Error("Stockage photo absent."); const value = BlobServiceClient.fromConnectionString(connection).getContainerClient(containerName); await value.createIfNotExists(); return value; }
function bytes(value) { const match = /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/.exec(value || ""); if (!match) return null; const body = Buffer.from(match[2], "base64"); return body.length && body.length <= maximumBytes ? { body, type: match[1] } : null; }

app.http("directory-photo-upload", { methods: ["POST"], authLevel: "anonymous", route: "directory-photos", handler: async (request, context) => {
  const user = clientPrincipal(request); if (!isAuthenticated(user)) return { status: 401, jsonBody: { error: "Authentification Azure requise." } }; if (!hasRole(user, writers)) return { status: 403, jsonBody: { error: "Envoi de photo non autorisé." } };
  try { const raw = await request.json(); const id = safeId(raw.id); const original = bytes(raw.dataUrl); const thumb = bytes(raw.thumbnailDataUrl); if (!id || !original || !thumb) return { status: 400, jsonBody: { error: "Photo invalide (JPEG, PNG ou WebP, 8 Mo maximum)." } }; const root = await container(); for (const [name, value] of [[`${id}-original`, original], [`${id}-thumb`, thumb]]) await root.getBlockBlobClient(name).uploadData(value.body, { blobHTTPHeaders: { blobContentType: value.type } }); return { status: 201, jsonBody: { photoUrl: `/api/directory-photos/${id}-original`, thumbnailUrl: `/api/directory-photos/${id}-thumb` } }; } catch (error) { context.error(error); return { status: 503, jsonBody: { error: "Envoi de la photo impossible." } }; }
} });
app.http("directory-photo-download", { methods: ["GET"], authLevel: "anonymous", route: "directory-photos/{id}", handler: async (request, context) => {
  const user = clientPrincipal(request); if (!isAuthenticated(user)) return { status: 401 }; if (!hasRole(user, readers)) return { status: 403 };
  try { const id = safeId(request.params.id); if (!id) return { status: 400 }; const blob = (await container()).getBlockBlobClient(id); const properties = await blob.getProperties(); return { status: 200, body: await blob.downloadToBuffer(), headers: { "content-type": properties.contentType || "image/jpeg", "cache-control": "private, max-age=3600" } }; } catch (error) { if (error.statusCode === 404) return { status: 404 }; context.error(error); return { status: 503 }; }
} });
