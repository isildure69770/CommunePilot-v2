import { makeId } from "./repository";
import type { FileAttachment } from "./types";
export async function filesToAttachments(files: FileList | null, kind: "photo" | "document", phase?: "avant" | "après") {
  if (!files) return [];
  return Promise.all(Array.from(files).map((file) => new Promise<FileAttachment>((resolve, reject) => {
    const reader = new FileReader(); reader.onerror = () => reject(reader.error); reader.onload = () => resolve({ id: makeId("file"), name: file.name, type: file.type, dataUrl: String(reader.result), addedAt: new Date().toISOString(), kind, phase }); reader.readAsDataURL(file);
  })));
}
