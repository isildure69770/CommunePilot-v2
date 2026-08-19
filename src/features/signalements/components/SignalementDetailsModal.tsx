import {
  useEffect,
  useState,
} from "react";

import SignalementMap from "./SignalementMap";
import SignalementNotes from "./SignalementNotes";
import SignalementHistory from "./SignalementHistory";
import SignalementPhotos from "./SignalementPhotos";

import type {
  Signalement,
} from "../types/signalement";
import type { Mission } from "../../field/types";

import type {
  SignalementDetails,
} from "../types/signalementDetails";

import {
  loadSignalementDetails,
  saveSignalementDetails,
} from "../services/signalementDetailsStorage";

interface SignalementDetailsModalProps {
  signalement: Signalement | null;

  onClose: () => void;

  onEdit: (
    signalement: Signalement,
  ) => void;

  onCreateChantier: (
    signalement: Signalement,
  ) => void;
  onCreateMission?: (signalement: Signalement) => void;
  missions?: Mission[];
  onArchiveMission?: (mission: Mission) => void;
  onDeleteMission?: (mission: Mission) => void;
}

function formatDateTime(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(
    new Date(value),
  );
}

export default function SignalementDetailsModal({
  signalement,
  onClose,
  onEdit,
  onCreateChantier,
  onCreateMission,
  missions = [],
  onArchiveMission,
  onDeleteMission,
}: SignalementDetailsModalProps) {
  const [
    details,
    setDetails,
  ] =
    useState<SignalementDetails | null>(
      null,
    );

  useEffect(() => {
    if (!signalement) {
      setDetails(null);

      return;
    }

    const stored =
      loadSignalementDetails(
        signalement.id,
      );

    if (
      stored.history.length === 0
    ) {
      stored.history.push({
        id: Date.now(),

        action:
          "Fiche du signalement créée",

        createdAt:
          new Date().toISOString(),
      });

      saveSignalementDetails(
        stored,
      );
    }

    setDetails(stored);
  }, [signalement]);

  if (
    !signalement ||
    !details
  ) {
    return null;
  }

  function updateDetails(
    nextDetails:
      SignalementDetails,
  ) {
    setDetails(
      nextDetails,
    );

    saveSignalementDetails(
      nextDetails,
    );
  }

  function recordMissionAction(mission: Mission, action: "archivée" | "supprimée") {
    if (!details) return;
    if (!window.confirm(`Confirmer que la mission « ${mission.title} » est réalisée et peut être ${action} ?`)) return;
    if (action === "archivée") onArchiveMission?.(mission); else onDeleteMission?.(mission);
    updateDetails({ ...details, history: [{ id: Date.now(), action: `Mission « ${mission.title} » ${action} après validation de sa réalisation`, createdAt: new Date().toISOString() }, ...details.history] });
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={onClose}
    >
      <div
        className="signalement-details-modal"
        onMouseDown={(
          event,
        ) =>
          event.stopPropagation()
        }
      >
        <div className="signalement-details-header">
          <div>
            <span className="eyebrow">
              Fiche signalement
            </span>

            <h2>
              {signalement.title}
            </h2>

            <p>
              📍{" "}
              {
                signalement.location
              }
            </p>
          </div>

          <div className="signalement-details-header-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={() =>
                onEdit(
                  signalement,
                )
              }
            >
              Modifier
            </button>

            <button
              className="icon-button"
              type="button"
              onClick={onClose}
              aria-label="Fermer"
            >
              ×
            </button>
          </div>
        </div>

        <div className="signalement-details-content">

          <section className="signalement-details-section">
            <div className="signalement-section-heading">
              <div>
                <h3>
                  Lieu du
                  signalement
                </h3>

                <strong>
                  {
                    signalement.location
                  }
                </strong>
              </div>

              <small>
                {
                  signalement.latitude.toFixed(
                    6,
                  )
                }
                {" · "}
                {
                  signalement.longitude.toFixed(
                    6,
                  )
                }
              </small>
            </div>

            <SignalementMap
              latitude={
                signalement.latitude
              }
              longitude={
                signalement.longitude
              }
              title={
                signalement.title
              }
              location={
                signalement.location
              }
            />
          </section>

          <section className="signalement-details-section">
            <h3>
              Informations
              générales
            </h3>

            <div className="signalement-details-grid">
              <div>
                <span>
                  Catégorie
                </span>

                <strong>
                  {
                    signalement.category
                  }
                </strong>
              </div>

              <div>
                <span>
                  Statut
                </span>

                <strong>
                  {
                    signalement.status
                  }
                </strong>
              </div>

              <div>
                <span>
                  Priorité
                </span>

                <strong>
                  {
                    signalement.priority
                  }
                </strong>
              </div>

              <div>
                <span>
                  Responsable
                </span>

                <strong>
                  {
                    signalement.manager
                  }
                </strong>
              </div>

              <div>
                <span>
                  Déclaré par
                </span>

                <strong>
                  {
                    signalement.reporter
                  }
                </strong>
              </div>

              <div>
                <span>
                  Créé le
                </span>

                <strong>
                  {formatDateTime(
                    signalement.createdAt,
                  )}
                </strong>
              </div>
            </div>

            <div className="signalement-full-description">
              <span>
                Description
              </span>

              <p>
                {
                  signalement.description
                }
              </p>
            </div>
          </section>

          <section className="signalement-details-section conversion-section">
            <div>
              <h3>
                Intervention
                nécessaire ?
              </h3>

              <p>
                Créez un chantier Voirie ou affectez directement une mission à un agent.
              </p>
            </div>

            {signalement.convertedToChantierId ? (
              <div className="conversion-success">
                ✓ Chantier déjà
                créé
              </div>
            ) : (
              <button
                className="primary-button"
                type="button"
                onClick={() =>
                  onCreateChantier(
                    signalement,
                  )
                }
              >
                🚧 Créer un
                chantier
              </button>
            )}
            {onCreateMission && <button className="secondary-button" type="button" onClick={() => onCreateMission(signalement)}>📋 Créer une mission agent</button>}
          </section>

          {missions.length > 0 && <section className="signalement-details-section"><h3>Missions liées</h3><div className="signalement-linked-missions">{missions.map((mission) => <article key={mission.id} className={mission.archivedAt ? "is-archived" : ""}><div><strong>{mission.title}</strong><span>{mission.status}{mission.archivedAt ? " · Archivée" : ""}</span><small>{mission.assigneeIds.length} agent{mission.assigneeIds.length > 1 ? "s" : ""} affecté{mission.assigneeIds.length > 1 ? "s" : ""}</small></div>{mission.status === "Terminée" && !mission.archivedAt && <div className="signalement-mission-actions">{onArchiveMission&&<button className="secondary-button compact-button" type="button" onClick={() => recordMissionAction(mission,"archivée")}>Archiver</button>}{onDeleteMission&&<button className="danger-button compact-button" type="button" onClick={() => recordMissionAction(mission,"supprimée")}>Effacer</button>}</div>}{mission.status !== "Terminée"&&!mission.archivedAt&&<small className="mission-validation-hint">Les actions seront disponibles après validation de la réalisation.</small>}</article>)}</div></section>}

          <SignalementPhotos
            details={details}
            onChange={
              updateDetails
            }
          />

          <SignalementNotes
            details={details}
            onChange={
              updateDetails
            }
          />

          <SignalementHistory
            details={details}
          />
        </div>
      </div>
    </div>
  );
}
