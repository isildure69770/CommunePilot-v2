import { useState } from "react";

import SignalementCard from "../components/SignalementCard";
import SignalementFilters from "../components/SignalementFilters";
import SignalementForm from "../components/SignalementForm";
import SignalementDetailsModal from "../components/SignalementDetailsModal";

import { useSignalements } from "../hooks/useSignalements";

import {
  createChantierFromSignalement,
} from "../services/signalementToChantier";

import type {
  Signalement,
} from "../types/signalement";

export default function SignalementsPage() {
  const {
    filteredSignalements,
    filters,
    statistics,
    setFilters,
    addSignalement,
    updateSignalement,
    deleteSignalement,
    resetFilters,
  } = useSignalements();

  const [isFormOpen, setIsFormOpen] =
    useState(false);

  const [
    selectedSignalement,
    setSelectedSignalement,
  ] = useState<Signalement | null>(
    null,
  );

  const [
    openedSignalement,
    setOpenedSignalement,
  ] = useState<Signalement | null>(
    null,
  );

  function openCreateForm() {
    setSelectedSignalement(
      null,
    );

    setIsFormOpen(
      true,
    );
  }

  function openEditForm(
    signalement: Signalement,
  ) {
    setSelectedSignalement(
      signalement,
    );

    setIsFormOpen(
      true,
    );
  }

  function closeForm() {
    setSelectedSignalement(
      null,
    );

    setIsFormOpen(
      false,
    );
  }

  function handleSubmit(
    value: Omit<
      Signalement,
      "id" | "createdAt" | "updatedAt"
    >,
  ) {
    if (
      selectedSignalement
    ) {
      const updatedSignalement: Signalement = {
        ...selectedSignalement,
        ...value,
      };

      updateSignalement(
        updatedSignalement,
      );

      if (
        openedSignalement?.id ===
        updatedSignalement.id
      ) {
        setOpenedSignalement(
          updatedSignalement,
        );
      }

      return;
    }

    addSignalement(
      value,
    );
  }

  function handleDeleteSignalement(
    id: number,
  ) {
    deleteSignalement(
      id,
    );

    if (
      openedSignalement?.id ===
      id
    ) {
      setOpenedSignalement(
        null,
      );
    }

    if (
      selectedSignalement?.id ===
      id
    ) {
      closeForm();
    }
  }

  function handleCreateChantier(
    signalement: Signalement,
  ) {
    if (
      signalement.convertedToChantierId
    ) {
      window.alert(
        "Un chantier a déjà été créé à partir de ce signalement.",
      );

      return;
    }

    const chantier =
      createChantierFromSignalement(
        signalement,
      );

    const updatedSignalement: Signalement = {
      ...signalement,

      status:
        "En cours",

      convertedToChantierId:
        chantier.id,

      updatedAt:
        new Date().toISOString(),
    };

    updateSignalement(
      updatedSignalement,
    );

    setOpenedSignalement(
      updatedSignalement,
    );

    window.alert(
      `Le chantier « ${chantier.title} » a été créé dans le module Voirie.`,
    );
  }

  return (
    <section className="signalements-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            Gestion terrain
          </span>

          <h2>
            Signalements
          </h2>

          <p>
            Centralisez les
            incidents, demandes
            et anomalies constatés
            sur la commune.
          </p>
        </div>

        <button
          className="primary-button"
          type="button"
          onClick={
            openCreateForm
          }
        >
          + Nouveau signalement
        </button>
      </div>

      <div className="signalement-statistics">
        <article>
          <span>
            Total
          </span>

          <strong>
            {
              statistics.total
            }
          </strong>
        </article>

        <article>
          <span>
            Nouveaux
          </span>

          <strong>
            {
              statistics.nouveaux
            }
          </strong>
        </article>

        <article>
          <span>
            En cours
          </span>

          <strong>
            {
              statistics.enCours
            }
          </strong>
        </article>

        <article>
          <span>
            Urgents
          </span>

          <strong>
            {
              statistics.urgents
            }
          </strong>
        </article>
      </div>

      <SignalementFilters
        filters={
          filters
        }
        onChange={
          setFilters
        }
        onReset={
          resetFilters
        }
      />

      <div className="signalements-summary">
        <strong>
          {
            filteredSignalements.length
          }
        </strong>

        <span>
          signalement
          {
            filteredSignalements.length >
            1
              ? "s"
              : ""
          }{" "}
          affiché
          {
            filteredSignalements.length >
            1
              ? "s"
              : ""
          }
        </span>
      </div>

      {filteredSignalements.length >
      0 ? (
        <div className="signalements-grid">
          {filteredSignalements.map(
            (
              signalement,
            ) => (
              <SignalementCard
                key={
                  signalement.id
                }
                signalement={
                  signalement
                }
                onOpen={
                  setOpenedSignalement
                }
                onEdit={
                  openEditForm
                }
                onDelete={
                  handleDeleteSignalement
                }
              />
            ),
          )}
        </div>
      ) : (
        <div className="empty-state">
          Aucun signalement ne
          correspond aux filtres.
        </div>
      )}

      <SignalementForm
        isOpen={
          isFormOpen
        }
        signalement={
          selectedSignalement
        }
        onClose={
          closeForm
        }
        onSubmit={
          handleSubmit
        }
      />

      <SignalementDetailsModal
        signalement={
          openedSignalement
        }
        onClose={() =>
          setOpenedSignalement(
            null,
          )
        }
        onEdit={(
          signalement,
        ) => {
          setOpenedSignalement(
            null,
          );

          openEditForm(
            signalement,
          );
        }}
        onCreateChantier={
          handleCreateChantier
        }
      />
    </section>
  );
}