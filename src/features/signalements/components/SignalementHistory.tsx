import type {
  SignalementDetails,
} from "../types/signalementDetails";

interface SignalementHistoryProps {
  details: SignalementDetails;
}

function formatDateTime(
  value: string,
) {
  return new Intl.DateTimeFormat(
    "fr-FR",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  ).format(
    new Date(value),
  );
}

export default function SignalementHistory({
  details,
}: SignalementHistoryProps) {
  return (
    <section className="signalement-details-section">
      <h3>
        Historique
      </h3>

      {details.history.length === 0 ? (
        <div className="empty-note">
          Aucun événement enregistré.
        </div>
      ) : (
        <div className="history-list">
          {details.history.map(
            (entry) => (
              <div
                className="history-entry"
                key={entry.id}
              >
                <span
                  className="history-dot"
                />

                <div>
                  <strong>
                    {entry.action}
                  </strong>

                  <time>
                    {formatDateTime(
                      entry.createdAt,
                    )}
                  </time>
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </section>
  );
}