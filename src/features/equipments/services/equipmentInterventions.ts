export interface EquipmentIntervention {
  id: string;
  title: string;
  description: string;
  date: string;
  status: "Prévue" | "En cours" | "Terminée";
}

function getStorageKey(
  equipmentId: string,
) {
  return `equipment-interventions-${equipmentId}`;
}

export function getEquipmentInterventions(
  equipmentId: string,
): EquipmentIntervention[] {
  const stored = localStorage.getItem(
    getStorageKey(equipmentId),
  );

  if (!stored) {
    return [];
  }

  try {
    return JSON.parse(
      stored,
    ) as EquipmentIntervention[];
  } catch {
    return [];
  }
}

export function saveEquipmentInterventions(
  equipmentId: string,
  interventions: EquipmentIntervention[],
) {
  localStorage.setItem(
    getStorageKey(equipmentId),
    JSON.stringify(interventions),
  );
}