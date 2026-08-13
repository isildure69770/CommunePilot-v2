import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

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
import { useIdentity } from "../../access/LocalIdentityProvider";
import { useFieldData } from "../../field/useFieldData";
import { makeId } from "../../field/repository";
import type { Mission, MissionPriority } from "../../field/types";

export default function SignalementsPage() {
  const { user, users, can } = useIdentity();
  const { missions, saveMissions, notify } = useFieldData();
  const [params] = useSearchParams();
  const requestedCategory = params.get("commission");
  const requestedSignalementId = Number(params.get("signalement"));
  const {
    signalements,
    filteredSignalements,
    filters,
    statistics,
    setFilters,
    addSignalement,
    updateSignalement,
    deleteSignalement,
    resetFilters,
  } = useSignalements();
  useEffect(() => {
    if (requestedCategory) setFilters((current) => ({ ...current, category: requestedCategory }));
  }, [requestedCategory, setFilters]);

  const [isFormOpen, setIsFormOpen] =
    useState(false);

  const [
    selectedSignalement,
    setSelectedSignalement,
  ] = useState<Signalement | null>(
    null,
  );
  const [missionSignalement, setMissionSignalement] = useState<Signalement | null>(null);
  const [missionForm, setMissionForm] = useState({ assigneeIds: [] as string[], priority: "Normale" as MissionPriority, dueDate: "", instructions: "" });

  const [
    openedSignalement,
    setOpenedSignalement,
  ] = useState<Signalement | null>(
    null,
  );

  useEffect(() => {
    if (!Number.isFinite(requestedSignalementId) || requestedSignalementId <= 0) return;
    const requested = signalements.find((signalement) => signalement.id === requestedSignalementId);
    if (requested) setOpenedSignalement(requested);
  }, [requestedSignalementId, signalements]);

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

  function handleCreateMission(event: React.FormEvent) {
    event.preventDefault();
    if (!missionSignalement || !missionForm.assigneeIds.length) return;
    const now = new Date().toISOString();
    const chantierAlreadyExists = Boolean(missionSignalement.convertedToChantierId);
    const chantierId = missionSignalement.convertedToChantierId ?? createChantierFromSignalement(missionSignalement).id;
    const mission: Mission = {
      id: makeId("mission"), title: missionSignalement.title,
      description: [missionSignalement.description, missionForm.instructions.trim(), `Chantier lié #${chantierId}`].filter(Boolean).join("\n\n"),
      address: missionSignalement.location, latitude: missionSignalement.latitude, longitude: missionSignalement.longitude,
      priority: missionForm.priority, status: "À faire", dueDate: missionForm.dueDate, category: "Voirie",
      signalementId: missionSignalement.id, chantierId,
      assigneeIds: missionForm.assigneeIds, attachments: [], reports: [],
      history: [{ id: makeId("history"), at: now, userId: user.id, label: `Mission créée depuis le signalement #${missionSignalement.id} et liée au chantier #${chantierId}` }],
      createdAt: now, updatedAt: now,
    };
    saveMissions([mission, ...missions]);
    notify({ userIds: missionForm.assigneeIds, title: "Nouvelle mission Voirie", message: mission.title, link: "/terrain" });
    const updated = { ...missionSignalement, status: "En cours" as const, convertedToChantierId: chantierId, updatedAt: now };
    updateSignalement(updated); setOpenedSignalement(updated); setMissionSignalement(null);
    setMissionForm({ assigneeIds: [], priority: "Normale", dueDate: "", instructions: "" });
    window.alert(chantierAlreadyExists ? "La mission a été affectée à l’agent et reliée au chantier existant." : "La mission a été affectée à l’agent et le chantier Voirie a été créé automatiquement.");
  }

  function archiveMission(mission: Mission) {
    const now = new Date().toISOString();
    saveMissions(missions.map((item) => item.id === mission.id ? { ...item, archivedAt: now, updatedAt: now, history: [...item.history, { id: makeId("history"), at: now, userId: user.id, label: "Mission archivée après validation de sa réalisation" }] } : item));
  }

  function deleteMission(mission: Mission) {
    saveMissions(missions.filter((item) => item.id !== mission.id));
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
        initialCategory={requestedCategory === "Bâtiments" ? "Bâtiment" : requestedCategory === "Voirie" ? "Voirie" : undefined}
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
        onCreateMission={can("missions", "create") && can("equipements", "create") ? (signalement) => { setMissionForm((current) => ({ ...current, priority: signalement.priority === "Faible" ? "Basse" : signalement.priority })); setMissionSignalement(signalement); } : undefined}
        missions={openedSignalement ? missions.filter((mission) => mission.signalementId === openedSignalement.id || mission.history.some((entry) => entry.label.includes(`signalement #${openedSignalement.id}`))) : []}
        onArchiveMission={can("missions", "update") ? archiveMission : undefined}
        onDeleteMission={can("missions", "delete") ? deleteMission : undefined}
      />
      {missionSignalement && <div className="modal-backdrop" onMouseDown={() => setMissionSignalement(null)}><div className="modal mission-modal" onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><div><span className="eyebrow">Signalement Voirie #{missionSignalement.id}</span><h3>Créer une mission et un chantier</h3></div><button className="icon-button" type="button" onClick={() => setMissionSignalement(null)}>×</button></div><form className="field-form" onSubmit={handleCreateMission}><div className="locked-context"><strong>{missionSignalement.title}</strong><span>{missionSignalement.location}</span></div><fieldset><legend>Agents techniques</legend>{users.filter((candidate) => candidate.active && candidate.role === "Agent technique").map((agent) => <label className="toggle-row" key={agent.id}><input type="checkbox" checked={missionForm.assigneeIds.includes(agent.id)} onChange={(event) => setMissionForm({...missionForm,assigneeIds:event.target.checked?[...missionForm.assigneeIds,agent.id]:missionForm.assigneeIds.filter((id)=>id!==agent.id)})}/>{agent.firstName} {agent.lastName}</label>)}</fieldset><div className="form-row"><label>Priorité<select value={missionForm.priority} onChange={(event) => setMissionForm({...missionForm,priority:event.target.value as MissionPriority})}><option>Basse</option><option>Normale</option><option>Haute</option><option>Urgente</option></select></label><label>Échéance<input type="datetime-local" value={missionForm.dueDate} onChange={(event) => setMissionForm({...missionForm,dueDate:event.target.value})}/></label></div><label>Consigne complémentaire<textarea rows={3} value={missionForm.instructions} onChange={(event) => setMissionForm({...missionForm,instructions:event.target.value})} placeholder="Précisions pour les agents…"/></label><p className="conversion-notice">🚧 Le chantier correspondant sera créé automatiquement lors de la validation.</p><div className="modal-actions"><button className="secondary-button" type="button" onClick={() => setMissionSignalement(null)}>Annuler</button><button className="primary-button" disabled={!missionForm.assigneeIds.length}>Créer et notifier {missionForm.assigneeIds.length > 1 ? "les agents" : "l’agent"}</button></div></form></div></div>}
    </section>
  );
}
