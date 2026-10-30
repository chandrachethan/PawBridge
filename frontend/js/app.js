/* Router + boot. Pages are plain functions that fill #app. */
async function loadUser() {
  State.user = null;
  if (!API.token) return;
  try { State.user = await API.get("/auth/me"); } catch (e) { API.setToken(null); }
}

async function refreshUnread() {
  if (!State.user) { State.unread = 0; return renderNav(currentRoute()); }
  try { State.unread = (await API.get("/notifications/unread-count")).count; } catch (e) { /* ignore */ }
  renderNav(currentRoute());
}

function logout() { API.setToken(null); State.user = null; State.unread = 0; go("/"); route(); }
const currentRoute = () => location.hash.replace(/^#/, "") || "/";

async function route() {
  const path = currentRoute(), parts = path.split("/").filter(Boolean), root = $("#app");
  renderNav(path);
  root.innerHTML = '<div class="container page"><p class="muted">Loading…</p></div>';
  try {
    switch (parts[0]) {
      case undefined: await pageHome(root); break;
      case "adopt": parts[1] ? await pagePet(root, parts[1]) : await pageAdopt(root); break;
      case "rehome": await pageRehome(root); break;
      case "vets": await pageVets(root); break;
      case "essentials": parts[1] ? await pageProduct(root, parts[1]) : await pageEssentials(root); break;
      case "cart": await pageCart(root); break;
      case "checkout": await pageCheckout(root); break;
      case "login": await pageLogin(root); break;
      case "dashboard": await pageDashboard(root, parts[1]); break;
      case "moderation": await pageModeration(root); break;
      case "database": await pageDatabase(root); break;
      case "notifications": await pageNotifications(root); break;
      case "about": case "contact": case "privacy": case "terms": pageInfo(root, parts[0]); break;
      default: root.innerHTML = '<div class="page-narrow center"><h1>Page not found</h1><a class="btn btn-primary mt-3" href="#/">Go home</a></div>';
    }
  } catch (e) {
    root.innerHTML = '<div class="page-narrow"><div class="error-box">' + esc(e.message) + "</div></div>";
  }
  window.scrollTo(0, 0);
  refreshUnread();
}

window.addEventListener("hashchange", route);
(async function boot() {
  renderFooter();
  await loadUser();
  await route();
  setInterval(() => { if (State.user) refreshUnread(); }, 20000);
})();
