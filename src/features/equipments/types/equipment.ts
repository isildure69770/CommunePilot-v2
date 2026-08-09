export interface Equipment {
  id: string;

  osmId?: number;

  name: string;
  type: string;

  latitude: number;
  longitude: number;

  description?: string;
  notes?: string;

  address?: string;

  photos?: string[];
  documents?: string[];

  createdAt?: string;
  updatedAt?: string;
}