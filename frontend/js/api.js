/* Talks to the FastAPI backend (same origin, /api/...). */
const API = {
  token: localStorage.getItem("pb_token"),
  setToken(t) {
    this.token = t;
    if (t) localStorage.setItem("pb_token", t); else localStorage.removeItem("pb_token");
  },
  async request(method, path, body, isForm) {
    const headers = {};
    if (this.token) headers.Authorization = "Bearer " + this.token;
    if (body && !isForm) headers["Content-Type"] = "application/json";
    let res;
    try {
      res = await fetch("/api" + path, { method, headers, body: body ? (isForm ? body : JSON.stringify(body)) : undefined });
    } catch (e) {
      throw new Error("Cannot reach the PawBridge server. Is the backend running?");
    }
    let data = null;
    try { data = await res.json(); } catch (e) { /* empty body */ }
    if (!res.ok) {
      let msg = "Something went wrong";
      if (data && typeof data.detail === "string") msg = data.detail;
      else if (data && Array.isArray(data.detail)) {
        msg = data.detail.map(d => (d.loc ? d.loc[d.loc.length - 1] + ": " : "") + (d.msg || "").replace("Value error, ", "")).join(". ");
      }
      const err = new Error(msg); err.status = res.status; throw err;
    }
    return data;
  },
  get(p) { return this.request("GET", p); },
  post(p, b) { return this.request("POST", p, b || {}); },
  put(p, b) { return this.request("PUT", p, b || {}); },
  del(p) { return this.request("DELETE", p); },
  upload(file) { const f = new FormData(); f.append("file", file); return this.request("POST", "/uploads", f, true); },
};
