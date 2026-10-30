async function pageRehome(root) {
  if (!State.user) { root.innerHTML = authNeeded("Please sign in to list a pet for rehoming."); return; }
  if (!hasRole("user", "shelter")) { root.innerHTML = '<div class="page-narrow center"><h1>Not available</h1><p class="muted">Only adopter and shelter accounts can list pets.</p></div>'; return; }
  let photos = [];
  const sel = (name, arr) => '<select class="input" name="' + name + '">' + arr.map(v => "<option>" + v + "</option>").join("") + "</select>";
  const field = (label, html, hint) => "<div><label class=\"label\">" + label + "</label>" + html + (hint ? '<p class="hint">' + hint + "</p>" : "") + "</div>";
  root.innerHTML = '<div class="page-narrow">' +
    pageHead("Rehome a pet", "Life changes — rehoming responsibly through PawBridge keeps your pet safe and visible to genuine adopters.") +
    noticeBox("New listings start as Pending Review and appear in the public catalogue once a moderator approves them.") +
    '<form id="form" class="card pad-lg stack mt-3"><div class="form-grid">' +
    field("Pet name*", '<input class="input" name="name">') + field("Animal type*", sel("animal_type", PET_TYPES)) +
    field("Breed", '<input class="input" name="breed">', 'For street dogs, write "Indie (Indian street dog)".') +
    field("Age*", '<input class="input" name="age" placeholder="e.g. 2 Years or 4 Months">') +
    field("Sex", sel("sex", SEX_OPTIONS)) + field("General location*", '<input class="input" name="location" placeholder="City and state">') +
    field("Vaccination status", sel("vaccination_status", VACC_OPTIONS)) + field("Temperament*", '<input class="input" name="temperament" placeholder="e.g. Gentle, Playful">') +
    "</div>" + field("Care requirements*", '<textarea class="input" name="care_requirements"></textarea>') +
    field("Known health & vaccination details*", '<textarea class="input" name="health_details"></textarea>', "Mark anything unknown as unknown.") +
    field("Short biography*", '<textarea class="input" name="bio"></textarea>') + field("Reason for rehoming*", '<textarea class="input" name="rehoming_reason"></textarea>') +
    '<div><label class="label">Photos (up to 4)</label><div class="row"><label class="btn btn-outline btn-sm" style="cursor:pointer">' + icon("upload", 15) +
    ' Upload photos<input type="file" id="file" accept="image/*" multiple hidden></label><span class="small muted" id="pcount">or pick from the gallery below · 0/4 selected</span></div>' +
    '<div class="upload-grid" id="gallery">' + IMG.gallery.map(g => '<button type="button" data-g="' + esc(g) + '">' + img(g, "Gallery option") + "</button>").join("") + '</div><div class="row mt-2" id="picked"></div></div>' +
    '<label class="consent"><input type="checkbox" id="consent"> I confirm that I am authorised to rehome this pet and that the information above is accurate to the best of my knowledge.</label>' +
    '<div><button class="btn btn-primary" id="submit" disabled>Submit listing</button></div></form></div>';

  const form = $("#form"), required = ["name", "age", "location", "temperament", "care_requirements", "health_details", "bio", "rehoming_reason"];
  const ready = () => required.every(k => form.elements[k].value.trim()) && $("#consent").checked;
  const refresh = () => {
    $("#submit").disabled = !ready();
    $("#pcount").textContent = "or pick from the gallery below · " + photos.length + "/4 selected";
    $$("#gallery button").forEach(b => b.classList.toggle("on", photos.includes(b.dataset.g)));
    $("#picked").innerHTML = photos.map((p, i) => '<div style="position:relative">' + img(p, "Selected " + (i + 1), "") +
      '<button type="button" class="icon-btn" data-rm="' + i + '" style="position:absolute;right:-6px;top:-6px;background:var(--terra);color:#fff;border-radius:50%">' + icon("x", 14) + "</button></div>").join("");
    $$("#picked img").forEach(i => { i.style.cssText = "width:96px;height:78px;object-fit:cover;border-radius:12px"; });
    $$("[data-rm]").forEach(b => b.onclick = () => { photos.splice(+b.dataset.rm, 1); refresh(); });
  };
  const add = (url) => { if (photos.length >= 4) return toast("You can add up to 4 photos", "error"); if (!photos.includes(url)) photos.push(url); refresh(); };
  form.addEventListener("input", refresh);
  $$("#gallery button").forEach(b => b.addEventListener("click", () => {
    const g = b.dataset.g;
    if (photos.includes(g)) { photos = photos.filter(x => x !== g); refresh(); } else add(g);
  }));
  $("#file").addEventListener("change", async (e) => {
    for (const file of Array.from(e.target.files).slice(0, 4 - photos.length)) {
      try { add((await API.upload(file)).url); } catch (err) { toast(err.message, "error"); }
    }
    e.target.value = "";
  });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!ready()) return;
    $("#submit").disabled = true;
    const body = Object.fromEntries(new FormData(form));
    body.photos = photos; body.consent = true;
    try { await API.post("/pets", body); toast("Listing submitted for review"); go("/dashboard/listings"); }
    catch (err) { toast(err.message, "error"); $("#submit").disabled = false; }
  });
}
