# SchoolEx — Landing Page

The public landing page for **SchoolEx**, a complete offline school management system for Windows.

Minimal, professional design with a blurred glass (glassmorphism) background — fully responsive, no build step, no dependencies. Just open it or host the static files anywhere (GitHub Pages, Netlify, any web host).

## What's on the page

- **Hero** — what SchoolEx is, with a live-looking app preview card
- **Features** — students & families, fees & ledger, staff & payroll, attendance, exams, offline privacy
- **How it works** — sign in → download ZIP → install & start empty
- **Reviews box** — abstract blurred design with a 5.0 summary and 5-star reviews from local people (Peshawar / KPK roles). ⚠️ These are **sample placeholder reviews** — replace them with real reviews from your schools before promoting the page publicly.
- **Download** — gated ZIP download (see below)

## Sign-in gate

Visitors must create an account / sign in before the **Download SchoolEx (.zip)** button unlocks.

> This is a **front-end demo sign-in**: accounts are stored only in the visitor's own browser (`localStorage`, passwords SHA-256 hashed with a per-user salt). It is fine for gating a download on a static page, but it is **not** a real registration system. Connect a backend (e.g. Firebase Auth, Supabase, or your own API) before collecting real user accounts.

## Setting the download file

Edit the top of `app.js`:

```js
const SCHOOLEX_DOWNLOAD_URL = "downloads/SchoolEx.zip";
```

- **Option A:** place the real file at `downloads/SchoolEx.zip` in this repo/site.
- **Option B:** paste a direct link instead, e.g. a GitHub Release asset URL.

If the file is missing, signed-in users see a clear "not published yet" message instead of a broken 404 download.

## Run locally

```bash
# any static server, e.g.
python3 -m http.server 8000
# then open http://localhost:8000
```

## Files

| File | Purpose |
|---|---|
| `index.html` | Page structure & content |
| `styles.css` | All styling (blur background, glass cards, responsive breakpoints) |
| `app.js` | Sign-in / sign-up, session, gated download |
| `downloads/` | Put `SchoolEx.zip` here (see `downloads/README.txt`) |
