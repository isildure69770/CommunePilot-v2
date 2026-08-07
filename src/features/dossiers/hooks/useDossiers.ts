import { useEffect, useMemo, useState } from "react";
import { initialDossiers } from "../data/dossiers";
import {
  loadDossiers,
  saveDossiers,
} from "../services/dossierStorage";
import type {
  Dossier,
  DossierPriority,
  DossierStatus,
} from "../types/dossier";

export interface DossierFilters {
  search: string;
  status: DossierStatus | "Tous";
  priority: DossierPriority | "Toutes";
  category: string;
}

const defaultFilters: DossierFilters = {
  search: "",
  status: "Tous",
  priority: "Toutes",
  category: "Toutes",
};

export function useDossiers() {
  const [dossiers, setDossiers] = useState<Dossier[]>(() => {
    return loadDossiers() ?? initialDossiers;
  });

  const [filters, setFilters] =
    useState<DossierFilters>(defaultFilters);

  useEffect(() => {
    saveDossiers(dossiers);
  }, [dossiers]);

  const categories = useMemo(() => {
    return Array.from(
      new Set(dossiers.map((dossier) => dossier.category)),
    ).sort();
  }, [dossiers]);

  const filteredDossiers = useMemo(() => {
    const normalizedSearch = filters.search
      .trim()
      .toLowerCase();

    return dossiers.filter((dossier) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          dossier.title,
          dossier.description,
          dossier.category,
          dossier.manager,
          dossier.status,
          dossier.priority,
        ].some((value) =>
          value.toLowerCase().includes(normalizedSearch),
        );

      const matchesStatus =
        filters.status === "Tous" ||
        dossier.status === filters.status;

      const matchesPriority =
        filters.priority === "Toutes" ||
        dossier.priority === filters.priority;

      const matchesCategory =
        filters.category === "Toutes" ||
        dossier.category === filters.category;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority &&
        matchesCategory
      );
    });
  }, [dossiers, filters]);

  function addDossier(
    dossier: Omit<Dossier, "id" | "createdAt" | "updatedAt">,
  ) {
    const now = new Date().toISOString();

    const newDossier: Dossier = {
      ...dossier,
      id: Date.now(),
      createdAt: now,
      updatedAt: now,
    };

    setDossiers((currentDossiers) => [
      newDossier,
      ...currentDossiers,
    ]);
  }

  function updateDossier(updatedDossier: Dossier) {
    setDossiers((currentDossiers) =>
      currentDossiers.map((dossier) =>
        dossier.id === updatedDossier.id
          ? {
              ...updatedDossier,
              updatedAt: new Date().toISOString(),
            }
          : dossier,
      ),
    );
  }

  function deleteDossier(id: number) {
    setDossiers((currentDossiers) =>
      currentDossiers.filter(
        (dossier) => dossier.id !== id,
      ),
    );
  }

  function resetFilters() {
    setFilters(defaultFilters);
  }

  return {
    dossiers,
    filteredDossiers,
    filters,
    categories,
    setFilters,
    addDossier,
    updateDossier,
    deleteDossier,
    resetFilters,
  };
}