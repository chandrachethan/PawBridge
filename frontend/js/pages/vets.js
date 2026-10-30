async function pageVets(root) {
  const clinics = await API.get("/vets");
  const canBook = hasRole("user", "shelter");
  root.innerHTML = '<div class="container page">' + pageHead("Find a vet", "Browse veterinary clinics and request an appointment for your pet.") +
    '<div class="stack mt-3" style="gap:24px">' + clinics.map(c =>
      '<article class="card clinic"><div class="clinic-photo">' + img(c.image_url, c.name) + '</div><div class="pad-lg"><h2 style="font-size:1.6rem">' + esc(c.name) + "</h2>" +
      '<p class="with-icon muted small mt-1"><span style="color:var(--terra)">' + icon("pin", 15) + "</span>" + esc(c.location) + "</p>" +
      '<div class="chips mt-2">' + c.services.map(s => '<span class="chip">' + esc(s) + "</span>").join("") + "</div>" +
      '<div class="stack-sm small muted mt-2"><span class="with-icon">' + icon("clock", 15) + " " + esc(c.hours) + '</span><span class="with-icon">' + icon("phone", 15) + " " + esc(c.phone) + "</span></div>" +
      '<button class="btn btn-primary mt-3" data-clinic="' + c.id + '"' + (canBook ? "" : " disabled") + ">Request appointment</button>" +
      (canBook ? "" : '<p class="hint">' + (State.user ? "Only adopter and shelter accounts can book." : "Sign in to request an appointment.") + "</p>") + "</div></article>").join("") + "</div></div>";

  $$("[data-clinic]", root).forEach(b => b.addEventListener("click", () => {
    const c = clinics.find(x => x.id === +b.dataset.clinic);
    formModal("Request appointment · " + c.name,
      '<div><label class="label">Pet\'s name</label><input class="input" name="pet_name" required></div>' +
      '<div><label class="label">Preferred date</label><input class="input" type="date" name="preferred_date" min="' + todayISO() + '" required></div>' +
      '<div><label class="label">Preferred time</label><select class="input" name="preferred_time"><option>Morning</option><option>Afternoon</option><option>Evening</option></select></div>' +
      '<div><label class="label">Reason</label><textarea class="input" name="reason" placeholder="Check-up, vaccination, something worrying you..."></textarea></div>',
      "Send request", async (v, m) => {
        await API.post("/vets/appointments", { clinic_id: c.id, pet_name: v.pet_name, preferred_date: v.preferred_date, preferred_time: v.preferred_time, reason: v.reason || "" });
        m.close(); toast("Appointment request sent to " + c.name);
      });
  }));
}
