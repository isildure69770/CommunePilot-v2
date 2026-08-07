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
                Transformez ce
                signalement
                directement en
                chantier Voirie.
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
          </section>

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