/* Small helpers: escaping, icons, modal, toast, formatting. */
const $ = (sel, root) => (root || document).querySelector(sel);
const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
const go = (path) => { location.hash = path; };

function esc(v) {
  return String(v == null ? "" : v).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

const ICONS = {
  paw: '<circle cx="11" cy="4" r="2"/><circle cx="18" cy="8" r="2"/><circle cx="20" cy="16" r="2"/><path d="M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z"/>',
  heart: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  clip: '<rect width="8" height="4" x="8" y="2" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4M12 16h4M8 11h.01M8 16h.01"/>',
  menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  plus: '<path d="M5 12h14M12 5v14"/>',
  clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
  calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  cart: '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  chat: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
};
function icon(name, size, fill) {
  return '<svg width="' + (size || 18) + '" height="' + (size || 18) + '" viewBox="0 0 24 24" fill="' + (fill || "none") +
    '" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + "</svg>";
}

function imgFallback(el) { el.onerror = null; el.src = PAW_SVG; }
function img(src, alt, cls) {
  return '<img src="' + esc(src || PAW_SVG) + '" alt="' + esc(alt) + '"' + (cls ? ' class="' + cls + '"' : "") +
    ' loading="lazy" onerror="imgFallback(this)">';
}

const money = (n) => "₹" + Number(n).toLocaleString("en-IN");
const fmtDate = (d) => d ? new Date(d + "T00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";
const fmtStamp = (iso) => iso ? new Date(iso + "Z").toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "";
const todayISO = () => { const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };

function statusBadge(status) {
  const map = { "Pending Review": "amber", Pending: "amber", Requested: "amber", Placed: "amber", Approved: "green", Accepted: "green",
    Confirmed: "green", Delivered: "green", Adopted: "green", Shipped: "blue", Rejected: "red", Declined: "red", Cancelled: "red" };
  return '<span class="status ' + (map[status] || "") + '">' + esc(status) + "</span>";
}

let toastTimer;
function toast(msg, type) {
  const t = $("#toast");
  t.textContent = msg; t.className = "toast" + (type === "error" ? " error" : ""); t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 3000);
}

function openModal(title, html) {
  const wrap = document.createElement("div");
  wrap.className = "modal-back";
  wrap.innerHTML = '<div class="modal card" role="dialog" aria-modal="true"><div class="modal-head"><h3>' + esc(title) +
    '</h3><button class="icon-btn" data-close aria-label="Close">' + icon("x") + '</button></div><div class="modal-body">' + html + "</div></div>";
  wrap.close = () => wrap.remove();
  wrap.addEventListener("mousedown", (e) => { if (e.target === wrap || e.target.closest("[data-close]")) wrap.close(); });
  document.body.appendChild(wrap);
  return wrap;
}

/* A modal containing one form. onSubmit(values, modal) may throw an Error to show a message. */
function formModal(title, fieldsHtml, submitLabel, onSubmit) {
  const m = openModal(title, '<form class="stack">' + fieldsHtml + '<button class="btn btn-primary btn-block">' + esc(submitLabel) + "</button></form>");
  const form = $("form", m);
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("button.btn", form);
    btn.disabled = true;
    try { await onSubmit(Object.fromEntries(new FormData(form)), m); }
    catch (err) { toast(err.message, "error"); btn.disabled = false; }
  });
  return m;
}

/* Ask for an optional note (e.g. a reason when declining). Resolves to the text, or null if cancelled. */
function askNote(title, label, buttonText) {
  return new Promise((resolve) => {
    let done = false;
    const m = formModal(title, '<div><label class="label">' + esc(label) + '</label><textarea class="input" name="note" placeholder="Optional"></textarea></div>',
      buttonText, async (v, modal) => { done = true; modal.close(); resolve(v.note || ""); });
    m.addEventListener("mousedown", () => setTimeout(() => { if (!done && !document.body.contains(m)) resolve(null); }, 0));
  });
}

function emptyState(title, text, action) {
  return '<div class="empty">' + icon("paw", 40) + "<h3>" + esc(title) + "</h3><p>" + esc(text) + "</p>" + (action || "") + "</div>";
}
function pageHead(title, sub) { return '<div class="page-head"><h1>' + esc(title) + "</h1>" + (sub ? "<p>" + esc(sub) + "</p>" : "") + "</div>"; }
function noticeBox(text) { return '<div class="notice">' + icon("clip") + "<p>" + esc(text) + "</p></div>"; }
function authNeeded(msg) {
  return '<div class="page-narrow"><div class="card pad-lg center"><div class="strong">' + icon("paw", 36) + "</div><h2 class=\"mt-2\">Sign in to continue</h2><p class=\"muted\">" +
    esc(msg) + '</p><a class="btn btn-primary mt-2" href="#/login">Sign in or create an account</a></div></div>';
}
