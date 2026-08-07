import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import type {
  Chantier,
  ChantierPriority,
  ChantierStatus,
} from "../types/chantier";

type ChantierFormValue = Omit<
  Chantier,
  "id" | "createdAt" | "updatedAt"
>;

interface ChantierFormProps {
  isOpen: boolean;
  chantier?: Chantier | null;
  onClose: () => void;
  onSubmit: (value: ChantierFormValue) => void;
}

const emptyForm: ChantierFormValue = {
  title: "",
  description: "",
  location: "",
  company: "",
  manager: "",
  status: "À étudier",
  priority: "Normale",
  startDate: "",
  endDate: "",
  estimatedBudget: 0,
  actualCost: 0,
  progress: 0,
};

export default function ChantierForm({
  isOpen,
  chantier,
  onClose,
  onSubmit,
}: ChantierFormProps) {
  const [form, setForm] =
    useState<ChantierFormValue>(emptyForm);

  useEffect(() => {
    if (chantier) {
      setForm({
        title: chantier.title,
        description: chantier.description,
        location: chantier.location,
        company: chantier.company,
        manager: chantier.manager,
        status: chantier.status,
        priority: chantier.priority,
        startDate: chantier.startDate,
        endDate: chantier.endDate,
        estimatedBudget: chantier.estimatedBudget,
        actualCost: chantier.actualCost,
        progress: chantier.progress,
      });
    } else {
      setForm(emptyForm);
    }
  }, [chantier, isOpen]);

  if (!isOpen) {
    return null;
  }

  function updateField<Key extends keyof ChantierFormValue>(
    key: Key,
    value: ChantierFormValue[Key],
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
      company: form.company.trim() || "À définir",
      manager: form.manager.trim(),
      progress: Math.min(
        100,
        Math.max(0, form.progress),
      ),
    });

    onClose();
  }

  return (
    <div
      className="modal-backdrop"
      onMouseDown={onClose}
    >
      <div
        className="modal chantier-modal"
        onMouseDown={(event) =>
          event.stopPropagation()
        }
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">
              {chantier
                ? "Modification"
                : "Nouveau chantier"}
            </span>

            <h3>
              {chantier
                ? "Modifier le chantier"
                : "Créer un chantier"}
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
          className="project-form chantier-form"
          onSubmit={handleSubmit}
        >
          <label className="form-wide">
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

          <label className="form-wide">
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
            Localisation
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

          <label>
            Entreprise
            <input
              type="text"
              value={form.company}
              onChange={(event) =>
                updateField(
                  "company",
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            Statut
            <select
              value={form.status}
              onChange={(event) =>
                updateField(
                  "status",
                  event.target.value as ChantierStatus,
                )
              }
            >
              <option value="À étudier">
                À étudier
              </option>
              <option value="Planifié">
                Planifié
              </option>
              <option value="En cours">
                En cours
              </option>
              <option value="Suspendu">
                Suspendu
              </option>
              <option value="Terminé">
                Terminé
              </option>
            </select>
          </label>

          <label>
            Priorité
            <select
              value={form.priority}
              onChange={(event) =>
                updateField(
                  "priority",
                  event.target.value as ChantierPriority,
                )
              }
            >
              <option value="Basse">
                Basse
              </option>
              <option value="Normale">
                Normale
              </option>
              <option value="Haute">
                Haute
              </option>
              <option value="Urgente">
                Urgente
              </option>
            </select>
          </label>

          <label>
            Date de début
            <input
              type="date"
              value={form.startDate}
              onChange={(event) =>
                updateField(
                  "startDate",
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            Date de fin prévue
            <input
              type="date"
              value={form.endDate}
              onChange={(event) =>
                updateField(
                  "endDate",
                  event.target.value,
                )
              }
            />
          </label>

          <label>
            Budget prévu (€)
            <input
              type="number"
              min="0"
              step="100"
              value={form.estimatedBudget}
              onChange={(event) =>
                updateField(
                  "estimatedBudget",
                  Number(event.target.value),
                )
              }
            />
          </label>

          <label>
            Coût engagé (€)
            <input
              type="number"
              min="0"
              step="100"
              value={form.actualCost}
              onChange={(event) =>
                updateField(
                  "actualCost",
                  Number(event.target.value),
                )
              }
            />
          </label>

          <label className="form-wide">
            Avancement : {form.progress} %
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={form.progress}
              onChange={(event) =>
                updateField(
                  "progress",
                  Number(event.target.value),
                )
              }
            />
          </label>

          <div className="modal-actions form-wide">
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
              {chantier
                ? "Enregistrer"
                : "Créer le chantier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}