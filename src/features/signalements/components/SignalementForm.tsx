import {
  useEffect,
  useState,
  type FormEvent,
} from "react";

import MapClickSelector from "../../map/components/MapClickSelector";

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

interface InitialPosition {
  latitude: number;
  longitude: number;
  location?: string;
}

interface SignalementFormProps {
  isOpen: boolean;
  signalement?: Signalement | null;

  initialPosition?: InitialPosition | null;
  initialCategory?: SignalementCategory;

  onClose: () => void;

  onSubmit: (
    value: SignalementFormValue,
  ) => void;
}

const DEFAULT_LATITUDE = 45.790833;
const DEFAULT_LONGITUDE = 4.4675;

const emptyForm: SignalementFormValue = {
  title: "",
  description: "",
  category: "Voirie",
  status: "Nouveau",
  priority: "Normale",
  location: "",
  latitude: DEFAULT_LATITUDE,
  longitude: DEFAULT_LONGITUDE,
  reporter: "Mairie",
  manager: "",
};

export default function SignalementForm({
  isOpen,
  signalement,
  initialPosition = null,
  initialCategory = "Voirie",
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
        latitude:
          signalement.latitude ?? DEFAULT_LATITUDE,
        longitude:
          signalement.longitude ?? DEFAULT_LONGITUDE,
        reporter: signalement.reporter,
        manager: signalement.manager,
        resolvedAt: signalement.resolvedAt,
        convertedToChantierId:
          signalement.convertedToChantierId,
      });
    } else {
  setForm({
  ...emptyForm,
  category: initialCategory,

  latitude:
    initialPosition?.latitude ??
    DEFAULT_LATITUDE,

  longitude:
    initialPosition?.longitude ??
    DEFAULT_LONGITUDE,

  location:
    initialPosition?.location ?? "",
});
}
  }, [
  signalement,
  isOpen,
  initialPosition,
  initialCategory,
]);

  if (!isOpen) {
    return null;
  }

  function updateField<
    Key extends keyof SignalementFormValue,
  >(
    key: Key,
    value: SignalementFormValue[Key],
  ) {
    setForm((currentForm) => ({
      ...currentForm,
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
      reporter:
        form.reporter.trim() || "Mairie",
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
        className="modal signalement-form-modal"
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
          className="project-form signalement-form"
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
              <option value="Voirie">
                Voirie
              </option>
              <option value="Bâtiment">
                Bâtiment
              </option>
              <option value="Espaces verts">
                Espaces verts
              </option>
              <option value="Éclairage public">
                Éclairage public
              </option>
              <option value="Eau">
                Eau
              </option>
              <option value="Déchets">
                Déchets
              </option>
              <option value="Sécurité">
                Sécurité
              </option>
              <option value="Mobilier urbain">
                Mobilier urbain
              </option>
              <option value="Divers">
                Divers
              </option>
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
              <option value="Nouveau">
                Nouveau
              </option>
              <option value="À traiter">
                À traiter
              </option>
              <option value="En cours">
                En cours
              </option>
              <option value="En attente">
                En attente
              </option>
              <option value="Résolu">
                Résolu
              </option>
              <option value="Classé">
                Classé
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
                  event.target
                    .value as SignalementPriority,
                )
              }
            >
              <option value="Faible">
                Faible
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

          <label className="form-wide">
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
              placeholder="Ex. Route des Auberges"
              required
            />
          </label>

          <div className="form-wide">
            <MapClickSelector
              latitude={form.latitude}
              longitude={form.longitude}
              title={
                form.title ||
                "Emplacement du signalement"
              }
              onChange={(
                latitude,
                longitude,
              ) => {
                setForm((currentForm) => ({
                  ...currentForm,
                  latitude,
                  longitude,
                }));
              }}
            />
          </div>

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

          <div className="form-location-summary">
            <span>Coordonnées enregistrées</span>

            <strong>
              {form.latitude.toFixed(6)}
              {" · "}
              {form.longitude.toFixed(6)}
            </strong>
          </div>

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
