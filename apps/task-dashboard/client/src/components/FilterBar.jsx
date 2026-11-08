import { STATUSES, STATUS_LABELS } from "../hooks/useTasks.js";

export default function FilterBar({ status, q, onStatus, onSearch }) {
  return (
    <div className="filters" role="search">
      <div className="field grow">
        <label htmlFor="search">Search tasks</label>
        <input id="search" type="search" value={q} onChange={(e) => onSearch(e.target.value)} placeholder="Title or description" />
      </div>
      <div className="field">
        <label htmlFor="status-filter">Status</label>
        <select id="status-filter" value={status} onChange={(e) => onStatus(e.target.value)}>
          <option value="">All</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
