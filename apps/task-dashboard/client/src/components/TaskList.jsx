import TaskItem from "./TaskItem.jsx";

export default function TaskList({ items, loading, error, onRetry, hasFilters, onClearFilters, ...handlers }) {
  if (error) {
    return (
      <div className="state state-error" role="alert">
        <p><strong>Couldn't load tasks.</strong></p>
        <p>{error.message}</p>
        <button type="button" className="btn btn-primary" onClick={onRetry}>Try again</button>
      </div>
    );
  }

  if (loading && items.length === 0) {
    return (
      <ul className="tasks" aria-busy="true" aria-label="Loading tasks">
        {[0, 1, 2].map((i) => (
          <li key={i} className="task skeleton" aria-hidden="true">
            <div className="sk sk-title" />
            <div className="sk sk-line" />
          </li>
        ))}
      </ul>
    );
  }

  if (items.length === 0) {
    return (
      <div className="state">
        {hasFilters ? (
          <>
            <p><strong>No tasks match these filters.</strong></p>
            <button type="button" className="btn" onClick={onClearFilters}>Clear filters</button>
          </>
        ) : (
          <>
            <p><strong>No tasks yet.</strong></p>
            <p>Add your first task using the form.</p>
          </>
        )}
      </div>
    );
  }

  return (
    <ul className={`tasks ${loading ? "is-refreshing" : ""}`} aria-busy={loading}>
      {items.map((t) => (
        <TaskItem key={t._id} task={t} {...handlers} />
      ))}
    </ul>
  );
}
