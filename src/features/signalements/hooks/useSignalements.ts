import { useEffect, useMemo, useState } from "react";
import { initialSignalements } from "../data/signalements";
import {
  loadSignalements,
  saveSignalements,
} from "../services/signalementStorage";

import type {
  Signalement,
  SignalementPriority,
  SignalementStatus,
} from "../types/signalement";

export interface SignalementFilters {
  search: string;
  status: SignalementStatus | "Tous";
  priority: SignalementPriority | "Toutes";
  category: string;
}

const defaultFilters: SignalementFilters = {
  search: "",
  status: "Tous",
  priority: "Toutes",
  category: "Toutes",
};

export function useSignalements() {
  const [signalements, setSignalements] =
    useState<Signalement[]>(
      () => loadSignalements() ?? initialSignalements,
    );

  const [filters, setFilters] =
    useState<SignalementFilters>(defaultFilters);

  useEffect(() => {
    saveSignalements(signalements);
  }, [signalements]);

  const filteredSignalements = useMemo(() => {
    const search = filters.search
      .trim()
      .toLowerCase();

    return signalements.filter((signalement) => {
      const matchesSearch =
        !search ||
        [
          signalement.title,
          signalement.description,
          signalement.location,
          signalement.manager,
          signalement.category,
          signalement.status,
        ].some((value) =>
          value.toLowerCase().includes(search),
        );

      const matchesStatus =
        filters.status === "Tous" ||
        signalement.status === filters.status;

      const matchesPriority =
        filters.priority === "Toutes" ||
        signalement.priority === filters.priority;

      const matchesCategory = filters.category === "Toutes" || signalement.category === filters.category || (filters.category === "Bâtiments" && signalement.category === "Bâtiment");

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority && matchesCategory
      );
    });
  }, [signalements, filters]);

  const statistics = useMemo(() => {
    return {
      total: signalements.length,

      nouveaux: signalements.filter(
        (s) => s.status === "Nouveau",
      ).length,

      enCours: signalements.filter(
        (s) => s.status === "En cours",
      ).length,

      urgents: signalements.filter(
        (s) => s.priority === "Urgente",
      ).length,
    };
  }, [signalements]);

  function addSignalement(
    value: Omit<
      Signalement,
      "id" | "createdAt" | "updatedAt"
    >,
  ) {
    const now = new Date().toISOString();

    const nouveau: Signalement = {
      ...value,
      id: Date.now(),
      createdAt: now,
      updatedAt: now,
    };

    setSignalements((current) => [
      nouveau,
      ...current,
    ]);
  }

  function updateSignalement(
    signalement: Signalement,
  ) {
    setSignalements((current) =>
      current.map((item) =>
        item.id === signalement.id
          ? {
              ...signalement,
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    );
  }

  function deleteSignalement(id: number) {
    setSignalements((current) =>
      current.filter((item) => item.id !== id),
    );
  }

  function resetFilters() {
    setFilters(defaultFilters);
  }

  return {
    signalements,
    filteredSignalements,

    filters,
    statistics,

    setFilters,

    addSignalement,
    updateSignalement,
    deleteSignalement,

    resetFilters,
  };
}
