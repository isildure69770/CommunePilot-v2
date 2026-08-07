import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import type {
  Signalement,
  SignalementCategory,
  SignalementPriority,
  SignalementStatus,
} from "../types/signalement";

type SignalementFormValue = Omit<
  Signalement,
  "id" | "createdAt" | "updatedAt"
>;

interface SignalementFormProps {
  isOpen: boolean;
  signalement?: Signalement | null;
  onClose: () => void;
  onSubmit: (value: SignalementFormValue) => void;
}

const emptyForm: SignalementFormValue = {
  title: "",
  description: "",
  category: "Voirie",
  status: "Nouveau",
  priority: "Normale",
  location: "",
  latitude: 45.790833,
  longitude: 4.4675,
  reporter: "Mairie",
  manager: "",
};

export default function SignalementForm({
  isOpen,
  signalement,
  onClose,
  onSubmit,
}: SignalementFormProps) {
  const [form, setForm] =
    useState<SignalementFormValue>(emptyForm);

  useEffect(() => {
    if (signalement) {
      setForm({
        title: signalement.title,
        description: signalement.description,
        category: signalement.category,
        status: signalement.status,
        priority: signalement.priority,
        location: signalement.location,
        latitude: signalement.latitude,
        longitude: signalement.longitude,
        reporter: signalement.reporter,
        manager: signalement.manager,
        resolvedAt: signalement.resolvedAt,
      });
    } else {
      setForm(emptyForm);
    }
  }, [signalement, isOpen]);

  if (!isOpen) {
    return null;
  }

  function updateField<Key extends keyof SignalementFormValue>(
    key: Key,
    value: SignalementFormValue[Key],
  ) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !form.location.trim() ||
      !form.manager.trim()
    ) {
      return;
    }

    onSubmit({
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      reporter: form.reporter.trim(),
      manager: form.manager.trim(),
    });

    onClose();
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={onClose}
    >
      <div
        className="modal"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">
              {signalement
                ? "Modification"
                : "Nouveau signalement"}
            </span>

            <h3>
              {signalement
                ? "Modifier le signalement"
                : "Créer un signalement"}
            </h3>
          </div>

          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <form
          className="project-form"
          onSubmit={handleSubmit}
        >
          <label>
            Intitulé
            <input
              type="text"
              value={form.title}
              onChange={(event) =>
                updateField(
                  "title",
                  event.target.value,
                )
              }
              required
            />
          </label>

          <label>
            Description
            <textarea
              rows={4}
              value={form.description}
              onChange={(event) =>
                updateField(
                  "description",
                  event.target.value,
                )
              }
              required
            />
          </label>

          <label>
            Catégorie
            <select
              value={form.category}
              onChange={(event) =>
                updateField(
                  "category",
                  event.target
                    .value as SignalementCategory,
                )
              }
            >
              <option>Voirie</option>
              <option>Bâtiment</option>
              <option>Espaces verts</option>
              <option>Éclairage public</option>
              <option>Eau</option>
              <option>Déchets</option>
              <option>Sécurité</option>
              <option>Mobilier urbain</option>
              <option>Divers</option>
            </select>
          </label>

          <label>
            Statut
            <select
              value={form.status}
              onChange={(event) =>
                updateField(
                  "status",
                  event.target
                    .value as SignalementStatus,
                )
              }
            >
              <option>Nouveau</option>
              <option>À traiter</option>
              <option>En cours</option>
              <option>En attente</option>
              <option>Résolu</option>
              <option>Classé</option>
            </select>
          </label>

          <label>
            Priorité
            <select
              value={form.priority}
              onChange={(event) =>
                updateField(
                  "priority",
                  event.target
                    .value as SignalementPriority,
                )
              }
            >
              <option>Faible</option>
              <option>Normale</option>
              <option>Haute</option>
              <option>Urgente</option>
            </select>
          </label>

          <label>
            Lieu
            <input
              type="text"
              value={form.location}
              onChange={(event) =>
                updateField(
                  "location",
                  event.target.value,
                )
              }
              required
            />
          </label>

          <label>
            Déclaré par
            <input
              type="text"
              value={form.reporter}
              onChange={(event) =>
                updateField(
                  "reporter",
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            Responsable
            <input
              type="text"
              value={form.manager}
              onChange={(event) =>
                updateField(
                  "manager",
                  event.target.value,
                )
              }
              required
            />
          </label>

          <div className="modal-actions">
            <button
              className="secondary-button"
              type="button"
              onClick={onClose}
            >
              Annuler
            </button>

            <button
              className="primary-button"
              type="submit"
            >
              {signalement
                ? "Enregistrer"
                : "Créer le signalement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}