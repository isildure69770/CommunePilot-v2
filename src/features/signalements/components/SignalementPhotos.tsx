import type {
  SignalementDetails,
} from "../types/signalementDetails";

interface SignalementPhotosProps {
  details: SignalementDetails;

  onChange: (
    details: SignalementDetails,
  ) => void;
}

export default function SignalementPhotos({
  details,
  onChange,
}: SignalementPhotosProps) {
  function addPhoto() {
    const url = window.prompt(
      "Adresse de la photo (URL) :",
    );

    if (!url) return;

    onChange({
      ...details,

      photos: [
        ...details.photos,

        {
          id: Date.now(),
          url,
          createdAt:
            new Date().toISOString(),
        },
      ],

      history: [
        {
          id: Date.now(),
          action:
            "Photo ajoutée",

          createdAt:
            new Date().toISOString(),
        },

        ...details.history,
      ],
    });
  }

  function removePhoto(id: number) {
    onChange({
      ...details,

      photos:
        details.photos.filter(
          (photo) =>
            photo.id !== id,
        ),

      history: [
        {
          id: Date.now(),
          action:
            "Photo supprimée",

          createdAt:
            new Date().toISOString(),
        },

        ...details.history,
      ],
    });
  }

  return (
    <section className="signalement-details-section">

      <div className="section-title-row">
        <h3>
          Photos
        </h3>

        <button
          className="secondary-button"
          type="button"
          onClick={addPhoto}
        >
          + Ajouter
        </button>
      </div>

      {details.photos.length === 0 ? (
        <div className="empty-state">
          Aucune photo.
        </div>
      ) : (
        <div className="signalement-photo-grid">
          {details.photos.map(
            (photo) => (
              <div
                key={photo.id}
                className="signalement-photo-card"
              >
                <img
                  src={photo.url}
                  alt=""
                />

                <button
                  className="danger-button"
                  type="button"
                  onClick={() =>
                    removePhoto(
                      photo.id,
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
    </section>
  );
}