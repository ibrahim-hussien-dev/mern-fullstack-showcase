import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!form.name.trim()) next.name = "Enter your name.";
    if (!EMAIL_RE.test(form.email)) next.email = "Enter a valid email address.";
    if (form.password.length < 8) next.password = "Use at least 8 characters.";
    setErrors(next);
    setServerError(null);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), password: form.password });
      navigate(location.state?.from || "/", { replace: true });
    } catch (err) {
      setServerError(err.status === 409 ? "An account with this email already exists." : err.message);
      setSubmitting(false);
    }
  };

  const field = (id, label, type, autoComplete) => (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input id={id} type={type} autoComplete={autoComplete} value={form[id]} onChange={set(id)}
        aria-invalid={!!errors[id]} aria-describedby={errors[id] ? `${id}-err` : undefined} />
      {errors[id] && <p id={`${id}-err`} className="inline-error">{errors[id]}</p>}
    </div>
  );

  return (
    <section className="auth" aria-labelledby="register-title">
      <h1 id="register-title">Create account</h1>
      <form onSubmit={onSubmit} noValidate>
        {field("name", "Name", "text", "name")}
        {field("email", "Email", "email", "email")}
        {field("password", "Password (8+ characters)", "password", "new-password")}
        {serverError && <p className="inline-error" role="alert">{serverError}</p>}
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </button>
      </form>
      <p>Already registered? <Link to="/login" state={location.state}>Log in</Link></p>
    </section>
  );
}
