import { useCallback, useEffect, useRef, useState } from "react";
import { tasksApi } from "../api/tasksApi.js";

export const STATUSES = ["todo", "in_progress", "done"];
export const STATUS_LABELS = { todo: "To do", in_progress: "In progress", done: "Done" };
const EMPTY_STATS = { todo: 0, in_progress: 0, done: 0 };

export function useTasks({ status = "", q = "", page = 1, limit = 8 } = {}) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(EMPTY_STATS);
  const latest = useRef(0);

  const load = useCallback(async () => {
    const id = ++latest.current;
    setLoading(true);
    setError(null);
    try {
      const data = await tasksApi.list({ status, q, page, limit });
      if (id !== latest.current) return;
      setItems(data.items);
      setTotal(data.total);
    } catch (e) {
      if (id !== latest.current) return;
      setError(e);
    } finally {
      if (id === latest.current) setLoading(false);
    }
  }, [status, q, page, limit]);

  const loadStats = useCallback(async () => {
    try {
      const results = await Promise.all(STATUSES.map((s) => tasksApi.list({ status: s, limit: 1 })));
      setStats(Object.fromEntries(STATUSES.map((s, i) => [s, results[i].total])));
    } catch {
      // stats are secondary; the list shows the error state
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const create = useCallback(
    async (data) => {
      const task = await tasksApi.create(data);
      await Promise.all([load(), loadStats()]);
      return task;
    },
    [load, loadStats]
  );

  const update = useCallback(
    async (id, patch) => {
      const task = await tasksApi.update(id, patch);
      setItems((prev) => prev.map((t) => (t._id === id ? task : t)));
      await Promise.all([load(), loadStats()]);
      return task;
    },
    [load, loadStats]
  );

  /** Optimistic status change; rolls back and rethrows on failure. */
  const changeStatus = useCallback(
    async (id, nextStatus) => {
      const snapshot = items;
      setItems((prev) => prev.map((t) => (t._id === id ? { ...t, status: nextStatus } : t)));
      try {
        await tasksApi.update(id, { status: nextStatus });
      } catch (e) {
        setItems(snapshot);
        throw e;
      }
      await Promise.all([status ? load() : Promise.resolve(), loadStats()]);
    },
    [items, status, load, loadStats]
  );

  const remove = useCallback(
    async (id) => {
      await tasksApi.remove(id);
      await Promise.all([load(), loadStats()]);
    },
    [load, loadStats]
  );

  return { items, total, loading, error, stats, reload: load, create, update, changeStatus, remove };
}
