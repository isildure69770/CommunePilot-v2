import {
  useEffect,
  useState,
} from "react";

import {
  Link,
  useParams,
} from "react-router-dom";

import type {
  ChangeEvent,
} from "react";

import type {
  FeatureCollection,
  Point,
} from "geojson";

import {
  getEquipmentNote,
  saveEquipmentNote,
} from "../services/equipmentNotes";

import {
  getEquipmentPhotos,
  saveEquipmentPhotos,
} from "../services/equipmentPhotos";

interface AmenityProperties {
  osm_id?: number;
  name?: string;
  amenity?: string;
}

interface EquipmentData {
  id: number;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
}

function translateAmenity(
  value?: string,
) {
  switch (value) {
    case "townhall":
      return "Mairie";

    case "school":
      return "École";

    case "kindergarten":
      return "École maternelle";

    case "library":
      return "Bibliothèque";

    case "cinema":
      return "Cinéma";

    case "parking":
      return "Parking";

    case "grave_yard":
      return "Cimetière";

    case "recycling":
      return "Point de recyclage";

    case "car_pooling":
      return "Aire de covoiturage";

    case "place_of_worship":
      return "Lieu de culte";

    case "post_office":
      return "Bureau de poste";

    case "historic_building":
      return "Bâtiment historique";

    case "public_building":
      return "Bâtiment public";

    default:
      return value ?? "Équipement";
  }
}

export default function EquipmentDetailPage() {
  const {
    id,
  } = useParams();

  const [
    equipment,
    setEquipment,
  ] = useState<EquipmentData | null>(
    null,
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    note,
    setNote,
  ] = useState("");

  const [
    noteSaved,
    setNoteSaved,
  ] = useState(false);

  const [
    photos,
    setPhotos,
  ] = useState<string[]>([]);

  useEffect(() => {
    async function loadEquipment() {
      try {
        const response = await fetch(
          "/data/montrottier/amenities.geojson",
        );

        if (!response.ok) {
          throw new Error(
            "Impossible de charger les équipements.",
          );
        }

        const data =
          (await response.json()) as FeatureCollection<
            Point,
            AmenityProperties
          >;

        const osmId = Number(id);

        const feature =
          data.features.find(
            (item) =>
              item.properties?.osm_id ===
              osmId,
          );

        if (!feature) {
          setEquipment(null);
          return;
        }

        const [
          longitude,
          latitude,
        ] = feature.geometry.coordinates;

        const properties =
          feature.properties;

        setEquipment({
          id: osmId,

          name:
            properties?.name?.trim() ||
            translateAmenity(
              properties?.amenity,
            ),

          type: translateAmenity(
            properties?.amenity,
          ),

          latitude,
          longitude,
        });

        setNote(
          getEquipmentNote(
            String(osmId),
          ),
        );

        setPhotos(
          getEquipmentPhotos(
            String(osmId),
          ),
        );
      } catch (error) {
        console.error(
          "Erreur chargement fiche équipement :",
          error,
        );

        setEquipment(null);
      } finally {
        setLoading(false);
      }
    }

    loadEquipment();
  }, [id]);

  function handleSaveNote() {
    if (!equipment) {
      return;
    }

    saveEquipmentNote(
      String(equipment.id),
      note,
    );

    setNoteSaved(true);

    window.setTimeout(() => {
      setNoteSaved(false);
    }, 2000);
  }

  function handlePhotoChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    if (!equipment) {
      return;
    }

    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader =
      new FileReader();

    reader.onload = () => {
      if (
        typeof reader.result !== "string"
      ) {
        return;
      }

      const nextPhotos = [
        ...photos,
        reader.result,
      ];

      setPhotos(nextPhotos);

      saveEquipmentPhotos(
        String(equipment.id),
        nextPhotos,
      );

      event.target.value = "";
    };

    reader.readAsDataURL(file);
  }

  function handleDeletePhoto(
    photoIndex: number,
  ) {
    if (!equipment) {
      return;
    }

    const nextPhotos =
      photos.filter(
        (_, index) =>
          index !== photoIndex,
      );

    setPhotos(nextPhotos);

    saveEquipmentPhotos(
      String(equipment.id),
      nextPhotos,
    );
  }

  if (loading) {
    return (
      <section className="equipment-detail-page">
        <p>
          Chargement de l'équipement...
        </p>
      </section>
    );
  }

  if (!equipment) {
    return (
      <section className="equipment-detail-page">
        <div className="empty-state">
          <h2>
            Équipement introuvable
          </h2>

          <p>
            Cet équipement n'existe pas
            dans le référentiel actuel.
          </p>

          <Link
            className="secondary-button"
            to="/carte"
          >
            Retour à la carte
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="equipment-detail-page">
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            Équipement communal
          </span>

          <h2>
            {equipment.name}
          </h2>

          <p>
            {equipment.type}
          </p>
        </div>

        <Link
          className="secondary-button"
          to="/carte"
        >
          ← Retour à la carte
        </Link>
      </div>

      <div className="equipment-detail-card">
        <h3>
          Informations générales
        </h3>

        <p>
          <strong>Nom :</strong>{" "}
          {equipment.name}
        </p>

        <p>
          <strong>Type :</strong>{" "}
          {equipment.type}
        </p>

        <p>
          <strong>
            Identifiant OSM :
          </strong>{" "}
          {equipment.id}
        </p>

        <p>
          <strong>Latitude :</strong>{" "}
          {equipment.latitude.toFixed(6)}
        </p>

        <p>
          <strong>Longitude :</strong>{" "}
          {equipment.longitude.toFixed(6)}
        </p>
      </div>

      <div className="equipment-detail-card">
        <h3>
          Notes
        </h3>

        <textarea
          value={note}
          onChange={(event) => {
            setNote(
              event.target.value,
            );

            setNoteSaved(false);
          }}
          rows={8}
          placeholder="Ajoutez ici des informations sur cet équipement : entretien, état, travaux à prévoir, remarques..."
        />

        <div className="equipment-detail-actions">
          <button
            className="primary-button"
            type="button"
            onClick={handleSaveNote}
          >
            Enregistrer la note
          </button>

          {noteSaved && (
            <span>
              ✅ Note enregistrée
            </span>
          )}
        </div>
      </div>

      <div className="equipment-detail-card">
        <h3>
          Photos
        </h3>

        <label className="secondary-button">
          Ajouter une photo

          <input
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            style={{
              display: "none",
            }}
          />
        </label>

        {photos.length === 0 ? (
          <p>
            Aucune photo enregistrée.
          </p>
        ) : (
          <div className="equipment-photo-grid">
            {photos.map(
              (photo, index) => (
                <div
                  className="equipment-photo-card"
                  key={`${equipment.id}-${index}`}
                >
                  <img
                    src={photo}
                    alt={`${equipment.name} - photo ${index + 1}`}
                    style={{
                      width: "100%",
                      maxWidth: "320px",
                      borderRadius: "8px",
                    }}
                  />

                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() =>
                      handleDeletePhoto(
                        index,
                      )
                    }
                  >
                    Supprimer
                  </button>
                </div>
              ),
            )}
          </div>
        )}
      </div>

      <div className="equipment-detail-card">
        <h3>
          Gestion
        </h3>

        <div className="equipment-detail-actions">
          <button
            className="secondary-button"
            type="button"
          >
            Ajouter un document
          </button>

          <button
            className="primary-button"
            type="button"
          >
            Créer une intervention
          </button>
        </div>
      </div>
    </section>
  );
}