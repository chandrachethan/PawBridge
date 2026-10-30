/* Dashboard: tabs depend on the account type (user, shelter, vet, store, moderator). */
function dashTabs() {
  const r = State.user.role;
  if (r === "vet") return [["vet-appointments", "Appointment Requests"]];
  if (r === "store") return [["store-orders", "Incoming Orders"]];
  if (r === "moderator") return [["overview", "Overview"]];
  return [["listings", "My Listings"], ["incoming", "Incoming Adoptions"], ["requests", "My Adoption Requests"], ["visits", "Visits"],
    ["appointments", "Vet Appointments"], ["orders", "My Orders"], ["saved", "Saved Products"]];
}

async function pageDashboard(root, tab) {
  if (!State.user) { root.innerHTML = authNeeded("Sign in to see your dashboard."); return; }
  const tabs = dashTabs();
  if (!tabs.some(t => t[0] === tab)) tab = tabs[0][0];
  const roleLabel = { user: "Individual account", shelter: "Shelter account", vet: "Vet clinic account", store: "Store account", moderator: "Moderator account" }[State.user.role];
  root.innerHTML = '<div class="container page"><div class="row-between page-head"><div><h1>My dashboard</h1><p class="with-icon muted mt-1">' + icon("user", 16) + " " +
    esc(State.user.display_name) + " · " + roleLabel + "</p></div>" +
    (hasRole("user", "shelter") ? '<a href="#/rehome" class="btn btn-terra">' + icon("plus", 16) + " List a pet</a>" : "") + "</div>" +
    '<div class="tabs">' + tabs.map(t => '<button data-t="' + t[0] + '" class="' + (t[0] === tab ? "on" : "") + '">' + t[1] + "</button>").join("") + '</div><div id="panel"><p class="muted">Loading…</p></div></div>';
  $$(".tabs button", root).forEach(b => b.onclick = () => go("/dashboard/" + b.dataset.t));
  const panel = $("#panel");
  const reload = () => pageDashboardPanel(panel, tab, reload);
  await reload();
}

const dashRow = (main, right) => '<div class="card item"><div class="item-main">' + main + '</div><div class="row">' + (right || "") + "</div></div>";
const dashThumb = (src, name) => img(src, name);

async function pageDashboardPanel(panel, tab, reload) {
  const renderers = { listings: tabListings, incoming: tabIncoming, requests: tabRequests, visits: tabVisits, appointments: tabAppointments,
    orders: tabOrders, saved: tabSaved, "vet-appointments": tabVetAppointments, "store-orders": tabStoreOrders, overview: tabOverview };
  try { await renderers[tab](panel, reload); }
  catch (e) { panel.innerHTML = '<div class="error-box">' + esc(e.message) + "</div>"; }
}

async function tabListings(panel) {
  const pets = await API.get("/pets/mine");
  panel.innerHTML = pets.length ? '<div class="stack">' + pets.map(p => dashRow(
    dashThumb(p.photos[0], p.name) + '<div><h3><a href="#/adopt/' + p.id + '">' + esc(p.name) + "</a></h3><p>" + esc(p.breed || p.animal_type) + " · " + esc(p.location) + "</p></div>", statusBadge(p.status))).join("") + "</div>"
    : '<div class="empty">' + icon("paw", 40) + "<h3>No pet listings yet</h3><p>When you list a pet for rehoming, it will appear here with its review status.</p>" +
      '<a href="#/rehome" class="btn btn-primary mt-2">Create your first listing</a></div>';
}

