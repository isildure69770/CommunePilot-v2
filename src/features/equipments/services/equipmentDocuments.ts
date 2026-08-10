export interface EquipmentDocument {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  addedAt: string;
}

function getStorageKey(
  equipmentId: string,
) {
  return `equipment-documents-${equipmentId}`;
}

export function getEquipmentDocuments(
  equipmentId: string,
): EquipmentDocument[] {
  const stored = localStorage.getItem(
    getStorageKey(equipmentId),
  );

  if (!stored) {
    return [];
  }

  try {
    return JSON.parse(
      stored,
    ) as EquipmentDocument[];
  } catch {
    return [];
  }
}

export function saveEquipmentDocuments(
  equipmentId: string,
  documents: EquipmentDocument[],
) {
  localStorage.setItem(
    getStorageKey(equipmentId),
    JSON.stringify(documents),
  );
}

export function deleteEquipmentDocument(
  equipmentId: string,
  documentId: string,
) {
  const documents =
    getEquipmentDocuments(equipmentId);

  const updatedDocuments =
    documents.filter(
      (document) =>
        document.id !== documentId,
    );

  saveEquipmentDocuments(
    equipmentId,
    updatedDocuments,
  );

  return updatedDocuments;
}