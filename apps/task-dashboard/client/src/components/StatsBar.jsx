import { STATUSES, STATUS_LABELS } from "../hooks/useTasks.js";

export default function StatsBar({ stats }) {
  const total = STATUSES.reduce((n, s) => n + stats[s], 0);
  const donePct = total ? Math.round((stats.done / total) * 100) : 0;
  return (
    <section className="stats" aria-label="Task counts">
      <dl>
        {STATUSES.map((s) => (
          <div key={s} className={`stat stat-${s}`}>
            <dt>{STATUS_LABELS[s]}</dt>
            <dd>{stats[s]}</dd>
          </div>
        ))}
      </dl>
      <div className="meter" role="img" aria-label={`${donePct}% of tasks done`}>
        <span style={{ width: `${donePct}%` }} />
      </div>
    </section>
  );
}
