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
  if (!file.type.startsWith("image/")) { const dataUrl = await readDataUrl(file); return { dataUrl, thumbnailDataUrl: dataUrl }; }
  const source = await readDataUrl(file);
  return new Promise<{ dataUrl: string; thumbnailDataUrl: string }>((resolve) => {
    const image = new Image();
    image.onerror = () => resolve({ dataUrl: source, thumbnailDataUrl: source });
    image.onload = () => {
      const render = (maxSide: number, quality: number) => {
        const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL("image/jpeg", quality);
      };
      try { resolve({ dataUrl: render(1600, .78), thumbnailDataUrl: render(360, .62) }); }
      catch { resolve({ dataUrl: source, thumbnailDataUrl: source }); }
    };
    image.src = source;
  });
}

export async function filesToAttachments(files: FileList | null, kind: "photo" | "document", phase?: FileAttachment["phase"]) {
  if (!files) return [];
  return Promise.all(Array.from(files).map(async (file): Promise<FileAttachment> => {
    const optimized = kind === "photo" ? await optimizePhoto(file) : undefined;
    return { id: makeId("file"), name: file.name, type: kind === "photo" ? "image/jpeg" : file.type, dataUrl: optimized?.dataUrl ?? await readDataUrl(file), thumbnailDataUrl: optimized?.thumbnailDataUrl, addedAt: new Date().toISOString(), kind, phase };
  }));
}
