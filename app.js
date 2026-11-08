/* SchoolEx landing page — sign-in gate + voucher payment + email delivery
   ---------------------------------------------------------------
   CONFIG: SchoolEx is sold for a one-time Rs 1,500, paid by a
   JazzCash payment (number shown openly; receipt picture uploaded) emailed to the owner. The owner
   verifies the voucher and emails the app ZIP within 24 hours.
   The email is shown MASKED on the page; the real address lives
   only here and in the mailto link it builds.
---------------------------------------------------------------- */
const PAYMENT_EMAIL = "masood33906@gmail.com";
const PRICE_PKR = 1500;
const ORDERS_KEY = "schoolex_site_orders_v1";
/* Free form-to-email relay: submissions POST here and are emailed
   to PAYMENT_EMAIL. One-time setup: the FIRST submission triggers
   an activation email to that Gmail — the owner clicks "Activate"
   in it once, then every submission lands in the inbox. */
const FORMSUBMIT_ENDPOINT = "https://formsubmit.co/ajax/" + PAYMENT_EMAIL;

/* NOTE: This is a front-end demo sign-in for the landing page.
   Accounts are kept only in this browser's localStorage, with
   passwords hashed (SHA-256 + per-user salt). For real public
   registrations, connect a proper backend — never ship a
   localStorage-only auth to production users as "secure". */

const USERS_KEY = "schoolex_site_users_v1";
const SESSION_KEY = "schoolex_site_session_v1";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

/* ---------- storage helpers ---------- */
const loadUsers = () => { try { return JSON.parse(localStorage.getItem(USERS_KEY)) || []; } catch { return []; } };
const saveUsers = (u) => localStorage.setItem(USERS_KEY, JSON.stringify(u));
const getSession = () => { try { return JSON.parse(localStorage.getItem(SESSION_KEY)); } catch { return null; } };
const setSession = (s) => s ? localStorage.setItem(SESSION_KEY, JSON.stringify(s)) : localStorage.removeItem(SESSION_KEY);
const currentUser = () => { const s = getSession(); return s ? loadUsers().find(u => u.email === s.email) || null : null; };

async function hashPassword(password, salt) {
  const data = new TextEncoder().encode(salt + "::" + password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2, "0")).join("");
}
const makeSalt = () => [...crypto.getRandomValues(new Uint8Array(12))].map(b => b.toString(16).padStart(2, "0")).join("");
const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);

/* ---------- toast ---------- */
let toastTimer;
function toast(msg, kind = "") {
  const t = $("#toast");
  t.textContent = msg; t.className = "toast " + kind; t.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.hidden = true; }, 4200);
}

/* ---------- auth UI state ---------- */
function renderAuthState() {
  const user = currentUser();
  $("#userChip").hidden = !user;
  $("#navSignInBtn").hidden = !!user;
  if (user) {
    $("#userName").textContent = user.name;
    $("#userAvatar").textContent = user.name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
  }
  $$("[data-download-label]").forEach(el => el.textContent = user ? "Continue to payment — Rs 1,500" : "Sign in to get SchoolEx");
  $$("[data-download]").forEach(b => b.classList.toggle("unlocked", !!user));
  renderOrderState();
}

/* ---------- modal ---------- */
const modal = $("#authModal");
let lastFocus = null;
function openAuth(mode = "signin") {
  lastFocus = document.activeElement;
  switchTab(mode);
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  setTimeout(() => $(mode === "signup" ? "#suName" : "#siEmail")?.focus(), 40);
}
function closeAuth() {
  modal.hidden = true;
  document.body.style.overflow = "";
  lastFocus?.focus?.();
}
function switchTab(mode) {
  const si = mode === "signin";
  $("#tabSignIn").classList.toggle("active", si);
  $("#tabSignUp").classList.toggle("active", !si);
  $("#tabSignIn").setAttribute("aria-selected", si);
  $("#tabSignUp").setAttribute("aria-selected", !si);
  $("#signInForm").hidden = !si;
  $("#signUpForm").hidden = si;
  $("#authTitle").textContent = si ? "Welcome back" : "Create your account";
}
$("#tabSignIn").addEventListener("click", () => switchTab("signin"));
$("#tabSignUp").addEventListener("click", () => switchTab("signup"));
$("#authClose").addEventListener("click", closeAuth);
modal.addEventListener("click", (e) => { if (e.target === modal) closeAuth(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) closeAuth(); });
$("#navSignInBtn").addEventListener("click", () => openAuth("signin"));
$$("[data-toggle-pw]").forEach(btn => btn.addEventListener("click", () => {
  const input = document.getElementById(btn.dataset.togglePw);
  const show = input.type === "password";
  input.type = show ? "text" : "password";
  btn.textContent = show ? "Hide" : "Show";
}));

function showError(id, msg) { const el = $(id); el.textContent = msg; el.hidden = !msg; }

