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

import {
  deleteEquipmentDocument,
  getEquipmentDocuments,
  saveEquipmentDocuments,
} from "../services/equipmentDocuments";

import type {
  EquipmentDocument,
} from "../services/equipmentDocuments";

import {
  getEquipmentInterventions,
  saveEquipmentInterventions,
} from "../services/equipmentInterventions";

import type {
  EquipmentIntervention,
} from "../services/equipmentInterventions";

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

type InterventionStatus =
  | "Prévue"
  | "En cours"
  | "Terminée";

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

function formatFileSize(
  size: number,
) {
  if (size < 1024) {
    return `${size} octets`;
  }

  if (size < 1024 * 1024) {
    return `${(
      size / 1024
    ).toFixed(1)} Ko`;
  }

  return `${(
    size /
    (1024 * 1024)
  ).toFixed(1)} Mo`;
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

  const [
    documents,
    setDocuments,
  ] = useState<EquipmentDocument[]>([]);

  const [
    interventions,
    setInterventions,
  ] = useState<EquipmentIntervention[]>([]);

  const [
    interventionTitle,
    setInterventionTitle,
  ] = useState("");

  const [
    interventionDescription,
    setInterventionDescription,
  ] = useState("");

  const [
    interventionDate,
    setInterventionDate,
  ] = useState(
    new Date().toISOString().slice(0, 10),
  );

  const [
    interventionStatus,
    setInterventionStatus,
  ] = useState<InterventionStatus>(
    "Prévue",
  );

  const [
    showInterventionForm,
    setShowInterventionForm,
  ] = useState(false);

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

        setDocuments(
          getEquipmentDocuments(
            String(osmId),
          ),
        );

        setInterventions(
          getEquipmentInterventions(
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

  function handleDocumentChange(
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

      const newDocument: EquipmentDocument = {
        id: `${Date.now()}-${file.name}`,
        name: file.name,
        type:
          file.type ||
          "application/octet-stream",
        size: file.size,
        dataUrl: reader.result,
        addedAt:
          new Date().toISOString(),
      };

      const nextDocuments = [
        ...documents,
        newDocument,
      ];

      setDocuments(
        nextDocuments,
      );

      saveEquipmentDocuments(
        String(equipment.id),
        nextDocuments,
      );

      event.target.value = "";
    };

    reader.readAsDataURL(file);
  }

  function handleDeleteDocument(
    documentId: string,
  ) {
    if (!equipment) {
      return;
    }

    const nextDocuments =
      deleteEquipmentDocument(
        String(equipment.id),
        documentId,
      );

    setDocuments(
      nextDocuments,
    );
  }

  function handleCreateIntervention() {
    if (!equipment) {
      return;
    }

    if (!interventionTitle.trim()) {
      return;
    }

    const newIntervention: EquipmentIntervention = {
      id: `${Date.now()}`,
      title: interventionTitle.trim(),
      description:
        interventionDescription.trim(),
      date: interventionDate,
      status: interventionStatus,
    };

    const nextInterventions = [
      newIntervention,
      ...interventions,
    ];

    setInterventions(
      nextInterventions,
    );

    saveEquipmentInterventions(
      String(equipment.id),
      nextInterventions,
    );

    setInterventionTitle("");
    setInterventionDescription("");
    setInterventionDate(
      new Date().toISOString().slice(0, 10),
    );
    setInterventionStatus("Prévue");
    setShowInterventionForm(false);
  }

  function handleDeleteIntervention(
    interventionId: string,
  ) {
    if (!equipment) {
      return;
    }

    const nextInterventions =
      interventions.filter(
        (intervention) =>
          intervention.id !==
          interventionId,
      );

    setInterventions(
      nextInterventions,
    );

    saveEquipmentInterventions(
      String(equipment.id),
      nextInterventions,
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
          Documents
        </h3>

        <label className="secondary-button">
          Ajouter un document

          <input
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.odt,.ods,.txt,image/*"
            onChange={handleDocumentChange}
            style={{
              display: "none",
            }}
          />
        </label>

        {documents.length === 0 ? (
          <p>
            Aucun document enregistré.
          </p>
        ) : (
          <div className="equipment-document-list">
            {documents.map(
              (document) => (
                <div
                  className="equipment-document-card"
                  key={document.id}
                >
                  <div>
                    <strong>
                      📄 {document.name}
                    </strong>

                    <p>
                      {formatFileSize(
                        document.size,
                      )}
                      {" · "}
                      {new Date(
                        document.addedAt,
                      ).toLocaleDateString(
                        "fr-FR",
                      )}
                    </p>
                  </div>

                  <div className="equipment-detail-actions">
                    <a
                      className="secondary-button"
                      href={document.dataUrl}
                      download={document.name}
                    >
                      Ouvrir / télécharger
                    </a>

                    <button
                      className="secondary-button"
                      type="button"
                      onClick={() =>
                        handleDeleteDocument(
                          document.id,
                        )
                      }
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>

      <div className="equipment-detail-card">
        <h3>
          Interventions
        </h3>

        {!showInterventionForm && (
          <button
            className="primary-button"
            type="button"
            onClick={() =>
              setShowInterventionForm(true)
            }
          >
            + Créer une intervention
          </button>
        )}

        {showInterventionForm && (
          <div className="equipment-intervention-form">
            <label>
              Titre
              <input
                type="text"
                value={interventionTitle}
                onChange={(event) =>
                  setInterventionTitle(
                    event.target.value,
                  )
                }
                placeholder="Ex. Réparation de la toiture"
              />
            </label>

            <label>
              Description
              <textarea
                rows={5}
                value={
                  interventionDescription
                }
                onChange={(event) =>
                  setInterventionDescription(
                    event.target.value,
                  )
                }
                placeholder="Description des travaux ou de l'intervention..."
              />
            </label>

            <label>
              Date
              <input
                type="date"
                value={interventionDate}
                onChange={(event) =>
                  setInterventionDate(
                    event.target.value,
                  )
                }
              />
            </label>

            <label>
              Statut
              <select
                value={interventionStatus}
                onChange={(event) =>
                  setInterventionStatus(
                    event.target
                      .value as InterventionStatus,
                  )
                }
              >
                <option value="Prévue">
                  Prévue
                </option>

                <option value="En cours">
                  En cours
                </option>

                <option value="Terminée">
                  Terminée
                </option>
              </select>
            </label>

            <div className="equipment-detail-actions">
              <button
                className="primary-button"
                type="button"
                onClick={
                  handleCreateIntervention
                }
              >
                Enregistrer l'intervention
              </button>

              <button
                className="secondary-button"
                type="button"
                onClick={() =>
                  setShowInterventionForm(
                    false,
                  )
                }
              >
                Annuler
              </button>
            </div>
          </div>
        )}

        <h3
          style={{
            marginTop: "28px",
          }}
        >
          Historique
        </h3>

        {interventions.length === 0 ? (
          <p>
            Aucune intervention enregistrée.
          </p>
        ) : (
          <div className="equipment-intervention-list">
            {interventions.map(
              (intervention) => (
                <div
                  className="equipment-intervention-card"
                  key={intervention.id}
                >
                  <div>
                    <strong>
                      🔧 {intervention.title}
                    </strong>

                    <p>
                      {new Date(
                        `${intervention.date}T12:00:00`,
                      ).toLocaleDateString(
                        "fr-FR",
                      )}
                      {" · "}
                      {intervention.status}
                    </p>

                    {intervention.description && (
                      <p>
                        {
                          intervention.description
                        }
                      </p>
                    )}
                  </div>

                  <button
                    className="secondary-button"
                    type="button"
                    onClick={() =>
                      handleDeleteIntervention(
                        intervention.id,
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
    </section>
  );
}