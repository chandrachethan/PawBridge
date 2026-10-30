function pageInfo(root, page) {
  const pages = {
    about: ["About PawBridge", "PawBridge is a student project about responsible pet adoption. It treats every animal equally — Indie dogs, pedigree dogs, cats and more — and helps shelters and individuals rehome pets, and helps adopters find, meet and care for them."],
    contact: ["Contact", "This is an academic project, so there is no live support desk. Questions about the project can be sent to the project team through your course channel."],
    privacy: ["Privacy", "Account details and requests are stored in the project's local database. Passwords are stored as salted hashes, card numbers are never stored, and nothing is shared outside PawBridge."],
    terms: ["Terms", "By using PawBridge you agree to provide accurate information, treat every animal with care, and respect other members. Adoption decisions are made by the pet's owner or shelter."],
  };
  const p = pages[page];
  root.innerHTML = '<div class="page-narrow"><h1>' + p[0] + '</h1><p class="mt-2" style="max-width:640px">' + p[1] + "</p></div>";
}
