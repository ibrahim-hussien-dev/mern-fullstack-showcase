import { useCallback, useEffect, useState } from "react";
import { useTasks } from "./hooks/useTasks.js";
import { useDebounced } from "./hooks/useDebounced.js";
import TaskForm from "./components/TaskForm.jsx";
import TaskList from "./components/TaskList.jsx";
import FilterBar from "./components/FilterBar.jsx";
import StatsBar from "./components/StatsBar.jsx";
import Modal from "./components/Modal.jsx";
import Toast from "./components/Toast.jsx";

const PAGE_SIZE = 8;

export default function App() {
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const q = useDebounced(search.trim(), 300);

  const { items, total, loading, error, stats, reload, create, update, changeStatus, remove } = useTasks({
    status, q, page, limit: PAGE_SIZE,
  });

  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [toasts, setToasts] = useState([]);

  const pushToast = useCallback((message, type = "success") => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);
  const dismissToast = (id) => setToasts((t) => t.filter((x) => x.id !== id));

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  useEffect(() => setPage(1), [status, q]);
  useEffect(() => {
    if (!loading && !error && page > pages) setPage(pages);
  }, [loading, error, page, pages]);

  async function handleCreate(data) {
    await create(data);
    pushToast("Task added.");
  }
  async function handleEdit(data) {
    await update(editing._id, data);
    setEditing(null);
    pushToast("Task updated.");
  }
  async function handleStatus(task, next) {
    try {
      await changeStatus(task._id, next);
    } catch (e) {
      pushToast(`Couldn't change status: ${e.message}`, "error");
    }
  }
  async function confirmDelete() {
    setDeletingBusy(true);
    try {
      await remove(deleting._id);
      setDeleting(null);
      pushToast("Task deleted.");
    } catch (e) {
      pushToast(`Couldn't delete task: ${e.message}`, "error");
    } finally {
      setDeletingBusy(false);
    }
  }
  const clearFilters = () => {
    setStatus("");
    setSearch("");
  };

  return (
    <>
      <a className="skip" href="#tasks">Skip to tasks</a>
      <header className="site-header">
        <div className="wrap">
          <h1>Task Dashboard</h1>
          <p>Keep track of what's next.</p>
        </div>
      </header>

      <main className="wrap layout">
        <aside className="panel" aria-labelledby="new-task">
          <h2 id="new-task">New task</h2>
          <TaskForm onSubmit={handleCreate} />
        </aside>

        <section id="tasks" className="panel" aria-labelledby="task-heading" tabIndex={-1}>
          <h2 id="task-heading">Tasks</h2>
          <StatsBar stats={stats} />
          <FilterBar status={status} q={search} onStatus={setStatus} onSearch={setSearch} />
          <TaskList
            items={items}
            loading={loading}
            error={error}
            onRetry={reload}
            hasFilters={Boolean(status || q)}
            onClearFilters={clearFilters}
            onStatusChange={handleStatus}
            onEdit={setEditing}
            onDelete={setDeleting}
          />
          {!error && total > PAGE_SIZE && (
            <nav className="pager" aria-label="Pagination">
              <button type="button" className="btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
              <span>Page {page} of {pages}</span>
              <button type="button" className="btn" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</button>
            </nav>
          )}
        </section>
      </main>

      {editing && (
        <Modal title="Edit task" onClose={() => setEditing(null)}>
          <TaskForm initial={editing} submitLabel="Save changes" onSubmit={handleEdit} onCancel={() => setEditing(null)} />
        </Modal>
      )}

      {deleting && (
        <Modal title="Delete this task?" onClose={() => !deletingBusy && setDeleting(null)}>
          <p>"{deleting.title}" will be permanently removed.</p>
          <div className="actions">
            <button type="button" className="btn" onClick={() => setDeleting(null)} disabled={deletingBusy}>Keep task</button>
            <button type="button" className="btn btn-danger-solid" onClick={confirmDelete} disabled={deletingBusy}>
              {deletingBusy ? "Deleting…" : "Delete task"}
            </button>
          </div>
        </Modal>
      )}

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
