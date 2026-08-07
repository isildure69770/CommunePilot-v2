export interface SignalementNote {
  id: number;
  text: string;
  createdAt: string;
}

export interface SignalementHistoryEntry {
  id: number;
  action: string;
  createdAt: string;
}

export interface SignalementPhoto {
  id: number;
  url: string;
  createdAt: string;
}

export interface SignalementDetails {
  signalementId: number;

  notes: SignalementNote[];

  history: SignalementHistoryEntry[];

  photos: SignalementPhoto[];
}