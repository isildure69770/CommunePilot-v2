import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import MapClickSelector from "../../map/components/MapClickSelector";
import {
  ROAD_EQUIPMENT_CATEGORIES,
  type RoadEquipment,
  type RoadEquipmentDocument,
  type RoadEquipmentFormValue,
} from "../types/roadEquipment";

const MAX_DOCUMENT_SIZE = 2_000_000;
const ACCEPTED_DOCUMENTS =
  ".pdf,.doc,.docx,.xls,.xlsx,.odt,.ods,.txt,.rtf,.csv,image/*";

interface Props {
  isOpen: boolean;
  equipment: RoadEquipment | null;
  onClose: () => void;
  onSubmit: (value: RoadEquipmentFormValue) => void;
  createIntervention?: boolean;
}

const emptyForm: RoadEquipmentFormValue = {
  category: "Banc",
  name: "",
  status: "En service",
  notes: "",
  photo: "",
  lastInspectionDate: "",
  nextInspectionDate: "",
  nextMaintenanceDate: "",
  maintenanceNotes: "",
  maintenanceHistory: [],
  interventions: [],
  documents: [],
  latitude: 45.790833,
  longitude: 4.4675,
};

export default function RoadEquipmentForm({
  isOpen,
  equipment,
  onClose,
  onSubmit,
  createIntervention = false,
}: Props) {
  const [form, setForm] = useState<RoadEquipmentFormValue>(emptyForm);
  const [documentError, setDocumentError] = useState("");
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    const nextForm = equipment
        ? {
            category: equipment.category,
            name: equipment.name,
            status: equipment.status,
            notes: equipment.notes,
            photo: equipment.photo ?? "",
            lastInspectionDate: equipment.lastInspectionDate ?? "",
            nextInspectionDate: equipment.nextInspectionDate ?? "",
            nextMaintenanceDate: equipment.nextMaintenanceDate ?? "",
            maintenanceNotes: equipment.maintenanceNotes ?? "",
            maintenanceHistory: equipment.maintenanceHistory ?? [],
            interventions: equipment.interventions ?? [],
            documents: equipment.documents ?? [],
            latitude: equipment.latitude,
            longitude: equipment.longitude,
          }
        : emptyForm;
    setForm(createIntervention && equipment ? {
      ...nextForm,
      interventions: [...nextForm.interventions, { id: crypto.randomUUID(), date: "", title: "", status: "Planifiée", details: "", cost: undefined }],
    } : nextForm);
    setDocumentError("");
    setSubmitError("");
  }, [equipment, isOpen, createIntervention]);

  if (!isOpen) return null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      onSubmit({
        ...form,
        name: form.name.trim(),
        status: form.status.trim(),
        notes: form.notes.trim(),
        maintenanceNotes: form.maintenanceNotes?.trim(),
      });
      onClose();
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "L’équipement n’a pas pu être enregistré.",
      );
    }
  }

  function handlePhotoFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2_000_000) {
      window.alert("La photo doit peser moins de 2 Mo.");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setForm((current) => ({ ...current, photo: String(reader.result) }));
    reader.readAsDataURL(file);
  }

  function addMaintenanceEntry() {
    setForm({
      ...form,
      maintenanceHistory: [
        ...form.maintenanceHistory,
        { id: crypto.randomUUID(), date: "", description: "", cost: undefined },
      ],
    });
  }

  function addIntervention() {
    setForm({
      ...form,
      interventions: [
        ...form.interventions,
        { id: crypto.randomUUID(), date: "", title: "", status: "Planifiée", details: "", cost: undefined },
      ],
    });
  }

  function handleDocumentFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > MAX_DOCUMENT_SIZE) {
      setDocumentError(
        `« ${file.name} » dépasse la limite de 2 Mo. Choisissez un fichier moins volumineux.`,
      );
      return;
    }

    setDocumentError("");
    const reader = new FileReader();
    reader.onerror = () =>
      setDocumentError(`Impossible de lire « ${file.name} ».`);
    reader.onload = () => {
      const document: RoadEquipmentDocument = {
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
        addedAt: new Date().toISOString(),
        dataUrl: String(reader.result),
      };
      setForm((current) => ({
        ...current,
        documents: [...current.documents, document],
      }));
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className="modal road-equipment-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">
              {equipment ? "Modification" : "Nouvel équipement"}
            </span>
            <h3>{equipment ? "Modifier l’équipement" : "Ajouter un équipement"}</h3>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Fermer">
            ×
          </button>
        </div>

        <form className="project-form road-equipment-form" onSubmit={handleSubmit}>
          <label>
            Type
            <select
              value={form.category}
              onChange={(event) =>
                setForm({
                  ...form,
                  category: event.target.value as RoadEquipmentFormValue["category"],
                })
              }
            >
              {ROAD_EQUIPMENT_CATEGORIES.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </select>
          </label>

          <label>
            Nom (facultatif)
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Ex. Banc place de l’église"
            />
          </label>

          <label className="form-wide">
            État
            <select
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value })}
            >
              <option>En service</option>
              <option>À contrôler</option>
              <option>À réparer</option>
              <option>Hors service</option>
            </select>
          </label>

          <label className="form-wide">
            Observations
            <textarea
              rows={3}
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
            />
          </label>

          <fieldset className="road-equipment-fieldset form-wide">
            <legend>Photo</legend>
            <label>
              Adresse de l’image
              <input
                type="url"
                value={form.photo}
                onChange={(event) => setForm({ ...form, photo: event.target.value })}
                placeholder="https://…"
              />
            </label>
            <label>
              Ou choisir une photo (2 Mo maximum)
              <input type="file" accept="image/*" onChange={handlePhotoFile} />
            </label>
            {form.photo && (
              <div className="road-equipment-photo-preview">
                <img src={form.photo} alt="Aperçu de l’équipement" />
                <button type="button" className="secondary-button" onClick={() => setForm({ ...form, photo: "" })}>
                  Retirer la photo
                </button>
              </div>
            )}
          </fieldset>

          <fieldset className="road-equipment-fieldset form-wide">
            <legend>Documents</legend>
            <div className="road-equipment-document-heading">
              <span>Contrats, devis, factures, notices, rapports ou images.</span>
              <label className="secondary-button road-equipment-file-button">
                + Ajouter un document
                <input
                  type="file"
                  accept={ACCEPTED_DOCUMENTS}
                  onChange={handleDocumentFile}
                />
              </label>
            </div>
            <small className="road-equipment-document-help">
              PDF, Word, Excel, ODT/ODS, texte et images · 2 Mo maximum par fichier.
            </small>
            {documentError && (
              <p className="road-equipment-document-error" role="alert">
                {documentError}
              </p>
            )}
            {form.documents.length > 0 ? (
              <ul className="road-equipment-document-list">
                {form.documents.map((document) => (
                  <li key={document.id}>
                    <div>
                      <strong>{document.name}</strong>
                      <small>
                        {(document.size / 1_000_000).toLocaleString("fr-FR", {
                          maximumFractionDigits: 2,
                        })} Mo · ajouté le {new Intl.DateTimeFormat("fr-FR").format(new Date(document.addedAt))}
                      </small>
                    </div>
                    <button
                      type="button"
                      className="danger-button"
                      onClick={() =>
                        setForm((current) => ({
                          ...current,
                          documents: current.documents.filter(
                            (item) => item.id !== document.id,
                          ),
                        }))
                      }
                    >
                      Supprimer
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="road-equipment-document-empty">Aucun document joint.</span>
            )}
          </fieldset>

          <fieldset className="road-equipment-fieldset form-wide">
            <legend>Contrôle et entretien</legend>
            <label>
              Date du dernier contrôle
              <input
                type="date"
                value={form.lastInspectionDate}
                onChange={(event) => setForm({ ...form, lastInspectionDate: event.target.value })}
              />
            </label>
            <div className="road-equipment-date-grid">
              <label>
                Prochain contrôle
                <input type="date" value={form.nextInspectionDate} onChange={(event) => setForm({ ...form, nextInspectionDate: event.target.value })} />
              </label>
              <label>
                Prochain entretien
                <input type="date" value={form.nextMaintenanceDate} onChange={(event) => setForm({ ...form, nextMaintenanceDate: event.target.value })} />
              </label>
            </div>
            <label>
              Informations d’entretien
              <textarea
                rows={3}
                value={form.maintenanceNotes}
                onChange={(event) => setForm({ ...form, maintenanceNotes: event.target.value })}
                placeholder="Consignes, fréquence, prestataire…"
              />
            </label>
            <div className="road-equipment-repeater">
              <div className="road-equipment-repeater-heading">
                <strong>Historique d’entretien</strong>
                <button type="button" className="secondary-button" onClick={addMaintenanceEntry}>+ Ajouter</button>
              </div>
              {form.maintenanceHistory.map((entry, index) => (
                <div className="road-equipment-repeat-row" key={entry.id}>
                  <input
                    aria-label="Date de l’entretien"
                    type="date"
                    value={entry.date}
                    onChange={(event) => setForm({ ...form, maintenanceHistory: form.maintenanceHistory.map((item, itemIndex) => itemIndex === index ? { ...item, date: event.target.value } : item) })}
                  />
                  <input
                    aria-label="Description de l’entretien"
                    value={entry.description}
                    placeholder="Entretien réalisé"
                    onChange={(event) => setForm({ ...form, maintenanceHistory: form.maintenanceHistory.map((item, itemIndex) => itemIndex === index ? { ...item, description: event.target.value } : item) })}
                  />
                  <input aria-label="Coût de l’entretien" type="number" min="0" step="0.01" value={entry.cost ?? ""} placeholder="Coût €" onChange={(event) => setForm({ ...form, maintenanceHistory: form.maintenanceHistory.map((item, itemIndex) => itemIndex === index ? { ...item, cost: event.target.value === "" ? undefined : Number(event.target.value) } : item) })} />
                  <button type="button" className="danger-button" onClick={() => setForm({ ...form, maintenanceHistory: form.maintenanceHistory.filter((_, itemIndex) => itemIndex !== index) })} aria-label="Supprimer cette entrée">×</button>
                </div>
              ))}
            </div>
          </fieldset>

          <fieldset className="road-equipment-fieldset form-wide">
            <legend>Interventions associées</legend>
            <div className="road-equipment-repeater-heading">
              <span>Planifiez et suivez les interventions liées à cet équipement.</span>
              <button type="button" className="secondary-button" onClick={addIntervention}>+ Ajouter</button>
            </div>
            {form.interventions.map((intervention, index) => (
              <div className="road-equipment-intervention-editor" key={intervention.id}>
                <input type="date" aria-label="Date de l’intervention" value={intervention.date} onChange={(event) => setForm({ ...form, interventions: form.interventions.map((item, itemIndex) => itemIndex === index ? { ...item, date: event.target.value } : item) })} />
                <input aria-label="Intitulé de l’intervention" value={intervention.title} placeholder="Intitulé" onChange={(event) => setForm({ ...form, interventions: form.interventions.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item) })} />
                <select aria-label="Statut de l’intervention" value={intervention.status} onChange={(event) => setForm({ ...form, interventions: form.interventions.map((item, itemIndex) => itemIndex === index ? { ...item, status: event.target.value as typeof intervention.status } : item) })}>
                  <option>Planifiée</option><option>En cours</option><option>Terminée</option>
                </select>
                <input aria-label="Détails de l’intervention" value={intervention.details} placeholder="Détails" onChange={(event) => setForm({ ...form, interventions: form.interventions.map((item, itemIndex) => itemIndex === index ? { ...item, details: event.target.value } : item) })} />
                <input aria-label="Coût de l’intervention" type="number" min="0" step="0.01" value={intervention.cost ?? ""} placeholder="Coût €" onChange={(event) => setForm({ ...form, interventions: form.interventions.map((item, itemIndex) => itemIndex === index ? { ...item, cost: event.target.value === "" ? undefined : Number(event.target.value) } : item) })} />
                <button type="button" className="danger-button" onClick={() => setForm({ ...form, interventions: form.interventions.filter((_, itemIndex) => itemIndex !== index) })} aria-label="Supprimer cette intervention">×</button>
              </div>
            ))}
          </fieldset>

          <div className="form-wide">
            <MapClickSelector
              latitude={form.latitude}
              longitude={form.longitude}
              title={form.name || form.category}
              onChange={(latitude, longitude) =>
                setForm({ ...form, latitude, longitude })
              }
            />
          </div>

          <div className="form-location-summary form-wide">
            <span>Coordonnées enregistrées</span>
            <strong>{form.latitude.toFixed(6)} · {form.longitude.toFixed(6)}</strong>
          </div>

          <div className="modal-actions form-wide">
            {submitError && <p className="road-equipment-submit-error" role="alert">{submitError}</p>}
            <button className="secondary-button" type="button" onClick={onClose}>
              Annuler
            </button>
            <button className="primary-button" type="submit">
              {equipment ? "Enregistrer" : "Ajouter"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
