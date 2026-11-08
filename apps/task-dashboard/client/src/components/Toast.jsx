export default function Toast({ toasts, onDismiss }) {
  return (
    <div className="toasts" aria-live="polite" aria-atomic="false" role="status">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>{t.message}</span>
          <button type="button" className="link" onClick={() => onDismiss(t.id)} aria-label="Dismiss notification">
            Dismiss
          </button>
        </div>
      ))}
    </div>
  );
}
