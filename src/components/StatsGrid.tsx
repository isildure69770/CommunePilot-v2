import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";

export interface Stat {
  title: string;
  value: number | string;
  detail: string;
  tone: string;
  icon: LucideIcon;
  path: string;
}

export default function StatsGrid({ stats }: { stats: Stat[] }) {
  return (
    <div className="stats-grid">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return <Link className={`stat-card stat-${stat.tone}`} to={stat.path} key={stat.title}>
          <div className="stat-card-heading"><span><Icon /></span><ArrowUpRight className="stat-arrow" /></div>
          <div className="stat-card-body"><div className="stat-value">{stat.value}</div><h3>{stat.title}</h3></div>
          <p>{stat.detail}</p>
        </Link>;
      })}
    </div>
  );
}
