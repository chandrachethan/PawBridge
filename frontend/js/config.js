/* Frontend settings. Change image file names here if you rename the files in /images. */
const IMG = {
  hero: "images/hero.jpg",
  gallery: [
    "/images/dog1.jpg", "/images/dog2.jpg", "/images/dog3.jpg", "/images/dog4.jpg",
    "/images/cat1.jpg", "/images/cat2.jpg", "/images/cat3.jpg", "/images/hero.jpg",
  ],
};
const PET_TYPES = ["Dog", "Cat", "Rabbit", "Bird", "Other"];
const SEX_OPTIONS = ["Unknown", "Male", "Female"];
const VACC_OPTIONS = ["Unknown", "Fully vaccinated", "Partially vaccinated", "Not vaccinated"];
const PRODUCT_CATEGORIES = ["All products", "Grooming", "Collars", "Leashes", "Bowls", "Toys"];

/* Shown whenever a picture file is missing, so the layout never breaks. */
const PAW_SVG = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect width='24' height='24' fill='#E6EFEA'/>" +
  "<g transform='translate(6 6) scale(.5)' fill='none' stroke='#1B4D3E' stroke-opacity='.35' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'>" +
  "<circle cx='11' cy='4' r='2'/><circle cx='18' cy='8' r='2'/><circle cx='20' cy='16' r='2'/>" +
  "<path d='M9 10a5 5 0 0 1 5 5v3.5a3.5 3.5 0 0 1-6.84 1.045Q6.52 17.48 4.46 16.84A3.5 3.5 0 0 1 5.5 10Z'/></g></svg>");
