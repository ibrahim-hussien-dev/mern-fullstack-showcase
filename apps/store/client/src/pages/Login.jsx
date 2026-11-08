import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    const next = {};
    if (!EMAIL_RE.test(form.email)) next.email = "Enter a valid email address.";
    if (!form.password) next.password = "Enter your password.";
    setErrors(next);
    setServerError(null);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    try {
      await login({ email: form.email.trim(), password: form.password });
      navigate(location.state?.from || "/", { replace: true });
    } catch (err) {
      setServerError(err.status === 401 ? "Email or password is incorrect." : err.message);
      setSubmitting(false);
    }
  };

  return (
    <section className="auth" aria-labelledby="login-title">
      <h1 id="login-title">Log in</h1>
      <form onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" type="email" autoComplete="email" value={form.email} onChange={set("email")}
            aria-invalid={!!errors.email} aria-describedby={errors.email ? "email-err" : undefined} />
          {errors.email && <p id="email-err" className="inline-error">{errors.email}</p>}
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete="current-password" value={form.password} onChange={set("password")}
            aria-invalid={!!errors.password} aria-describedby={errors.password ? "pw-err" : undefined} />
          {errors.password && <p id="pw-err" className="inline-error">{errors.password}</p>}
        </div>
        {serverError && <p className="inline-error" role="alert">{serverError}</p>}
        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p>New here? <Link to="/register" state={location.state}>Create an account</Link></p>
    </section>
  );
}
