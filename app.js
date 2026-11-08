/* SchoolEx landing page — sign-in gate + voucher payment + email delivery
   ---------------------------------------------------------------
   CONFIG: SchoolEx is sold for a one-time Rs 1,500, paid by a
   JazzCash / Easypaisa voucher emailed to the owner. The owner
   verifies the voucher and emails the app ZIP within 24 hours.
   The email is shown MASKED on the page; the real address lives
   only here and in the mailto link it builds.
---------------------------------------------------------------- */
const PAYMENT_EMAIL = "masood33906@gmail.com";
const PRICE_PKR = 1500;
const ORDERS_KEY = "schoolex_site_orders_v1";

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
  setTimeout(() => $("#voucherCode")?.focus({ preventScroll: true }), 500);
}
$$("[data-download]").forEach(b => b.addEventListener("click", goToPayment));

/* ---------- orders (voucher submissions, this browser only) ---------- */
const loadOrders = () => { try { return JSON.parse(localStorage.getItem(ORDERS_KEY)) || []; } catch { return []; } };
const saveOrders = (o) => localStorage.setItem(ORDERS_KEY, JSON.stringify(o));
const myOrder = () => { const u = currentUser(); return u ? loadOrders().find(o => o.email === u.email) || null : null; };

const fmtWhen = (ts) => new Intl.DateTimeFormat("en-GB", {
  weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Karachi"
}).format(new Date(ts));

let selectedMethod = "JazzCash";
$$(".method-pill").forEach(pill => pill.addEventListener("click", () => {
  selectedMethod = pill.dataset.method;
  $$(".method-pill").forEach(p => {
    const on = p === pill;
    p.classList.toggle("active", on);
    p.setAttribute("aria-checked", on);
  });
  updateMailto();
}));

function updateMailto() {
  const user = currentUser();
  const code = $("#voucherCode").value.trim();
  const subject = encodeURIComponent(`SchoolEx Payment — Rs ${PRICE_PKR} ${selectedMethod} Voucher`);
  const body = encodeURIComponent(
`Assalam-o-Alaikum,

I have sent a ${selectedMethod} voucher of Rs ${PRICE_PKR} for SchoolEx.

Name: ${user ? user.name : ""}
School: ${user && user.school ? user.school : ""}
My email (send the app here): ${user ? user.email : ""}
Voucher code / transaction ID: ${code || "(paste your voucher code here)"}

Please verify and email me the SchoolEx app within 24 hours. Thank you!`
  );
  $("#sendVoucherBtn").href = `mailto:${PAYMENT_EMAIL}?subject=${subject}&body=${body}`;
}
$("#voucherCode").addEventListener("input", updateMailto);
$("#sendVoucherBtn").addEventListener("click", (e) => {
  if (!currentUser()) { e.preventDefault(); openAuth("signin"); toast("Please sign in first, then send your voucher."); }
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
      `Order reference: ${order.ref} · ${order.method} voucher ${order.voucher} · Submitted ${fmtWhen(order.at)} · Status: awaiting verification`;
  }
  updateMailto();
}

$("#confirmSentBtn").addEventListener("click", () => {
  const user = currentUser();
  if (!user) { openAuth("signin"); return; }
  const code = $("#voucherCode").value.trim();
  if (code.length < 4) {
    const err = $("#payError");
    err.textContent = "Please enter your voucher code / transaction ID first — we need it to verify your payment.";
    err.hidden = false;
    $("#voucherCode").focus();
    return;
  }
  $("#payError").hidden = true;
  const at = Date.now();
  const order = {
    ref: "SX-" + at.toString(36).toUpperCase(),
    email: user.email, name: user.name, school: user.school || "",
    method: selectedMethod, voucher: code, amount: PRICE_PKR,
    at, deliverBy: at + 24 * 60 * 60 * 1000, status: "awaiting verification"
  };
  const orders = loadOrders().filter(o => o.email !== user.email);
  orders.push(order);
  saveOrders(orders);
  renderOrderState();
  $("#thanksPanel").scrollIntoView({ behavior: "smooth", block: "center" });
  toast("Congratulations! Your voucher details are submitted — the app will be emailed within 24 hours.", "ok");
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
