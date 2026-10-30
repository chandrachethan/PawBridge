async function pageEssentials(root) {
  const products = await API.get("/products");
  let cat = "All products";
  root.innerHTML = '<div class="container page">' + pageHead("Pet essentials", "Grooming, collars, leashes, bowls and toys — everything good care looks like.") +
    '<div class="filters" id="chips"></div><div class="grid-4" id="grid"></div></div>';
  function draw() {
    $("#chips").innerHTML = PRODUCT_CATEGORIES.map(c => '<button class="pill' + (c === cat ? " on" : "") + '" data-c="' + c + '">' + c + "</button>").join("");
    const list = products.filter(p => cat === "All products" || p.category === cat);
    $("#grid").innerHTML = list.map(productCard).join("");
    $$("#chips button").forEach(b => b.onclick = () => { cat = b.dataset.c; draw(); });
    bindSaveButtons($("#grid"), (id, on) => { products.find(p => p.id === +id).saved = on; });
  }
  draw();
}

async function pageProduct(root, id) {
  let p;
  try { p = await API.get("/products/" + id); }
  catch (e) { root.innerHTML = '<div class="page-narrow center"><h1>Product not found</h1><a class="btn btn-primary mt-3" href="#/essentials">Back to shop</a></div>'; return; }
  let qty = 1;
  root.innerHTML = '<div class="container page"><a href="#/essentials" class="link">← All products</a><div class="detail-grid mt-2"><div class="card" style="overflow:hidden">' +
    '<div class="product-img">' + img(p.image_url, p.name) + "</div></div><div><span class=\"chip\">" + esc(p.category) + "</span><h1 class=\"mt-1\">" + esc(p.name) + "</h1>" +
    '<p class="mt-2">' + esc(p.description) + '</p><p class="mt-2"><span class="price" style="font-size:1.8rem">' + money(p.price) + "</span></p>" +
    '<p class="' + (p.in_stock ? "in" : "out") + '">' + (p.in_stock ? "In stock" : "Out of stock") + "</p>" +
    '<div class="row mt-3"><div class="qty"><button id="minus" aria-label="Decrease">−</button><span id="q">1</span><button id="plus" aria-label="Increase">+</button></div>' +
    '<button class="btn btn-primary" id="add"' + (p.in_stock ? "" : " disabled") + ">" + icon("cart", 16) + ' Add to cart</button>' +
    '<button class="btn btn-terra-outline" id="buy"' + (p.in_stock ? "" : " disabled") + ">Buy now</button></div>" +
    '<p class="hint mt-2">Free delivery on orders of ₹499 or more, otherwise ₹49.</p></div></div></div>';
  const setQ = (n) => { qty = Math.max(1, Math.min(10, n)); $("#q").textContent = qty; };
  $("#minus").onclick = () => setQ(qty - 1);
  $("#plus").onclick = () => setQ(qty + 1);
  const addToCart = async () => {
    if (!State.user) { toast("Please sign in to shop"); go("/login"); return false; }
    try { await API.post("/cart", { product_id: p.id, quantity: qty }); return true; }
    catch (e) { toast(e.message, "error"); return false; }
  };
  $("#add").onclick = async () => { if (await addToCart()) toast(qty + " × " + p.name + " added to cart"); };
  $("#buy").onclick = async () => { if (await addToCart()) go("/checkout"); };
}
