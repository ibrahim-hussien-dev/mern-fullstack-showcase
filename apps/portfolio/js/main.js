(() => {
  "use strict";

  const root = document.documentElement;
  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("primary-nav");
  const scrim = document.getElementById("scrim");
  const desktop = window.matchMedia("(min-width: 900px)");

  /* ---------- Mobile navigation ---------- */
  function openNav() {
    nav.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close menu");
    scrim.hidden = false;
    document.body.classList.add("nav-locked");
    const first = nav.querySelector("a");
    if (first) first.focus();
  }

  function closeNav({ returnFocus = true } = {}) {
    if (!nav.classList.contains("is-open")) return;
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Menu");
    scrim.hidden = true;
    document.body.classList.remove("nav-locked");
    if (returnFocus) toggle.focus();
  }

  toggle.addEventListener("click", () => {
    nav.classList.contains("is-open") ? closeNav() : openNav();
  });

  nav.addEventListener("click", (e) => {
    if (e.target.closest("a")) closeNav({ returnFocus: false });
  });

  scrim.addEventListener("click", () => closeNav());

  document.addEventListener("click", (e) => {
    if (!nav.classList.contains("is-open")) return;
    if (!nav.contains(e.target) && !toggle.contains(e.target)) closeNav({ returnFocus: false });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeNav();
    // Keep keyboard focus inside the open panel and its toggle.
    if (e.key === "Tab" && nav.classList.contains("is-open")) {
      const items = [toggle, ...nav.querySelectorAll("a")];
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  desktop.addEventListener("change", (e) => {
    if (e.matches) closeNav({ returnFocus: false });
  });

  /* ---------- Theme toggle ---------- */
  const themeBtn = document.getElementById("theme-toggle");
  themeBtn.addEventListener("click", () => {
    const current = root.dataset.theme ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (err) { /* storage unavailable */ }
  });

  /* ---------- Scroll spy ---------- */
  const links = [...nav.querySelectorAll("a")];
  const sections = links
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => {
          if (a.getAttribute("href") === `#${entry.target.id}`) a.setAttribute("aria-current", "true");
          else a.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    sections.forEach((s) => spy.observe(s));
  }

  /* ---------- Contact form validation ---------- */
  const form = document.getElementById("contact-form");
  const status = document.getElementById("form-status");
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const rules = {
    name: (v) => (v.trim().length < 2 ? "Enter your name (at least 2 characters)." : ""),
    email: (v) => (!emailRe.test(v.trim()) ? "Enter a valid email address, like name@example.com." : ""),
    message: (v) => (v.trim().length < 10 ? "Write a message of at least 10 characters." : ""),
  };

  function validateField(input) {
    const msg = rules[input.name](input.value);
    const out = document.getElementById(`${input.id}-err`);
    out.textContent = msg;
    if (msg) input.setAttribute("aria-invalid", "true");
    else input.removeAttribute("aria-invalid");
    return !msg;
  }

  const fields = [...form.querySelectorAll("input, textarea")];
  fields.forEach((f) => {
    f.addEventListener("blur", () => validateField(f));
    f.addEventListener("input", () => { if (f.getAttribute("aria-invalid")) validateField(f); });
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    status.textContent = "";
    const results = fields.map(validateField);
    const firstBad = fields.find((f, i) => !results[i]);
    if (firstBad) {
      firstBad.focus();
      status.textContent = "Fix the highlighted fields and send again.";
      return;
    }
    form.reset();
    status.textContent = "Message sent. Thanks, I’ll reply soon.";
  });
})();
