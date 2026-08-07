const STORAGE_KEY = "communepilot-projects";

export function loadProjects() {
  const data = localStorage.getItem(STORAGE_KEY);

  return data ? JSON.parse(data) : null;
}

export function saveProjects(projects: unknown) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(projects)
  );
}