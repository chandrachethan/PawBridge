/* Shared pieces: navbar, footer, cards. */
const State = { user: null, unread: 0 };
const hasRole = (...roles) => !!State.user && roles.includes(State.user.role);

function logoHtml(light) {
  return '<a href="#/" class="logo' + (light ? " light" : "") + '"><span class="logo-mark">' + icon("paw", 22) +
    '</span><span class="logo-text">Paw<b>Bridge</b></span></a>';
}

function navLinks() {
  const links = [["/", "Home"], ["/adopt", "Adopt"], ["/rehome", "Rehome a Pet"], ["/vets", "Find a Vet"], ["/essentials", "Pet Essentials"]];
  if (State.user) links.push(["/dashboard", "Dashboard"]);
  if (hasRole("moderator")) links.push(["/moderation", "Moderation"], ["/database", "Database"]);
  return links;
}
function isActive(to, route) { return to === "/" ? route === "/" : route === to || route.indexOf(to + "/") === 0; }

function renderNav(route) {
  const links = navLinks();
  const a = (cls) => links.map(([to, label]) => '<a href="#' + to + '" class="' + (isActive(to, route) ? "active" : "") + '">' + label + "</a>").join("");
  const u = State.user;
  const right = u
    ? '<a class="bell" href="#/notifications" aria-label="Notifications">' + icon("bell", 18) + (State.unread ? '<span class="count">' + State.unread + "</span>" : "") + "</a>" +
      '<a class="bell" href="#/cart" aria-label="Cart">' + icon("cart", 18) + "</a>" +
      '<a class="user-pill desktop-only" href="#/dashboard"><span class="avatar">' + esc(u.display_name[0].toUpperCase()) + "</span>" + esc(u.display_name) + "</a>" +
      '<button class="link desktop-only" id="logout">Sign out</button>'
    : '<a class="btn btn-primary btn-sm" href="#/login">Sign In</a>';
  $("#nav").innerHTML = '<header class="nav"><div class="container nav-in">' + logoHtml() +
    '<nav class="nav-links">' + a() + '</nav><div class="nav-right">' + right +
    '<button class="hamburger" id="burger" aria-label="Menu">' + icon("menu", 26) + "</button></div></div>" +
    '<div class="mobile-menu" id="mmenu">' + a() + (u ? '<a href="#" id="logout-m">Sign out (' + esc(u.display_name) + ")</a>" : "") + "</div></header>";
  $("#burger").onclick = () => $("#mmenu").classList.toggle("open");
  $("#mmenu").onclick = () => $("#mmenu").classList.remove("open");
  const out = (e) => { e.preventDefault(); logout(); };
  if ($("#logout")) $("#logout").onclick = out;
  if ($("#logout-m")) $("#logout-m").onclick = out;
}

function renderFooter() {
  const col = (items) => "<ul>" + items.map(([l, to]) => '<li><a href="#' + to + '">' + l + "</a></li>").join("") + "</ul>";
  $("#footer").innerHTML = '<footer class="footer"><div class="container footer-grid"><div>' + logoHtml(true) +
    '<p class="mt-2">Connecting pets with loving homes and better care. A responsible-adoption student project.</p></div>' +
    "<div><h4>Project information</h4>" + col([["About", "/about"], ["Contact", "/contact"], ["Privacy", "/privacy"], ["Terms", "/terms"]]) + "</div>" +
    "<div><h4>Explore</h4>" + col([["Adopt a pet", "/adopt"], ["Rehome a pet", "/rehome"], ["Find a vet", "/vets"], ["Pet essentials", "/essentials"]]) + "</div></div>" +
    '<div class="footer-bottom">PawBridge · Responsible pet adoption and care.</div></footer>';
}

function petCard(p) {
  return '<a href="#/adopt/' + p.id + '" class="card pet-card"><div class="pet-photo">' + img(p.photos[0], p.name) +
    '<div class="badges">' + (p.is_indie ? '<span class="badge">Indie</span>' : "") +
    (p.status === "Adopted" ? '<span class="badge badge-dark">Adopted</span>' : "") + "</div></div>" +
    '<div class="pet-body"><h3>' + esc(p.name) + "</h3><p>" + esc(p.breed || p.animal_type) + " · " + esc(p.age) + " · " + esc(p.sex) + "</p>" +
    '<div class="row-between small"><span class="with-icon muted"><span style="color:var(--terra)">' + icon("pin", 15) + "</span>" + esc(p.location) +
    '</span><span class="with-icon strong"><span style="color:var(--terra)">' + icon("heart", 15) + "</span>" + esc(p.temperament) + "</span></div></div></a>";
}

function productCard(p) {
  return '<div class="card product"><a class="product-img" href="#/essentials/' + p.id + '">' + img(p.image_url, p.name) +
    '<button class="heart' + (p.saved ? " on" : "") + '" data-save="' + p.id + '" aria-label="Save product">' + icon("heart", 18, p.saved ? "currentColor" : "none") + "</button></a>" +
    '<div class="product-body"><span class="chip">' + esc(p.category) + '</span><h3 class="mt-1"><a href="#/essentials/' + p.id + '">' + esc(p.name) + "</a></h3><p class=\"muted\">" + esc(p.description) + "</p>" +
    '<div class="row-between mt-2"><span class="price">' + money(p.price) + "</span>" +
    '<span class="' + (p.in_stock ? "in" : "out") + '">' + (p.in_stock ? "In stock" : "Out of stock") + "</span></div></div></div>";
}

/* Wire up the little heart buttons inside a container. */
function bindSaveButtons(root, onChange) {
  $$("[data-save]", root).forEach((btn) => btn.addEventListener("click", async (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!State.user) { toast("Sign in to save products"); return; }
    const id = btn.dataset.save, on = btn.classList.contains("on");
    try {
      if (on) await API.del("/products/" + id + "/save"); else await API.post("/products/" + id + "/save");
      btn.classList.toggle("on", !on);
      btn.innerHTML = icon("heart", 18, !on ? "currentColor" : "none");
      if (onChange) onChange(id, !on);
    } catch (err) { toast(err.message, "error"); }
  }));
}
