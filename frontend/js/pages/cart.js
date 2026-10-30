function summaryHtml(c) {
  return '<div class="sum-row"><span>Subtotal</span><span>' + money(c.subtotal) + '</span></div><div class="sum-row"><span>Delivery</span><span>' +
    (c.delivery_fee ? money(c.delivery_fee) : "Free") + '</span></div><div class="sum-row total"><span>Total</span><span>' + money(c.total) + "</span></div>" +
    (c.delivery_fee ? '<p class="hint">Add ' + money(c.free_delivery_above - c.subtotal) + " more for free delivery.</p>" : "");
}

async function pageCart(root) {
  if (!State.user) { root.innerHTML = authNeeded("Sign in to see your cart."); return; }
  async function draw() {
    const c = await API.get("/cart");
    if (!c.items.length) {
      root.innerHTML = '<div class="container page">' + pageHead("Your cart") + emptyState("Your cart is empty", "Add something from Pet Essentials.", '<a class="btn btn-primary mt-2" href="#/essentials">Browse essentials</a>') + "</div>";
      return;
    }
    root.innerHTML = '<div class="container page">' + pageHead("Your cart") + '<div class="cart-layout"><div class="card pad">' +
      c.items.map(i => '<div class="cart-row" data-id="' + i.product_id + '">' + img(i.image_url, i.name) + "<div><h3>" + esc(i.name) + '</h3><p class="muted small">' + money(i.price) + " each" +
        (i.in_stock ? "" : ' · <span class="out">Out of stock</span>') + '</p><button class="link small" data-rm>Remove</button></div>' +
        '<div class="qty"><button data-d="-1" aria-label="Decrease">−</button><span>' + i.quantity + '</span><button data-d="1" aria-label="Increase">+</button></div>' +
        '<strong class="strong">' + money(i.line_total) + "</strong></div>").join("") +
      '</div><div class="card pad"><h3>Order summary</h3><div class="mt-2">' + summaryHtml(c) + '</div><a class="btn btn-primary btn-block mt-2" href="#/checkout">Proceed to checkout</a></div></div></div>';
    $$(".cart-row", root).forEach(row => {
      const id = row.dataset.id, item = c.items.find(i => i.product_id === +id);
      $$("[data-d]", row).forEach(b => b.onclick = async () => {
        try { await API.put("/cart/" + id, { quantity: Math.max(0, Math.min(10, item.quantity + (+b.dataset.d))) }); draw(); } catch (e) { toast(e.message, "error"); }
      });
      $("[data-rm]", row).onclick = async () => { await API.del("/cart/" + id); draw(); };
    });
  }
  await draw();
}

