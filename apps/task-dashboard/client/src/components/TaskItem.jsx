import { STATUSES, STATUS_LABELS } from "../hooks/useTasks.js";

const fmt = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" });

export default function TaskItem({ task, onStatusChange, onEdit, onDelete }) {
  const overdue = task.dueDate && task.status !== "done" && new Date(task.dueDate) < new Date(new Date().toDateString());
  return (
    <li className={`task priority-${task.priority} ${task.status === "done" ? "is-done" : ""}`}>
      <div className="task-main">
        <h3>{task.title}</h3>
        {task.description && <p className="task-desc">{task.description}</p>}
        <p className="task-meta">
          <span className={`pill pill-${task.priority}`}>{task.priority} priority</span>
          {task.dueDate && (
            <span className={overdue ? "overdue" : ""}>
              {overdue ? "Overdue: " : "Due "}
              {fmt.format(new Date(task.dueDate))}
            </span>
          )}
        </p>
      </div>
      <div className="task-controls">
        <label className="sr-only" htmlFor={`status-${task._id}`}>Status for {task.title}</label>
        <select id={`status-${task._id}`} value={task.status} onChange={(e) => onStatusChange(task, e.target.value)}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </select>
        <button type="button" className="btn" onClick={() => onEdit(task)} aria-label={`Edit ${task.title}`}>Edit</button>
        <button type="button" className="btn btn-danger" onClick={() => onDelete(task)} aria-label={`Delete ${task.title}`}>Delete</button>
      </div>
    </li>
  );
}
