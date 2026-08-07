import { useState } from "react";

import type {
  SignalementDetails,
  SignalementHistoryEntry,
  SignalementNote,
} from "../types/signalementDetails";

interface SignalementNotesProps {
  details: SignalementDetails;

  onChange: (
    details: SignalementDetails,
  ) => void;
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
  ).format(new Date(value));
}

export default function SignalementNotes({
  details,
  onChange,
}: SignalementNotesProps) {
  const [newNote, setNewNote] =
    useState("");

  function addNote() {
    const text =
      newNote.trim();

    if (!text) {
      return;
    }

    const now =
      new Date().toISOString();

    const note: SignalementNote = {
      id: Date.now(),
      text,
      createdAt: now,
    };

    const historyEntry:
      SignalementHistoryEntry = {
        id: Date.now() + 1,
        action:
          "Une note a été ajoutée",
        createdAt: now,
      };

    onChange({
      ...details,

      notes: [
        note,
        ...details.notes,
      ],

      history: [
        historyEntry,
        ...details.history,
      ],
    });

    setNewNote("");
  }

  function deleteNote(
    id: number,
  ) {
    const now =
      new Date().toISOString();

    onChange({
      ...details,

      notes:
        details.notes.filter(
          (note) =>
            note.id !== id,
        ),

      history: [
        {
          id: Date.now(),

          action:
            "Une note a été supprimée",

          createdAt: now,
        },

        ...details.history,
      ],
    });
  }

  return (
    <section className="signalement-details-section">
      <h3>
        Notes
      </h3>

      <div className="note-editor">
        <textarea
          rows={3}
          value={newNote}
          placeholder="Ajouter une note..."
          onChange={(event) =>
            setNewNote(
              event.target.value,
            )
          }
        />

        <button
          className="primary-button"
          type="button"
          onClick={addNote}
        >
          Ajouter la note
        </button>
      </div>

      {details.notes.length === 0 ? (
        <div className="empty-note">
          Aucune note pour le moment.
        </div>
      ) : (
        <div className="notes-list">
          {details.notes.map(
            (note) => (
              <article
                className="signalement-note"
                key={note.id}
              >
                <div>
                  <p>
                    {note.text}
                  </p>

                  <time>
                    {formatDateTime(
                      note.createdAt,
                    )}
                  </time>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    deleteNote(
                      note.id,
                    )
                  }
                >
                  Supprimer
                </button>
              </article>
            ),
          )}
        </div>
      )}
    </section>
  );
}