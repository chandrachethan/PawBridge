async function pageModeration(root) {
  if (!State.user) { root.innerHTML = authNeeded("Sign in with a moderator account."); return; }
  if (!hasRole("moderator")) { root.innerHTML = '<div class="page-narrow center"><h1>Moderators only</h1><p class="muted mt-1">This page is for PawBridge moderators.</p></div>'; return; }
  async function draw() {
    const pets = await API.get("/pets/moderation/pending");
    root.innerHTML = '<div class="page-narrow" style="max-width:960px">' + pageHead("Moderation", "Review new listings before they appear in the public catalogue.") +
      (pets.length ? '<div class="stack">' + pets.map(p => '<div class="card pad"><div class="row-between"><div class="item-main">' + img(p.photos[0], p.name, "") +
        "<div><h3>" + esc(p.name) + '</h3><p class="small muted">' + esc(p.breed || p.animal_type) + " · " + esc(p.age) + " · " + esc(p.sex) + " · " + esc(p.location) + "<br>Listed by " + esc(p.owner_name) + " (" + esc(p.owner_kind) + ")</p></div></div>" +
        '<div class="row"><button class="btn btn-primary btn-sm" data-a="approve" data-id="' + p.id + '">Approve</button><button class="btn btn-terra-outline btn-sm" data-a="reject" data-id="' + p.id + '">Reject</button></div></div>' +
        '<div class="grid-2 small mt-2"><p><b class="strong">Bio:</b> ' + esc(p.bio) + '</p><p><b class="strong">Care:</b> ' + esc(p.care_requirements) + '</p><p><b class="strong">Health:</b> ' + esc(p.health_details) +
        '</p><p><b class="strong">Reason:</b> ' + esc(p.rehoming_reason) + "</p></div></div>").join("") + "</div>" : emptyState("Nothing waiting for review", "New listings will appear here.")) + "</div>";
    $$("[data-a]", root).forEach(b => b.onclick = async () => {
      try { await API.post("/pets/" + b.dataset.id + "/moderate", { action: b.dataset.a }); toast("Listing " + (b.dataset.a === "approve" ? "approved" : "rejected") + ". Owner notified."); draw(); }
      catch (e) { toast(e.message, "error"); }
    });
  }
  await draw();
}

async function pageDatabase(root) {
  if (!hasRole("moderator")) { root.innerHTML = State.user ? '<div class="page-narrow center"><h1>Moderators only</h1></div>' : authNeeded("Sign in with a moderator account."); return; }
  const data = await API.get("/admin/tables");
  const names = Object.keys(data);
  let cur = names.indexOf("adoption_requests") >= 0 ? "adoption_requests" : names[0];
  function draw() {
    const t = data[cur];
    root.innerHTML = '<div class="container page">' + pageHead("Database viewer", "Live view of the SQLite database (newest rows first, passwords hidden). Use it to show that a request really reached the database.") +
      '<div class="filters" style="margin-top:0">' + names.map(n => '<button class="pill' + (n === cur ? " on" : "") + '" data-t="' + n + '">' + n + " (" + data[n].total + ")</button>").join("") + "</div>" +
      '<div class="card table-wrap"><table><thead><tr>' + t.columns.map(c => "<th>" + esc(c) + "</th>").join("") + "</tr></thead><tbody>" +
      (t.rows.length ? t.rows.map(r => "<tr>" + r.map(c => "<td>" + esc(c) + "</td>").join("") + "</tr>").join("") : '<tr><td colspan="' + t.columns.length + '">No rows</td></tr>') + "</tbody></table></div></div>";
    $$("[data-t]", root).forEach(b => b.onclick = () => { cur = b.dataset.t; draw(); });
  }
  draw();
}