async function tabIncoming(panel, reload) {
  const rows = await API.get("/adoptions/incoming");
  panel.innerHTML = rows.length ? '<div class="stack">' + rows.map(r => dashRow(
    dashThumb(r.pet_photo, r.pet_name) + '<div><h3>' + esc(r.pet_name) + ' <span class="muted small" style="font-family:DM Sans">· from ' + esc(r.requester_name) + "</span></h3><p>" +
    esc(r.message || "No message.") + (r.response_note ? "<br>Your note: " + esc(r.response_note) : "") + "</p></div>",
    statusBadge(r.status) + '<button class="btn btn-outline btn-sm" data-chat="' + r.id + '">' + icon("chat", 14) + " Chat</button>" +
    (r.status === "Pending" ? '<button class="btn btn-primary btn-sm" data-a="approve" data-id="' + r.id + '">Approve</button><button class="btn btn-terra-outline btn-sm" data-a="decline" data-id="' + r.id + '">Decline</button>' : ""))).join("") + "</div>"
    : emptyState("No adoption requests yet", "When someone asks to adopt one of your pets, you will be notified and the request appears here.");
  bindChat(panel);
  $$("[data-a]", panel).forEach(b => b.onclick = async () => {
    const approve = b.dataset.a === "approve";
    const note = await askNote(approve ? "Approve this adoption" : "Decline this request", approve ? "Message for the adopter (handover details, etc.)" : "Reason (shared with the adopter)", approve ? "Approve" : "Decline");
    if (note === null) return;
    try { await API.post("/adoptions/" + b.dataset.id + "/decision", { action: b.dataset.a, note }); toast(approve ? "Adoption approved" : "Request declined"); reload(); }
    catch (e) { toast(e.message, "error"); }
  });
}

function bindChat(panel) { $$("[data-chat]", panel).forEach(b => b.onclick = () => openChat(+b.dataset.chat)); }

async function tabRequests(panel) {
  const rows = await API.get("/adoptions/mine");
  panel.innerHTML = rows.length ? '<div class="stack">' + rows.map(r => dashRow(
    dashThumb(r.pet_photo, r.pet_name) + '<div><h3><a href="#/adopt/' + r.pet_id + '">' + esc(r.pet_name) + '</a></h3><p>Sent to ' + esc(r.owner_name) + " (" + esc(r.owner_kind) + ")" +
    (r.response_note ? "<br>Reply: " + esc(r.response_note) : "") + "</p></div>",
    statusBadge(r.status) + '<button class="btn btn-outline btn-sm" data-chat="' + r.id + '">' + icon("chat", 14) + " Chat</button>")).join("") + "</div>"
    : emptyState("No adoption requests", "Requests you send will be listed here with their status.", '<a class="btn btn-primary mt-2" href="#/adopt">Find a pet</a>');
  bindChat(panel);
}

async function tabVisits(panel, reload) {
  const [mine, incoming] = await Promise.all([API.get("/visits/mine"), API.get("/visits/incoming")]);
  const when = (v) => fmtDate(v.visit_date) + " · " + esc(v.time_slot);
  panel.innerHTML = '<h3 class="sub-head" style="margin-top:0">Visits I requested</h3>' +
    (mine.length ? '<div class="stack">' + mine.map(v => dashRow(dashThumb(v.pet_photo, v.pet_name) + "<div><h3>" + esc(v.pet_name) + "</h3><p>" + when(v) + " · " + esc(v.location) +
      (v.response_note ? "<br>Reply: " + esc(v.response_note) : "") + "</p></div>", statusBadge(v.status))).join("") + "</div>" : '<p class="muted">You have not requested any visits.</p>') +
    '<h3 class="sub-head">Visit requests for my pets</h3>' +
    (incoming.length ? '<div class="stack">' + incoming.map(v => dashRow(dashThumb(v.pet_photo, v.pet_name) + "<div><h3>" + esc(v.pet_name) + ' <span class="muted small" style="font-family:DM Sans">· ' + esc(v.requester_name) + "</span></h3><p>" +
      when(v) + (v.note ? "<br>" + esc(v.note) : "") + "</p></div>", statusBadge(v.status) +
      (v.status === "Requested" ? '<button class="btn btn-primary btn-sm" data-v="accept" data-id="' + v.id + '">Accept slot</button><button class="btn btn-terra-outline btn-sm" data-v="reject" data-id="' + v.id + '">Reject</button>' : ""))).join("") + "</div>"
      : '<p class="muted">Nobody has asked to visit your pets yet.</p>');
  $$("[data-v]", panel).forEach(b => b.onclick = async () => {
    const accept = b.dataset.v === "accept";
    const note = await askNote(accept ? "Accept this visit slot" : "Reject this visit slot", accept ? "Message for the visitor (address, what to bring)" : "Reason (e.g. suggest another day)", accept ? "Accept" : "Reject");
    if (note === null) return;
    try { await API.post("/visits/" + b.dataset.id + "/decision", { action: b.dataset.v, note }); toast(accept ? "Visit accepted" : "Visit rejected"); reload(); }
    catch (e) { toast(e.message, "error"); }
  });
}

