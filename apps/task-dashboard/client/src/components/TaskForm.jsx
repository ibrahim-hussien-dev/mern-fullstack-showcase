import { useState } from "react";
import { STATUSES, STATUS_LABELS } from "../hooks/useTasks.js";

const PRIORITIES = ["low", "medium", "high"];

function toDateInput(value) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

export function validateTask(values) {
  const errors = {};
  const title = values.title.trim();
  if (!title) errors.title = "Enter a title.";
  else if (title.length > 120) errors.title = "Title must be 120 characters or fewer.";
  if (values.description.length > 1000) errors.description = "Description must be 1000 characters or fewer.";
  if (values.dueDate && Number.isNaN(Date.parse(values.dueDate))) errors.dueDate = "Enter a valid date.";
  return errors;
}

export default function TaskForm({ initial, submitLabel = "Add task", onSubmit, onCancel }) {
  const [values, setValues] = useState({
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    status: initial?.status ?? "todo",
    priority: initial?.priority ?? "medium",
    dueDate: toDateInput(initial?.dueDate),
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState("");

  const set = (field) => (e) => setValues((v) => ({ ...v, [field]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    const found = validateTask(values);
    setErrors(found);
    setServerError("");
    if (Object.keys(found).length) return;

    setSubmitting(true);
    try {
      await onSubmit({
        title: values.title.trim(),
        description: values.description.trim(),
        status: values.status,
        priority: values.priority,
        dueDate: values.dueDate ? values.dueDate : null,
      });
      if (!initial) setValues({ title: "", description: "", status: "todo", priority: "medium", dueDate: "" });
    } catch (err) {
      setServerError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="form">
      <div className="field">
        <label htmlFor="tf-title">Title</label>
        <input
          id="tf-title"
          value={values.title}
          onChange={set("title")}
          maxLength={200}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? "tf-title-err" : undefined}
        />
        {errors.title && <p id="tf-title-err" className="field-error">{errors.title}</p>}
      </div>

      <div className="field">
        <label htmlFor="tf-desc">Description</label>
        <textarea
          id="tf-desc"
          rows={3}
          value={values.description}
          onChange={set("description")}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? "tf-desc-err" : undefined}
        />
        {errors.description && <p id="tf-desc-err" className="field-error">{errors.description}</p>}
      </div>

      <div className="row">
        <div className="field">
          <label htmlFor="tf-status">Status</label>
          <select id="tf-status" value={values.status} onChange={set("status")}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="tf-priority">Priority</label>
          <select id="tf-priority" value={values.priority} onChange={set("priority")}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="tf-due">Due date</label>
          <input id="tf-due" type="date" value={values.dueDate} onChange={set("dueDate")} aria-invalid={Boolean(errors.dueDate)} />
          {errors.dueDate && <p className="field-error">{errors.dueDate}</p>}
        </div>
      </div>

      {serverError && <p className="field-error" role="alert">{serverError}</p>}

      <div className="actions">
        {onCancel && (
          <button type="button" className="btn" onClick={onCancel} disabled={submitting}>Cancel</button>
        )}
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