/* ---------- sign up ---------- */
$("#signUpForm").addEventListener("submit", async (e) => {
  e.preventDefault(); showError("#suError", "");
  const name = $("#suName").value.trim();
  const school = $("#suSchool").value.trim();
  const email = $("#suEmail").value.trim().toLowerCase();
  const password = $("#suPassword").value;
  if (name.length < 2) return showError("#suError", "Please enter your full name.");
  if (!validEmail(email)) return showError("#suError", "Please enter a valid email address.");
  if (password.length < 8) return showError("#suError", "Password must be at least 8 characters.");
  const users = loadUsers();
  if (users.some(u => u.email === email)) {
    switchTab("signin");
    $("#siEmail").value = email;
    return showError("#siError", "An account with this email already exists — please sign in.");
  }
  const salt = makeSalt();
  users.push({ name, school, email, salt, hash: await hashPassword(password, salt), createdAt: new Date().toISOString() });
  saveUsers(users);
  setSession({ email, at: Date.now() });
  closeAuth(); renderAuthState();
  toast(`Welcome, ${name.split(" ")[0]} — you're signed in. One payment step left below.`, "ok");
  document.getElementById("download")?.scrollIntoView({ behavior: "smooth" });
});

/* ---------- sign in ---------- */
$("#signInForm").addEventListener("submit", async (e) => {
  e.preventDefault(); showError("#siError", "");
  const email = $("#siEmail").value.trim().toLowerCase();
  const password = $("#siPassword").value;
  if (!validEmail(email)) return showError("#siError", "Please enter a valid email address.");
  const user = loadUsers().find(u => u.email === email);
  if (!user) {
    switchTab("signup");
    $("#suEmail").value = email;
    return showError("#suError", "No account found for this email — create one to continue.");
  }
  if ((await hashPassword(password, user.salt)) !== user.hash) return showError("#siError", "Incorrect password. Please try again.");
  setSession({ email, at: Date.now() });
  closeAuth(); renderAuthState();
  toast(`Welcome back, ${user.name.split(" ")[0]} — you're signed in. One payment step left below.`, "ok");
});

/* ---------- sign out ---------- */
$("#signOutBtn").addEventListener("click", () => {
  setSession(null); renderAuthState();
  toast("Signed out. Sign in again any time to continue.");
});

/* ---------- get SchoolEx (gated) → payment step ---------- */
function goToPayment() {
  if (!currentUser()) { openAuth("signin"); toast("Please sign in first — the payment step unlocks right after."); return; }
  document.getElementById("download")?.scrollIntoView({ behavior: "smooth" });
}
$$("[data-download]").forEach(b => b.addEventListener("click", goToPayment));

/* ---------- orders (voucher submissions, this browser only) ---------- */
const loadOrders = () => { try { return JSON.parse(localStorage.getItem(ORDERS_KEY)) || []; } catch { return []; } };
const saveOrders = (o) => localStorage.setItem(ORDERS_KEY, JSON.stringify(o));
const myOrder = () => { const u = currentUser(); return u ? loadOrders().find(o => o.email === u.email) || null : null; };

const fmtWhen = (ts) => new Intl.DateTimeFormat("en-GB", {
  weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Karachi"
}).format(new Date(ts));

/* JazzCash number buyers send Rs 1,500 to (shown openly on the page) */
const JAZZCASH_NUMBER = "03295626026";
const JAZZCASH_NUMBER_DISPLAY = "0329 5626026";
const JAZZCASH_TITLE = "Masood Ahmad";
const MAX_PROOF_BYTES = 8 * 1024 * 1024;

$("#copyNumberBtn").addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(JAZZCASH_NUMBER); toast("JazzCash number copied: " + JAZZCASH_NUMBER_DISPLAY, "ok"); }
  catch { toast("JazzCash number: " + JAZZCASH_NUMBER_DISPLAY + " (" + JAZZCASH_TITLE + ")"); }
});

/* receipt picture picker + preview */
let proofFile = null;
$("#proofFile").addEventListener("change", () => {
  const f = $("#proofFile").files[0] || null;
  const err = $("#payError");
  proofFile = null;
  $("#proofPreview").hidden = true;
  $("#proofName").textContent = "Choose the screenshot or photo of your payment receipt (image, up to 8 MB)";
  if (!f) return;
  if (!f.type.startsWith("image/")) { err.textContent = "Please choose an image file (a screenshot or photo of your receipt)."; err.hidden = false; return; }
  if (f.size > MAX_PROOF_BYTES) { err.textContent = "That picture is larger than 8 MB — please send a smaller screenshot of the receipt."; err.hidden = false; return; }
  err.hidden = true;
  proofFile = f;
  $("#proofName").textContent = "Selected: " + f.name;
  const prev = $("#proofPreview");
  prev.src = URL.createObjectURL(f);
  prev.hidden = false;
});

