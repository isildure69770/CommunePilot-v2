import { useState } from "react";
import type { Project } from "./ProjectCard";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (project: Project) => void;
}

export default function NewProjectModal({
  isOpen,
  onClose,
  onCreate,
}: NewProjectModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Voirie");
  const [manager, setManager] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] =
    useState<Project["priority"]>("Normale");

  if (!isOpen) {
    return null;
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim() || !manager.trim() || !deadline) {
      return;
    }

    onCreate({
      id: Date.now(),
      title: title.trim(),
      category,
      manager: manager.trim(),
      status: "À traiter",
      priority,
      deadline,
    });

    setTitle("");
    setCategory("Voirie");
    setManager("");
    setDeadline("");
    setPriority("Normale");
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
            <span className="eyebrow">Nouveau dossier</span>
            <h3>Créer un dossier</h3>
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
            Intitulé du dossier
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Ex. Réfection du chemin communal"
              required
            />
          </label>

          <label>
            Catégorie
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option>Voirie</option>
              <option>Bâtiments</option>
              <option>Conseil municipal</option>
              <option>Communication</option>
              <option>Gestion des salles</option>
            </select>
          </label>

          <label>
            Responsable
            <input
              type="text"
              value={manager}
              onChange={(event) => setManager(event.target.value)}
              placeholder="Nom du responsable"
              required
            />
          </label>

          <label>
            Échéance
            <input
              type="date"
              value={deadline}
              onChange={(event) => setDeadline(event.target.value)}
              required
            />
          </label>

          <label>
            Priorité
            <select
              value={priority}
              onChange={(event) =>
                setPriority(event.target.value as Project["priority"])
              }
            >
              <option>Basse</option>
              <option>Normale</option>
              <option>Haute</option>
            </select>
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
              Créer le dossier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}