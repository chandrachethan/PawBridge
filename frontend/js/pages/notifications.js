async function pageNotifications(root) {
  if (!State.user) { root.innerHTML = authNeeded("Sign in to see your notifications."); return; }
  const rows = await API.get("/notifications");
  root.innerHTML = '<div class="page-narrow">' + '<div class="row-between page-head"><div><h1>Notifications</h1><p class="muted mt-1">Adoption requests, visit slots, appointments, orders and messages sent to your account.</p></div>' +
    (rows.some(n => !n.is_read) ? '<button class="btn btn-outline btn-sm" id="readall">Mark all as read</button>' : "") + "</div>" +
    (rows.length ? '<div class="card" style="overflow:hidden">' + rows.map(n => '<div class="notif' + (n.is_read ? "" : " unread") + '" data-id="' + n.id + '" data-link="' + esc(n.link) + '"><span class="dot"></span><div><h4>' + esc(n.title) +
      "</h4><p class=\"muted\">" + esc(n.body) + '</p><p class="small muted">' + fmtStamp(n.created_at) + "</p></div></div>").join("") + "</div>"
      : emptyState("You are all caught up", "New requests and updates will show up here.")) + "</div>";
  if ($("#readall")) $("#readall").onclick = async () => { await API.post("/notifications/read-all"); await refreshUnread(); pageNotifications(root); };
  $$(".notif", root).forEach(el => el.onclick = async () => {
    try { await API.post("/notifications/" + el.dataset.id + "/read"); } catch (e) { /* ignore */ }
    await refreshUnread();
    if (el.dataset.link) go(el.dataset.link);
  });
}
