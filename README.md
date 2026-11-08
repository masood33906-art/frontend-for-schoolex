# SchoolEx — Landing Page

The public landing page for **SchoolEx**, a complete offline school management system for Windows.

Minimal, professional design with a blurred glass (glassmorphism) background — fully responsive, no build step, no dependencies. Just open it or host the static files anywhere (GitHub Pages, Netlify, any web host).

## What's on the page

- **Hero** — what SchoolEx is, with a live-looking app preview card
- **Features** — students & families, fees & ledger, staff & payroll, attendance, exams, offline privacy
- **Screenshots** — a professional gallery (`screenshots/*.svg`: Overview, Students, Fees & Ledger, Payroll) with click-to-enlarge lightbox. These are faithful preview recreations with sample data, drawn from the real app's screens — replace them with real captures any time by swapping the files (keep the same names/format, or update the `<img>` paths in `index.html`).
- **How it works** — sign in → send Rs 1,500 voucher → receive the app by email within 24 hours
- **Reviews box** — abstract blurred design with a 5.0 summary and 5-star reviews from local people (Peshawar / KPK roles). ⚠️ These are **sample placeholder reviews** — replace them with real reviews from your schools before promoting the page publicly.
- **Get SchoolEx** — price, sign-in gate and the voucher payment step (below)

## Sign-in gate

Visitors must create an account / sign in before the payment step unlocks.

> This is a **front-end demo sign-in**: accounts are stored only in the visitor's own browser (`localStorage`, passwords SHA-256 hashed with a per-user salt). It is fine for gating a static page, but it is **not** a real registration system. Connect a backend (e.g. Firebase Auth, Supabase, or your own API) before collecting real user accounts.

## Payment step (Rs 1,500 voucher)

After sign-in, the **Get SchoolEx** section shows the payment step:

1. The visitor picks **JazzCash** or **Easypaisa** and enters their voucher code / transaction ID.
2. **Submit my voucher** — the order is saved in the visitor's browser (`localStorage`) **and automatically emailed to the owner's Gmail** via the free FormSubmit relay (`FORMSUBMIT_ENDPOINT` in `app.js`), with the buyer as reply-to. A congratulations / thank-you panel appears: the app will be verified and **emailed to them within 24 hours**, with the exact deadline date/time shown.
3. **Masked-email button (backup)** — the owner's email is shown **masked** (`mas•••06@gmail.com`); the button itself is a `mailto:` to the real address (set by `PAYMENT_EMAIL` at the top of `app.js`) with subject and body pre-filled, for visitors who prefer to email a receipt screenshot themselves.

> ⚠️ **One-time activation:** the very first submission makes FormSubmit send an **activation email** to the owner's Gmail. The owner must click **Activate** in that email once — after that, every submission lands directly in the inbox. Until activation, use the mailto backup button.

Delivery of the app itself is manual by design: the owner verifies the voucher in Gmail and replies with the SchoolEx ZIP. To change the price or email, edit `PRICE_PKR` / `PAYMENT_EMAIL` at the top of `app.js` (and the visible price in `index.html`).

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
| `app.js` | Sign-in / sign-up, session, voucher payment step, thank-you state, lightbox |
| `screenshots/` | App preview screens used by the gallery (SVG) |
| `downloads/` | Placeholder — delivery is by email (see `downloads/README.txt`) |
