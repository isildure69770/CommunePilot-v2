const STORAGE_KEY =
  "communepilot-equipment-photos";

type EquipmentPhotosMap = Record<
  string,
  string[]
>;

function readPhotos(): EquipmentPhotosMap {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return {};
    }

    return JSON.parse(
      raw,
    ) as EquipmentPhotosMap;
  } catch {
    return {};
  }
}

export function getEquipmentPhotos(
  equipmentId: string,
) {
  const photos = readPhotos();

  return photos[equipmentId] ?? [];
}

export function saveEquipmentPhotos(
  equipmentId: string,
  photos: string[],
) {
  const allPhotos = readPhotos();

  allPhotos[equipmentId] = photos;

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(allPhotos),
  );
}