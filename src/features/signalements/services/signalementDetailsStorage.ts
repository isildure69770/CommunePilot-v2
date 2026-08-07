import type {
  SignalementDetails,
} from "../types/signalementDetails";

const STORAGE_KEY =
  "communepilot-signalement-details";

function loadAllDetails(): SignalementDetails[] {
  const stored =
    localStorage.getItem(
      STORAGE_KEY,
    );

  if (!stored) {
    return [];
  }

  try {
    return JSON.parse(
      stored,
    ) as SignalementDetails[];
  } catch {
    return [];
  }
}

function saveAllDetails(
  details:
    SignalementDetails[],
) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(details),
  );
}

export function loadSignalementDetails(
  signalementId: number,
): SignalementDetails {
  const allDetails =
    loadAllDetails();

  const existing =
    allDetails.find(
      (details) =>
        details.signalementId ===
        signalementId,
    );

  if (existing) {
    return existing;
  }

  return {
    signalementId,

    notes: [],

    history: [],

    photos: [],
  };
}

export function saveSignalementDetails(
  details: SignalementDetails,
) {
  const allDetails =
    loadAllDetails();

  const exists =
    allDetails.some(
      (item) =>
        item.signalementId ===
        details.signalementId,
    );

  const updatedDetails =
    exists
      ? allDetails.map(
          (item) =>
            item.signalementId ===
            details.signalementId
              ? details
              : item,
        )
      : [
          ...allDetails,
          details,
        ];

  saveAllDetails(
    updatedDetails,
  );
}

export function deleteSignalementDetails(
  signalementId: number,
) {
  const allDetails =
    loadAllDetails();

  const updatedDetails =
    allDetails.filter(
      (item) =>
        item.signalementId !==
        signalementId,
    );

  saveAllDetails(
    updatedDetails,
  );
}