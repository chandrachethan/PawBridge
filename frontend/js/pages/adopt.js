async function pageAdopt(root) {
  const pets = await API.get("/pets");
  const f = { q: "", animal: "", loc: "", temp: "", age: "" };
  const locs = [...new Set(pets.map(p => p.location))].sort();
  const temps = [...new Set(pets.map(p => p.temperament))].sort();
  const opt = (arr) => arr.map(v => "<option>" + esc(v) + "</option>").join("");
  root.innerHTML = '<div class="container page">' +
    pageHead("Adopt a pet", "Every listing here is equally visible — Indie dogs, pedigree dogs, cats and more. Read each story and meet before you decide.") +
    '<div class="card pad"><h3>Filter the catalogue</h3><div class="grid-4 mt-2" style="grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:12px">' +
    '<input class="input" id="f-q" placeholder="Search by name or story..." aria-label="Search">' +
    '<select class="input" id="f-animal"><option value="">All animals</option><option value="Dog">Dogs</option><option value="Cat">Cats</option><option value="Indie">Indie animals</option></select>' +
    '<select class="input" id="f-loc"><option value="">All locations</option>' + opt(locs) + "</select>" +
    '<select class="input" id="f-temp"><option value="">Any temperament</option>' + opt(temps) + "</select>" +
    '<select class="input" id="f-age"><option value="">Any age</option><option value="under1">Under 1 year</option><option value="1to3">1–3 years</option><option value="over3">Over 3 years</option></select>' +
    '</div></div><p class="small muted mt-2" id="count"></p><div class="grid-3" id="grid"></div></div>';

  function draw() {
    const q = f.q.trim().toLowerCase();
    const list = pets.filter(p => {
      if (q && !(p.name + " " + p.bio + " " + p.breed + " " + p.temperament + " " + p.location).toLowerCase().includes(q)) return false;
      if (f.animal === "Indie" && !p.is_indie) return false;
      if (f.animal && f.animal !== "Indie" && p.animal_type !== f.animal) return false;
      if (f.loc && p.location !== f.loc) return false;
      if (f.temp && p.temperament !== f.temp) return false;
      const m = p.age_months;
      if (f.age === "under1" && !(m !== null && m < 12)) return false;
      if (f.age === "1to3" && !(m >= 12 && m <= 36)) return false;
      if (f.age === "over3" && !(m > 36)) return false;
      return true;
    });
    $("#count").textContent = list.length + (list.length === 1 ? " pet found" : " pets found");
    $("#grid").innerHTML = list.length ? list.map(petCard).join("") : '<div style="grid-column:1/-1">' + emptyState("No pets match", "Try clearing one of the filters.") + "</div>";
  }
  [["f-q", "q"], ["f-animal", "animal"], ["f-loc", "loc"], ["f-temp", "temp"], ["f-age", "age"]].forEach(([id, key]) => {
    $("#" + id).addEventListener(id === "f-q" ? "input" : "change", (e) => { f[key] = e.target.value; draw(); });
  });
  draw();
}
