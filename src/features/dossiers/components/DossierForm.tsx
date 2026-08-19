import { useEffect, useState } from "react";
import type {
  Dossier,
  DossierPriority,
  DossierStatus,
} from "../types/dossier";
import { DOSSIER_CATEGORIES } from "../dossierCategories";

type DossierFormValue = Omit<
  Dossier,
  "id" | "createdAt" | "updatedAt"
>;

interface DossierFormProps {
  isOpen: boolean;
  dossier?: Dossier | null;
  onClose: () => void;
  onSubmit: (value: DossierFormValue) => void;
  initialCategory?: string;
}

const emptyForm: DossierFormValue = {
  title: "",
  description: "",
  category: "",
  manager: "",
  status: "À traiter",
  priority: "Normale",
  deadline: "",
};

export default function DossierForm({
  isOpen,
  dossier,
  onClose,
  onSubmit,
  initialCategory = "",
}: DossierFormProps) {
  const [form, setForm] =
    useState<DossierFormValue>(emptyForm);

  useEffect(() => {
    if (dossier) {
      setForm({
        title: dossier.title,
        description: dossier.description,
        category: dossier.category,
        manager: dossier.manager,
        status: dossier.status,
        priority: dossier.priority,
        deadline: dossier.deadline.slice(0, 10),
      });
    } else {
      setForm({ ...emptyForm, category: initialCategory });
    }
  }, [dossier, isOpen, initialCategory]);

  if (!isOpen) {
    return null;
  }

  function updateField<Key extends keyof DossierFormValue>(
    key: Key,
    value: DossierFormValue[Key],
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [key]: value,
    }));
  }

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (
      !form.title.trim() ||
      !form.description.trim() ||
      !form.manager.trim() ||
      !form.deadline
    ) {
      return;
    }

    onSubmit({
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      manager: form.manager.trim(),
    });

    onClose();
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">
              {dossier ? "Modification" : "Nouveau dossier"}
            </span>

            <h3>
              {dossier
                ? "Modifier le dossier"
                : "Créer un dossier"}
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

        <form className="project-form" onSubmit={handleSubmit}>
          <label>
            Intitulé
            <input
              type="text"
              value={form.title}
              onChange={(event) =>
                updateField("title", event.target.value)
              }
              required
            />
          </label>

          <label>
            Description
            <textarea
              value={form.description}
              onChange={(event) =>
                updateField(
                  "description",
                  event.target.value,
                )
              }
              rows={4}
              required
            />
          </label>

          <label>
            Catégorie
            <select
              value={form.category}
              onChange={(event) =>
                updateField("category", event.target.value)
              }
            >
              <option value="">Sans catégorie (reste dans Dossiers)</option>
              {DOSSIER_CATEGORIES.map((category) => (
                <option key={category} value={category}>{category}</option>
              ))}
              {form.category && !DOSSIER_CATEGORIES.includes(form.category as (typeof DOSSIER_CATEGORIES)[number]) && (
                <option value={form.category}>{form.category} (catégorie existante)</option>
              )}
            </select>
          </label>

          <label>
            Responsable
            <input
              type="text"
              value={form.manager}
              onChange={(event) =>
                updateField("manager", event.target.value)
              }
              required
            />
          </label>

          <label>
            Statut
            <select
              value={form.status}
              onChange={(event) =>
                updateField(
                  "status",
                  event.target.value as DossierStatus,
                )
              }
            >
              <option>À traiter</option>
              <option>En cours</option>
              <option>En attente</option>
              <option>Terminé</option>
            </select>
          </label>

          <label>
            Priorité
            <select
              value={form.priority}
              onChange={(event) =>
                updateField(
                  "priority",
                  event.target.value as DossierPriority,
                )
              }
            >
              <option>Basse</option>
              <option>Normale</option>
              <option>Haute</option>
              <option>Urgente</option>
            </select>
          </label>

          <label>
            Échéance
            <input
              type="date"
              value={form.deadline}
              onChange={(event) =>
                updateField("deadline", event.target.value)
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

            <button className="primary-button" type="submit">
              {dossier
                ? "Enregistrer les modifications"
                : "Créer le dossier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