async function pageCheckout(root) {
  if (!State.user) { root.innerHTML = authNeeded("Sign in to check out."); return; }
  const c = await API.get("/cart");
  if (!c.items.length) { go("/cart"); return; }
  let method = "upi";
  const inp = (name, label, extra) => '<div><label class="label">' + label + '</label><input class="input" name="' + name + '" ' + (extra || "") + "></div>";
  const payOpt = (v, title, sub) => '<label class="pay-opt" data-m="' + v + '"><input type="radio" name="payment_method" value="' + v + '"><span><b class="strong">' + title + '</b><br><span class="small muted">' + sub + "</span></span></label>";
  root.innerHTML = '<div class="container page">' + pageHead("Checkout", "Card numbers are never stored.") +
    '<form id="co" class="cart-layout"><div class="stack"><div class="card pad-lg stack"><h3>Delivery details</h3><div class="form-grid">' +
    inp("full_name", "Full name", "required") + inp("phone", "Phone", 'required inputmode="tel" placeholder="10-digit number"') +
    "</div>" + inp("address", "Address", "required") + '<div class="form-grid">' + inp("city", "City", "required") + inp("pincode", "Pincode", 'required inputmode="numeric" maxlength="6"') + "</div></div>" +
    '<div class="card pad-lg stack"><h3>Payment method</h3>' + payOpt("upi", "UPI (PhonePe / Google Pay / Paytm)", "Pay instantly with your UPI app") + payOpt("card", "Credit / debit card", "Visa, Mastercard, RuPay") +
    payOpt("cod", "Cash on delivery", "Pay when the order arrives") + '<div id="pay-fields"></div></div></div>' +
    '<div class="card pad"><h3>Order summary</h3><div class="mt-2">' + c.items.map(i => '<div class="sum-row"><span>' + esc(i.name) + " × " + i.quantity + "</span><span>" + money(i.line_total) + "</span></div>").join("") +
    "</div><div class=\"mt-1\">" + summaryHtml(c) + '</div><button class="btn btn-primary btn-block mt-2" id="place">Place order · ' + money(c.total) + "</button></div></form></div>";
  const form = $("#co");
  function setMethod(m) {
    method = m;
    $$(".pay-opt", root).forEach(o => { o.classList.toggle("on", o.dataset.m === m); $("input", o).checked = o.dataset.m === m; });
    $("#pay-fields").innerHTML = m === "upi" ? upiFields()
      : m === "card" ? inp("card_number", "Card number", 'inputmode="numeric" placeholder="1234 5678 9012 3456" required') +
        '<div class="form-grid mt-1">' + inp("expiry", "Expiry (MM/YY)", 'placeholder="08/29"') + inp("cvv", "CVV", 'type="password" maxlength="4"') + "</div>"
      : m === "razorpay" ? '<p class="small muted">A secure Razorpay window opens when you place the order. Test mode: no real money is taken.</p>'
      : '<p class="small muted">You will pay the delivery person in cash.</p>';
    if (m === "upi") wireUpi();
  }
  $$(".pay-opt", root).forEach(o => o.addEventListener("click", () => setMethod(o.dataset.m)));
  setMethod("razorpay");
  let upiApp = "PhonePe";
  const UPI_APPS = ["PhonePe", "Google Pay", "Paytm", "BHIM"];
  function upiFields() {
    return '<label class="label">Choose your UPI app</label><div class="row" style="gap:8px;flex-wrap:wrap">' +
      UPI_APPS.map(a => '<button type="button" class="btn btn-outline" data-app="' + a + '" style="padding:6px 14px">' + a + "</button>").join("") + "</div>" +
      '<div class="mt-1">' + inp("upi_id", "UPI ID", 'placeholder="name@bank" required') + '</div>';
  }
  function wireUpi() {
    const paint = () => $$("[data-app]", root).forEach(b => { const on = b.dataset.app === upiApp; b.style.background = on ? "#1B4D3E" : ""; b.style.color = on ? "#fff" : ""; });
    $$("[data-app]", root).forEach(b => b.onclick = () => { upiApp = b.dataset.app; paint(); });
    paint();
  }
  function mockUpi(app, upiId, total) {
    return new Promise((resolve, reject) => {
      const ov = document.createElement("div");
      ov.style.cssText = "position:fixed;inset:0;background:rgba(15,40,32,.65);display:flex;align-items:center;justify-content:center;z-index:9999;padding:16px";
      const box = document.createElement("div");
      box.style.cssText = "background:#fff;border-radius:20px;max-width:360px;width:100%;padding:24px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.35)";
      ov.appendChild(box); document.body.appendChild(ov);
      const done = (fn, v) => { ov.remove(); fn(v); };
      box.innerHTML = '<p class="small muted">' + esc(app) + ' · UPI payment</p><h2 style="margin:6px 0">' + money(total) + '</h2>' +
        '<p class="small muted">Paying PawBridge Store<br>from ' + esc(upiId) + '</p>' +
        '<input id="upi-pin" class="input mt-2" type="password" inputmode="numeric" maxlength="6" placeholder="Enter any 4-6 digit PIN" style="text-align:center">' +
        '<button type="button" class="btn btn-primary btn-block mt-2" id="upi-ok">Approve payment</button>' +
        '<button type="button" class="link small mt-1" id="upi-no">Cancel</button>';
      $("#upi-no", box).onclick = () => done(reject, new Error("Payment cancelled"));
      $("#upi-ok", box).onclick = () => {
        if (!/^\d{4,6}$/.test($("#upi-pin", box).value)) { toast("Enter a 4 to 6 digit PIN (any numbers)", "error"); return; }
        box.innerHTML = '<div style="font-size:34px">⏳</div><h3 class="mt-1">Processing payment...</h3><p class="small muted">Please do not close this window</p>';
        setTimeout(() => {
          box.innerHTML = '<div style="font-size:44px;color:#1B4D3E">✔</div><h3 class="mt-1">Payment successful</h3><p class="small muted">' + money(total) + " paid via " + esc(app) + "</p>";
          setTimeout(() => done(resolve), 1300);
        }, 1500);
      };
    });
  }
  function showDone(order) {
    root.innerHTML = '<div class="page-narrow"><div class="card pad-lg center"><div class="strong">' + icon("paw", 40) + '</div><h1 class="mt-2">Order #' + order.id + ' placed</h1>' +
      '<p class="muted mt-1">Total ' + money(order.total) + " · " + esc(order.payment_status) + '. The store has been notified and will confirm it soon.</p>' +
      '<div class="row mt-3" style="justify-content:center"><a class="btn btn-primary" href="#/dashboard/orders">View my orders</a><a class="btn btn-outline" href="#/essentials">Keep shopping</a></div></div></div>';
    refreshUnread();
  }
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const v = Object.fromEntries(new FormData(form));
    const btn = $("#place"), label = "Place order · " + money(c.total);
    btn.disabled = true; btn.textContent = method === "cod" ? "Placing order..." : "Processing payment...";
    const body = { full_name: v.full_name, phone: v.phone, address: v.address, city: v.city, pincode: v.pincode,
      payment_method: method, upi_id: v.upi_id || "", card_number: v.card_number || "" };
    const reset = () => { btn.disabled = false; btn.textContent = label; };
    try {
      if (method === "razorpay") {
        if (typeof Razorpay === "undefined") throw new Error("Could not load Razorpay. Check your internet connection.");
        const o = await API.post("/payments/razorpay/order");
        const rzp = new Razorpay({
          key: o.key_id, amount: o.amount, currency: "INR", order_id: o.razorpay_order_id,
          name: "PawBridge", description: "Pet essentials order (test mode)",
          prefill: { name: v.full_name, contact: v.phone }, theme: { color: "#1B4D3E" },
          modal: { ondismiss: reset },
          handler: async (r) => {
            try {
              showDone(await API.post("/orders", Object.assign(body, { rzp_order_id: r.razorpay_order_id, rzp_payment_id: r.razorpay_payment_id, rzp_signature: r.razorpay_signature })));
            } catch (err) { toast(err.message, "error"); reset(); }
          },
        });
        rzp.on("payment.failed", (r) => { toast((r.error && r.error.description) || "Payment failed", "error"); reset(); });
        rzp.open();
        return;
      }
      if (method === "upi") await mockUpi(upiApp, v.upi_id, c.total);
      await new Promise(r => setTimeout(r, method === "cod" || method === "upi" ? 300 : 1200));
      showDone(await API.post("/orders", body));
    } catch (err) { toast(err.message, "error"); reset(); }
  });
}
