interface Stat {
  title: string;
  value: number | string;
  color: string;
  detail: string;
}

const stats: Stat[] = [
  {
    title: "Dossiers",
    value: 24,
    color: "#2563eb",
    detail: "+3 ce mois-ci",
  },
  {
    title: "À traiter",
    value: 7,
    color: "#f59e0b",
    detail: "2 prioritaires",
  },
  {
    title: "En cours",
    value: 12,
    color: "#10b981",
    detail: "50 % des dossiers",
  },
  {
    title: "Échéances",
    value: 3,
    color: "#ef4444",
    detail: "Dans les 15 jours",
  },
];

export default function StatsGrid() {
  return (
    <div className="stats-grid">
      {stats.map((stat) => (
        <div className="stat-card" key={stat.title}>
          <h3>{stat.title}</h3>

          <div
            className="stat-value"
            style={{ color: stat.color }}
          >
            {stat.value}
          </div>
          <p>{stat.detail}</p>
        </div>
      ))}
    </div>
  );
}