async function tabAppointments(panel) {
  const rows = await API.get("/vets/appointments/mine");
  panel.innerHTML = rows.length ? '<div class="stack">' + rows.map(a => dashRow("<div><h3>" + esc(a.clinic_name) + ' <span class="muted small" style="font-family:DM Sans">· for ' + esc(a.pet_name) + "</span></h3><p>" +
    fmtDate(a.preferred_date) + " · " + esc(a.preferred_time) + (a.reason ? " · " + esc(a.reason) : "") + (a.response_note ? "<br>Clinic note: " + esc(a.response_note) : "") + "</p></div>", statusBadge(a.status))).join("") + "</div>"
    : emptyState("No vet appointments", "Requests you send to clinics will appear here.", '<a class="btn btn-primary mt-2" href="#/vets">Find a vet</a>');
}

function orderCard(o, forStore, reload) {
  const flow = { Placed: [["Confirmed", "Confirm"], ["Cancelled", "Cancel"]], Confirmed: [["Shipped", "Mark shipped"], ["Cancelled", "Cancel"]], Shipped: [["Delivered", "Mark delivered"]] };
  const actions = forStore && flow[o.status] ? flow[o.status].map(([s, l]) => '<button class="btn ' + (s === "Cancelled" ? "btn-terra-outline" : "btn-primary") + ' btn-sm" data-os="' + s + '" data-id="' + o.id + '">' + l + "</button>").join("") : "";
  return '<div class="card pad"><div class="row-between"><div><h3>Order #' + o.id + '</h3><p class="small muted">' + fmtStamp(o.created_at) + (forStore ? " · " + esc(o.username) : "") + "</p></div>" +
    '<div class="row">' + statusBadge(o.status) + "</div></div>" +
    '<div class="mt-2">' + o.items.map(i => '<div class="sum-row small"><span>' + esc(i.name) + " × " + i.quantity + "</span><span>" + money(i.price * i.quantity) + "</span></div>").join("") +
    '<div class="sum-row small"><span>Delivery</span><span>' + (o.delivery_fee ? money(o.delivery_fee) : "Free") + '</span></div><div class="sum-row total"><span>Total</span><span>' + money(o.total) + "</span></div></div>" +
    '<p class="small muted mt-1">Payment: ' + esc(o.payment_method.toUpperCase()) + " · " + esc(o.payment_status) + (o.payment_detail ? " (" + esc(o.payment_detail) + ")" : "") + "</p>" +
    (forStore ? '<p class="small muted">Deliver to: ' + esc(o.full_name) + ", " + esc(o.phone) + ", " + esc(o.address) + ", " + esc(o.city) + " " + esc(o.pincode) + "</p>" : "") +
    (actions ? '<div class="row mt-2">' + actions + "</div>" : "") + "</div>";
}

async function tabOrders(panel) {
  const rows = await API.get("/orders/mine");
  panel.innerHTML = rows.length ? '<div class="stack">' + rows.map(o => orderCard(o, false)).join("") + "</div>"
    : emptyState("No orders yet", "Orders you place in Pet Essentials appear here with live status.", '<a class="btn btn-primary mt-2" href="#/essentials">Browse essentials</a>');
}

async function tabStoreOrders(panel, reload) {
  const rows = await API.get("/orders/incoming");
  panel.innerHTML = rows.length ? '<div class="stack">' + rows.map(o => orderCard(o, true)).join("") + "</div>" : emptyState("No orders yet", "New customer orders will show up here.");
  $$("[data-os]", panel).forEach(b => b.onclick = async () => {
    try { await API.post("/orders/" + b.dataset.id + "/status", { status: b.dataset.os }); toast("Order updated. Customer notified."); reload(); }
    catch (e) { toast(e.message, "error"); }
  });
}

