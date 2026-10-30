async function pagePet(root, id) {
  let pet;
  try { pet = await API.get("/pets/" + id); }
  catch (e) { root.innerHTML = '<div class="page-narrow center"><h1>Pet not found</h1><a class="btn btn-primary mt-3" href="#/adopt">Back to adopt</a></div>'; return; }

  const u = State.user;
  const own = u && u.id === pet.owner_id;
  const canAdopt = pet.status === "Approved" && !own;
  const fact = (t, body) => '<div class="card fact"><h3>' + t + "</h3><p>" + body + "</p></div>";
  root.innerHTML = '<div class="container page"><a href="#/adopt" class="link">← All pets</a><div class="detail-grid mt-2"><div>' +
    '<div class="pet-hero" id="hero">' + img(pet.photos[0], pet.name) + '<div class="badges">' + "" +
    (pet.is_indie ? '<span class="badge">Indie</span>' : "") + (pet.status !== "Approved" ? '<span class="badge badge-dark">' + esc(pet.status) + "</span>" : "") + "</div></div>" +
    (pet.photos.length > 1 ? '<div class="thumbs">' + pet.photos.map((p, i) => '<button data-i="' + i + '" class="' + (i === 0 ? "on" : "") + '">' + img(p, pet.name + " photo " + (i + 1)) + "</button>").join("") + "</div>" : "") +
    "</div><div><h1>" + esc(pet.name) + '</h1><p class="muted mt-1">' + esc(pet.breed || pet.animal_type) + " · " + esc(pet.age) + " · " + esc(pet.sex) + "</p>" +
    '<div class="row mt-2 small"><span class="with-icon muted"><span style="color:var(--terra)">' + icon("pin", 15) + "</span>" + esc(pet.location) +
    '</span><span class="with-icon strong"><span style="color:var(--terra)">' + icon("heart", 15) + "</span>" + esc(pet.temperament) + "</span></div>" +
    '<div class="owner-box mt-2">' + icon("user", 20) + "<span>Listed by <b>" + esc(pet.owner_name) + "</b> · " + esc(pet.owner_kind) + "</span></div>" +
    '<p class="mt-2">' + esc(pet.bio) + '</p><div class="stack mt-2">' + fact("Care needs", esc(pet.care_requirements)) +
    fact("Health details", esc(pet.health_details) + ' <span class="strong">Vaccination: ' + esc(pet.vaccination_status) + ".</span>") +
    fact("Reason for rehoming", esc(pet.rehoming_reason)) + "</div>" +
    '<div class="row mt-3"><button class="btn btn-primary" id="b-adopt"' + (canAdopt ? "" : " disabled") + '>Request adoption</button>' +
    '<button class="btn btn-outline" id="b-visit"' + (canAdopt ? "" : " disabled") + ">" + icon("calendar", 16) + " Schedule a visit</button></div>" +
    '<p class="small muted mt-1">' + (pet.status === "Adopted" ? "This pet has found a home." : own ? "This is your own listing." : !u ? "Sign in to request adoption or schedule a visit." : "") + "</p></div></div></div>";

  $$(".thumbs button", root).forEach(b => b.addEventListener("click", () => {
    $$(".thumbs button", root).forEach(x => x.classList.toggle("on", x === b));
    $("#hero img", root).src = pet.photos[+b.dataset.i];
  }));

  const gate = (fn) => async () => {
    if (!u) { toast("Please sign in first"); go("/login"); return; }
    if (!hasRole("user", "shelter")) { toast("Only adopter or shelter accounts can do this", "error"); return; }
    await fn();
  };
  $("#b-adopt").addEventListener("click", gate(() => {
    const who = pet.owner_kind === "Shelter" ? "the shelter" : "the owner";
    formModal("Request to adopt " + pet.name,
      '<p class="small muted">Your request goes to ' + esc(pet.owner_name) + " (" + who + ') and they will be notified.</p>' +
      '<div><label class="label">Tell them about your home</label><textarea class="input" name="message" required placeholder="Who lives with you, your experience with pets, your daily routine..."></textarea></div>',
      "Send request", async (v, m) => {
        await API.post("/adoptions", { pet_id: pet.id, message: v.message });
        m.close(); toast("Request sent to " + pet.owner_name);
      });
  }));
  $("#b-visit").addEventListener("click", gate(async () => {
    const slots = await API.get("/visits/slots");
    formModal("Schedule a visit with " + pet.name,
      '<p class="small muted">' + esc(pet.owner_name) + " will accept or reject the slot you choose.</p>" +
      '<div><label class="label">Date</label><input class="input" type="date" name="visit_date" min="' + todayISO() + '" required></div>' +
      '<div><label class="label">Time slot</label><select class="input" name="time_slot">' + slots.map(s => "<option>" + s + "</option>").join("") + "</select></div>" +
      '<div><label class="label">Note (optional)</label><textarea class="input" name="note"></textarea></div>',
      "Request visit slot", async (v, m) => {
        await API.post("/visits", { pet_id: pet.id, visit_date: v.visit_date, time_slot: v.time_slot, note: v.note || "" });
        m.close(); toast("Visit requested. You will be notified.");
      });
  }));
}