function updateMailto() {
  const user = currentUser();
  const subject = encodeURIComponent(`SchoolEx Payment — Rs ${PRICE_PKR} JazzCash from ${user ? user.name : ""}`);
  const body = encodeURIComponent(
`Assalam-o-Alaikum,

I have sent Rs ${PRICE_PKR} by JazzCash to ${JAZZCASH_NUMBER_DISPLAY} (${JAZZCASH_TITLE}) for SchoolEx.
My receipt picture is attached to this email.

Name: ${user ? user.name : ""}
School: ${user && user.school ? user.school : ""}
My email (send the app here): ${user ? user.email : ""}

Please verify and email me the SchoolEx app within 24 hours. Thank you!`
  );
  $("#sendVoucherBtn").href = `mailto:${PAYMENT_EMAIL}?subject=${subject}&body=${body}`;
}
$("#sendVoucherBtn").addEventListener("click", (e) => {
  if (!currentUser()) { e.preventDefault(); openAuth("signin"); toast("Please sign in first, then send your payment proof."); }
  else toast("Your email app is opening — remember to attach your receipt picture before sending.");
});

function renderOrderState() {
  const panel = $("#paymentPanel"), thanks = $("#thanksPanel");
  if (!panel || !thanks) return;
  const user = currentUser();
  const order = myOrder();
  panel.hidden = !user || !!order;
  thanks.hidden = !order;
  if (order) {
    $("#thanksEmail").textContent = order.email;
    $("#deliveryBy").textContent = fmtWhen(order.deliverBy);
    $("#orderSummary").textContent =
      `Order reference: ${order.ref} · JazzCash Rs ${PRICE_PKR} · ${order.proof ? "Receipt picture: " + order.proof : "Voucher: " + (order.voucher || "—")} · Submitted ${fmtWhen(order.at)} · Status: awaiting verification` +
      (order.emailed ? " · Proof received in our Gmail inbox ✓" : "");
  }
  updateMailto();
}

async function submitOrderWithProof(order, file) {
  try {
    const fd = new FormData();
    fd.append("_subject", `SchoolEx Order ${order.ref} — Rs ${PRICE_PKR} JazzCash from ${order.name}`);
    fd.append("_template", "table");
    fd.append("_replyto", order.email);
    fd.append("Order reference", order.ref);
    fd.append("Buyer name", order.name);
    fd.append("Buyer email (send the app here)", order.email);
    fd.append("School", order.school || "—");
    fd.append("Payment method", "JazzCash");
    fd.append("Paid to", `${JAZZCASH_NUMBER_DISPLAY} (${JAZZCASH_TITLE})`);
    fd.append("Amount", `Rs ${PRICE_PKR}`);
    fd.append("Submitted", fmtWhen(order.at));
    fd.append("Deliver app by", fmtWhen(order.deliverBy));
    if (file) fd.append("attachment", file, file.name);
    const res = await fetch(FORMSUBMIT_ENDPOINT, { method: "POST", headers: { "Accept": "application/json" }, body: fd });
    return res.ok;
  } catch { return false; }
}

$("#confirmSentBtn").addEventListener("click", async () => {
  const user = currentUser();
  if (!user) { openAuth("signin"); return; }
  if (!proofFile) {
    const err = $("#payError");
    err.textContent = "Please upload your voucher / receipt picture first — we need it to verify your payment.";
    err.hidden = false;
    $("#proofFile").focus();
    return;
  }
  $("#payError").hidden = true;
  const btn = $("#confirmSentBtn");
  btn.disabled = true;
  const originalLabel = btn.textContent;
  btn.textContent = "Sending proof to our inbox…";
  const at = Date.now();
  const order = {
    ref: "SX-" + at.toString(36).toUpperCase(),
    email: user.email, name: user.name, school: user.school || "",
    method: "JazzCash", proof: proofFile.name, amount: PRICE_PKR,
    at, deliverBy: at + 24 * 60 * 60 * 1000, status: "awaiting verification",
    emailed: false
  };
  order.emailed = await submitOrderWithProof(order, proofFile);
  const orders = loadOrders().filter(o => o.email !== user.email);
  orders.push(order);
  saveOrders(orders);
  btn.disabled = false;
  btn.textContent = originalLabel;
  renderOrderState();
  $("#thanksPanel").scrollIntoView({ behavior: "smooth", block: "center" });
  toast(order.emailed
    ? "Congratulations! Your payment proof is in our Gmail inbox — the app will be emailed within 24 hours."
    : "Your order is saved on this device, but sending to our inbox failed — please also email the picture via the masked-email button so we receive it.", "ok");
});

/* ---------- screenshots lightbox ---------- */
const lightbox = $("#lightbox");
$$("[data-lightbox]").forEach(btn => btn.addEventListener("click", () => {
  $("#lightboxImg").src = btn.dataset.lightbox;
  $("#lightboxCaption").innerHTML = btn.dataset.caption || "";
  lightbox.hidden = false;
  document.body.style.overflow = "hidden";
}));
function closeLightbox() { lightbox.hidden = true; document.body.style.overflow = ""; $("#lightboxImg").src = ""; }
$("#lightboxClose").addEventListener("click", closeLightbox);
lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !lightbox.hidden) closeLightbox(); });

/* ---------- mobile nav ---------- */
const navToggle = $("#navToggle"), navLinks = $("#navLinks");
navToggle.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", open);
});
navLinks.addEventListener("click", (e) => { if (e.target.tagName === "A") navLinks.classList.remove("open"); });

renderAuthState();