async function tabSaved(panel) {
  const rows = await API.get("/products/saved");
  panel.innerHTML = rows.length ? '<div class="grid-4">' + rows.map(productCard).join("") + "</div>" : emptyState("No saved products", "Tap the heart on any item in Pet Essentials.");
  bindSaveButtons(panel, () => tabSaved(panel));
}

async function tabVetAppointments(panel, reload) {
  const rows = await API.get("/vets/appointments/incoming");
  panel.innerHTML = rows.length ? '<div class="stack">' + rows.map(a => dashRow("<div><h3>" + esc(a.pet_name) + ' <span class="muted small" style="font-family:DM Sans">· ' + esc(a.user_name) + "</span></h3><p>" +
    fmtDate(a.preferred_date) + " · " + esc(a.preferred_time) + (a.reason ? " · " + esc(a.reason) : "") + (a.response_note ? "<br>Your note: " + esc(a.response_note) : "") + "</p></div>",
    statusBadge(a.status) + (a.status === "Requested" ? '<button class="btn btn-primary btn-sm" data-ap="confirm" data-id="' + a.id + '">Confirm</button><button class="btn btn-terra-outline btn-sm" data-ap="decline" data-id="' + a.id + '">Decline</button>' : ""))).join("") + "</div>"
    : emptyState("No appointment requests", "Requests for your clinic will appear here.");
  $$("[data-ap]", panel).forEach(b => b.onclick = async () => {
    const ok = b.dataset.ap === "confirm";
    const note = await askNote(ok ? "Confirm appointment" : "Decline appointment", ok ? "Message for the pet owner (exact time, what to bring)" : "Reason (e.g. suggest another date)", ok ? "Confirm" : "Decline");
    if (note === null) return;
    try { await API.post("/vets/appointments/" + b.dataset.id + "/decision", { action: b.dataset.ap, note }); toast("Appointment " + (ok ? "confirmed" : "declined")); reload(); }
    catch (e) { toast(e.message, "error"); }
  });
}

async function tabOverview(panel) {
  panel.innerHTML = '<div class="grid-2"><a class="card pad" href="#/moderation"><h3>Review listings</h3><p class="muted small mt-1">Approve or reject new pet listings.</p></a>' +
    '<a class="card pad" href="#/database"><h3>Database viewer</h3><p class="muted small mt-1">See every table, including adoption requests and notifications.</p></a></div>';
}

/* Adoption chat between the adopter and the pet's owner. */
async function openChat(rid) {
  let data;
  try { data = await API.get("/adoptions/" + rid + "/messages"); } catch (e) { return toast(e.message, "error"); }
  const me = State.user.id, r = data.request;
  const other = me === r.requester_id ? r.owner_name : r.requester_name;
  const m = openModal("Chat about " + r.pet_name, '<p class="small muted">Talking with ' + esc(other) + '. They are notified of every message.</p><div class="chat" id="chat"></div>' +
    '<form id="cform" class="row" style="flex-wrap:nowrap"><input class="input" name="body" placeholder="Write a message" required autocomplete="off"><button class="btn btn-primary btn-sm">Send</button></form>');
  const draw = (msgs) => {
    const box = $("#chat", m);
    box.innerHTML = msgs.length ? msgs.map(x => '<div class="bubble' + (x.sender_id === me ? " me" : "") + '"><small>' + esc(x.sender_name) + " · " + fmtStamp(x.created_at) + "</small>" + esc(x.body) + "</div>").join("")
      : '<p class="muted small">No messages yet. Say hello!</p>';
    box.scrollTop = box.scrollHeight;
  };
  draw(data.messages);
  const timer = setInterval(async () => {
    if (!document.body.contains(m)) return clearInterval(timer);
    try { draw((await API.get("/adoptions/" + rid + "/messages")).messages); } catch (e) { /* ignore */ }
  }, 5000);
  $("#cform", m).onsubmit = async (e) => {
    e.preventDefault();
    const input = e.target.elements.body, body = input.value.trim();
    if (!body) return;
    input.value = "";
    try { await API.post("/adoptions/" + rid + "/messages", { body }); draw((await API.get("/adoptions/" + rid + "/messages")).messages); }
    catch (err) { toast(err.message, "error"); }
  };
}
