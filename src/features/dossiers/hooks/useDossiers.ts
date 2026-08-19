import { useEffect, useMemo, useState } from "react";
import { initialDossiers } from "../data/dossiers";
import {
  loadDossiers,
  saveDossiers,
} from "../services/dossierStorage";
import { isUncategorizedDossier } from "../dossierCategories";
import { useIdentity } from "../../access/LocalIdentityProvider";
import { dossierActivityRepository } from "../services/dossierActivityRepository";

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
  const { user } = useIdentity();
  const [dossiers, setDossiers] = useState<Dossier[]>(
    () => loadDossiers() ?? initialDossiers,
  );

  const [filters, setFilters] =
    useState<DossierFilters>(defaultFilters);

  useEffect(() => {
    saveDossiers(dossiers);
  }, [dossiers]);

  const filteredDossiers = useMemo(() => {
    const normalizedSearch = filters.search
      .trim()
      .toLowerCase();

    return dossiers.filter((dossier) => {
      if (!isUncategorizedDossier(dossier)) return false;

      const matchesSearch =
        !normalizedSearch ||
        [
          dossier.title,
          dossier.description,
          dossier.manager,
          dossier.status,
          dossier.priority,
        ].some((value) =>
          value
            .toLowerCase()
            .includes(normalizedSearch),
        );

      const matchesStatus =
        filters.status === "Tous" ||
        dossier.status === filters.status;

      const matchesPriority =
        filters.priority === "Toutes" ||
        dossier.priority === filters.priority;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );
    });
  }, [dossiers, filters]);

  function addDossier(
    dossier: Omit<
      Dossier,
      "id" | "createdAt" | "updatedAt"
    >,
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
    dossierActivityRepository.add({ dossierId: newDossier.id, type: "dossier", action: "created", label: `${user.firstName} a créé le dossier`, authorId: user.id, timestamp: now });
  }

  function updateDossier(updatedDossier: Dossier) {
    const previous = dossiers.find((dossier) => dossier.id === updatedDossier.id);
    const now = new Date().toISOString();
    setDossiers((currentDossiers) =>
      currentDossiers.map((dossier) =>
        dossier.id === updatedDossier.id
          ? {
              ...updatedDossier,
              updatedAt: now,
            }
          : dossier,
      ),
    );
    if (previous) dossierActivityRepository.add({ dossierId: updatedDossier.id, type: "dossier", action: "updated", label: `${user.firstName} a modifié le dossier`, authorId: user.id, timestamp: now });
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
    setFilters,
    addDossier,
    updateDossier,
    deleteDossier,
    resetFilters,
  };
}
