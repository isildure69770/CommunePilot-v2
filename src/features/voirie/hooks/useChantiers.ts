import { useEffect, useMemo, useState } from "react";
import { initialChantiers } from "../data/chantiers";
import {
  loadChantiers,
  saveChantiers,
} from "../services/chantierStorage";
import type {
  Chantier,
  ChantierPriority,
  ChantierStatus,
} from "../types/chantier";

export interface ChantierFilters {
  search: string;
  status: ChantierStatus | "Tous";
  priority: ChantierPriority | "Toutes";
}

const defaultFilters: ChantierFilters = {
  search: "",
  status: "Tous",
  priority: "Toutes",
};

export function useChantiers() {
  const [chantiers, setChantiers] = useState<Chantier[]>(
    () => loadChantiers() ?? initialChantiers,
  );

  const [filters, setFilters] =
    useState<ChantierFilters>(defaultFilters);

  useEffect(() => {
    saveChantiers(chantiers);
  }, [chantiers]);

  const filteredChantiers = useMemo(() => {
    const normalizedSearch = filters.search
      .trim()
      .toLowerCase();

    return chantiers.filter((chantier) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          chantier.title,
          chantier.description,
          chantier.location,
          chantier.company,
          chantier.manager,
          chantier.status,
          chantier.priority,
        ].some((value) =>
          value.toLowerCase().includes(normalizedSearch),
        );

      const matchesStatus =
        filters.status === "Tous" ||
        chantier.status === filters.status;

      const matchesPriority =
        filters.priority === "Toutes" ||
        chantier.priority === filters.priority;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );
    });
  }, [chantiers, filters]);

  const statistics = useMemo(() => {
    return {
      total: chantiers.length,
      planned: chantiers.filter(
        (chantier) => chantier.status === "Planifié",
      ).length,
      inProgress: chantiers.filter(
        (chantier) => chantier.status === "En cours",
      ).length,
      urgent: chantiers.filter(
        (chantier) => chantier.priority === "Urgente",
      ).length,
    };
  }, [chantiers]);

  function addChantier(
    value: Omit<
      Chantier,
      "id" | "createdAt" | "updatedAt"
    >,
  ) {
    const now = new Date().toISOString();

    const newChantier: Chantier = {
      ...value,
      id: Date.now(),
      createdAt: now,
      updatedAt: now,
    };

    setChantiers((currentChantiers) => [
      newChantier,
      ...currentChantiers,
    ]);
  }

  function updateChantier(updatedChantier: Chantier) {
    setChantiers((currentChantiers) =>
      currentChantiers.map((chantier) =>
        chantier.id === updatedChantier.id
          ? {
              ...updatedChantier,
              updatedAt: new Date().toISOString(),
            }
          : chantier,
      ),
    );
  }

  function deleteChantier(id: number) {
    setChantiers((currentChantiers) =>
      currentChantiers.filter(
        (chantier) => chantier.id !== id,
      ),
    );
  }

  function resetFilters() {
    setFilters(defaultFilters);
  }

  return {
    chantiers,
    filteredChantiers,
    filters,
    statistics,
    setFilters,
    addChantier,
    updateChantier,
    deleteChantier,
    resetFilters,
  };
}