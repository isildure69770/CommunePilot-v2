const STORAGE_KEY =
  "communepilot-equipment-notes";

type EquipmentNotesMap = Record<
  string,
  string
>;

function readNotes(): EquipmentNotesMap {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return {};
    }

    return JSON.parse(raw) as EquipmentNotesMap;
  } catch {
    return {};
  }
}

export function getEquipmentNote(
  equipmentId: string,
) {
  const notes = readNotes();

  return notes[equipmentId] ?? "";
}

export function saveEquipmentNote(
  equipmentId: string,
  note: string,
) {
  const notes = readNotes();

  notes[equipmentId] = note;

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(notes),
  );
}