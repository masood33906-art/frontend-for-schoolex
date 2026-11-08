/* SchoolEx landing page — sign-in gate + ZIP download
   ---------------------------------------------------------------
   CONFIG: where the SchoolEx ZIP lives.
   Option A: put the file at  downloads/SchoolEx.zip  in this repo/site.
   Option B: paste a direct link (e.g. a GitHub Release asset URL).
---------------------------------------------------------------- */
const SCHOOLEX_DOWNLOAD_URL = "downloads/SchoolEx.zip";
const SCHOOLEX_FILE_NAME = "SchoolEx.zip";

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
  $$("[data-download-label]").forEach(el => el.textContent = user ? "Download SchoolEx (.zip)" : "Sign in to download");
  $$("[data-download]").forEach(b => b.classList.toggle("unlocked", !!user));
  $$("[data-download-hint]").forEach(el => el.textContent = user
    ? `Signed in as ${user.email} — your download is unlocked.`
    : el.dataset.defaultHint || el.textContent);
}
$$("[data-download-hint]").forEach(el => el.dataset.defaultHint = el.textContent);

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
  toast(`Welcome, ${name.split(" ")[0]} — your download is unlocked.`, "ok");
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
  toast(`Welcome back, ${user.name.split(" ")[0]} — your download is unlocked.`, "ok");
});

/* ---------- sign out ---------- */
$("#signOutBtn").addEventListener("click", () => {
  setSession(null); renderAuthState();
  toast("Signed out. Sign in again any time to download.");
});

/* ---------- download (gated) ---------- */
async function startDownload() {
  if (!currentUser()) { openAuth("signin"); toast("Please sign in first — the download unlocks right after."); return; }
  // If the ZIP is hosted on this same site, check it actually exists
  // so the user gets a clear message instead of a 404 page.
  if (!/^https?:\/\//i.test(SCHOOLEX_DOWNLOAD_URL)) {
    try {
      const res = await fetch(SCHOOLEX_DOWNLOAD_URL, { method: "HEAD" });
      if (!res.ok) throw new Error("missing");
    } catch {
      toast("The download file hasn't been published yet. Please check back soon — your account is ready.", "err");
      return;
    }
  }
  const a = document.createElement("a");
  a.href = SCHOOLEX_DOWNLOAD_URL;
  a.download = SCHOOLEX_FILE_NAME;
  document.body.appendChild(a); a.click(); a.remove();
  toast("Your SchoolEx download has started.", "ok");
}
$$("[data-download]").forEach(b => b.addEventListener("click", startDownload));

/* ---------- mobile nav ---------- */
const navToggle = $("#navToggle"), navLinks = $("#navLinks");
navToggle.addEventListener("click", () => {
  const open = navLinks.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", open);
});
navLinks.addEventListener("click", (e) => { if (e.target.tagName === "A") navLinks.classList.remove("open"); });

renderAuthState();
