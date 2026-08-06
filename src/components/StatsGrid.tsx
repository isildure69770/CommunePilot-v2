interface Stat {
  title: string;
  value: number | string;
  color: string;
}

const stats: Stat[] = [
  {
    title: "Dossiers",
    value: 24,
    color: "#2563eb",
  },
  {
    title: "À traiter",
    value: 7,
    color: "#f59e0b",
  },
  {
    title: "En cours",
    value: 12,
    color: "#10b981",
  },
  {
    title: "Échéances",
    value: 3,
    color: "#ef4444",
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
        </div>
      ))}
    </div>
  );
}