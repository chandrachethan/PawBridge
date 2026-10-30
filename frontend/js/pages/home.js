async function pageHome(root) {
  const pets = (await API.get("/pets")).slice(0, 4);
  const steps = [
    ["Browse with equal visibility", "Indie dogs, pedigree dogs, cats and more all sit side by side. Read each story before you decide."],
    ["Request and meet", "Ask to adopt, then book a visit slot. The owner or shelter accepts or rejects it and you are notified."],
    ["Settle in with support", "Book a nearby vet for the first check-up and order everyday essentials for the new arrival."],
  ];
  root.innerHTML =
    '<section class="hero"><div class="container hero-in"><div>' +
    '<span class="eyebrow">' + icon("paw", 15) + " Responsible pet adoption</span>" +
    "<h1>Every paw deserves a <em>loving home</em> — and better care.</h1>" +
    '<p class="lead">PawBridge connects pets — Indie dogs and pedigree friends alike — with people ready to adopt, rehome responsibly and care better.</p>' +
    '<div class="row mt-3"><a href="#/adopt" class="btn btn-primary">Adopt a Pet</a><a href="#/rehome" class="btn btn-outline">Rehome a Pet</a><a href="#/vets" class="btn btn-terra-outline">Find a Vet</a></div></div>' +
    '<div class="hero-photo"><div class="frame">' + img(IMG.hero, "A smiling dog") + "</div>" +
    '<div class="card float-card"><b>No pedigree ranking</b><span class="small muted">Every listing gets equal visibility</span></div></div></div></section>' +
    '<section class="container mt-4"><h2>How it works</h2><div class="grid-3 mt-3">' +
    steps.map((s, i) => '<div class="card pad"><div class="step-num">' + (i + 1) + "</div><h3>" + s[0] + '</h3><p class="muted small">' + s[1] + "</p></div>").join("") +
    '</div></section><section class="container mt-4"><div class="row-between"><h2>Featured pets</h2><a href="#/adopt" class="link">See all pets</a></div>' +
    '<div class="grid-4 mt-3">' + (pets.length ? pets.map(petCard).join("") : "") + "</div></section>";
}
