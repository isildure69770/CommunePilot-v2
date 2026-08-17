import { makeId } from "./repository";
import type { FileAttachment } from "./types";

function readDataUrl(file: Blob) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(String(reader.result));
    reader.readAsDataURL(file);
  });
}

async function optimizePhoto(file: File) {
  if (!file.type.startsWith("image/")) return readDataUrl(file);
  const source = await readDataUrl(file);
  return new Promise<string>((resolve) => {
    const image = new Image();
    image.onerror = () => resolve(source);
    image.onload = () => {
      const maxSide = 1600;
      const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
      try { resolve(canvas.toDataURL("image/jpeg", .78)); } catch { resolve(source); }
    };
    image.src = source;
  });
}

export async function filesToAttachments(files: FileList | null, kind: "photo" | "document", phase?: FileAttachment["phase"]) {
  if (!files) return [];
  return Promise.all(Array.from(files).map(async (file): Promise<FileAttachment> => ({
    id: makeId("file"),
    name: file.name,
    type: kind === "photo" ? "image/jpeg" : file.type,
    dataUrl: kind === "photo" ? await optimizePhoto(file) : await readDataUrl(file),
    addedAt: new Date().toISOString(),
    kind,
    phase,
  })));
}
