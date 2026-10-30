async function pageLogin(root) {
  if (State.user) { go("/dashboard"); return; }
  let tab = "in";
  function draw(err) {
    root.innerHTML = '<div class="page-narrow" style="max-width:480px"><div class="center page-head"><h1>Welcome to PawBridge</h1><p class="muted">Sign in or create an account to continue.</p></div>' +
      '<div class="card pad-lg"><div class="segment"><button data-t="in" class="' + (tab === "in" ? "on" : "") + '">Sign in</button><button data-t="up" class="' + (tab === "up" ? "on" : "") + '">Create account</button></div>' +
      '<form id="auth" class="stack"><div><label class="label">' + (tab === "in" ? "Username or email" : "Username") + '</label><input class="input" name="username" required autocomplete="username"></div>' +
      (tab === "up" ? '<div><label class="label">Email</label><input class="input" type="email" name="email" required></div>' +
        '<div><label class="label">Account type</label><select class="input" name="account_type" id="atype"><option value="user">Individual (adopt or rehome)</option><option value="shelter">Shelter / organisation</option></select></div>' +
        '<div id="org" hidden><label class="label">Shelter / organisation name</label><input class="input" name="org_name"></div>' : "") +
      '<div><label class="label">Password</label><input class="input" type="password" name="password" minlength="6" required autocomplete="' + (tab === "in" ? "current-password" : "new-password") + '"></div>' +
      (err ? '<div class="error-box">' + esc(err) + "</div>" : "") +
      '<button class="btn btn-primary btn-block">' + (tab === "in" ? "Sign in" : "Create account") + "</button></form></div>" +
      '<p class="small muted center mt-2">Accounts: demo / demo12345 (adopter) · happytails / shelter12345 (shelter) · ravi / ravi12345 (owner) · sunbeam / vet12345 (vet) · store / store12345 · moderator / moderator123</p></div>';
    $$(".segment button", root).forEach(b => b.onclick = () => { tab = b.dataset.t; draw(); });
    if ($("#atype")) $("#atype").onchange = (e) => { $("#org").hidden = e.target.value !== "shelter"; };
    $("#auth").onsubmit = async (e) => {
      e.preventDefault();
      const v = Object.fromEntries(new FormData(e.target));
      try {
        const data = tab === "in" ? await API.post("/auth/login", { username: v.username, password: v.password })
          : await API.post("/auth/register", { username: v.username, email: v.email, password: v.password, account_type: v.account_type, org_name: v.org_name || "" });
        API.setToken(data.access_token); State.user = data.user;
        toast("Welcome, " + data.user.display_name);
        await refreshUnread();
        go(data.user.role === "moderator" ? "/moderation" : "/dashboard");
      } catch (e2) { draw(e2.message); }
    };
  }
  draw();
}
