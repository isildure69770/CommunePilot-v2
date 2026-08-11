import { useEffect, useState, type FormEvent } from "react";
import MapClickSelector from "../../map/components/MapClickSelector";
import {
  ROAD_EQUIPMENT_CATEGORIES,
  type RoadEquipment,
  type RoadEquipmentFormValue,
} from "../types/roadEquipment";

interface Props {
  isOpen: boolean;
  equipment: RoadEquipment | null;
  onClose: () => void;
  onSubmit: (value: RoadEquipmentFormValue) => void;
}

const emptyForm: RoadEquipmentFormValue = {
  category: "Banc",
  name: "",
  status: "En service",
  notes: "",
  latitude: 45.790833,
  longitude: 4.4675,
};

export default function RoadEquipmentForm({
  isOpen,
  equipment,
  onClose,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<RoadEquipmentFormValue>(emptyForm);

  useEffect(() => {
    setForm(
      equipment
        ? {
            category: equipment.category,
            name: equipment.name,
            status: equipment.status,
            notes: equipment.notes,
            latitude: equipment.latitude,
            longitude: equipment.longitude,
          }
        : emptyForm,
    );
  }, [equipment, isOpen]);

  if (!isOpen) return null;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      ...form,
      name: form.name.trim(),
      status: form.status.trim(),
      notes: form.notes.trim(),
    });
    onClose();
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
