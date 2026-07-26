# Akiba

Offline-first PWA for tracking daily income and expenses against a four-bucket savings plan — built for low-connectivity, mobile-first use.

**Live demo:** _add your GitHub Pages URL here after deploying_

## The plan it tracks

Given a daily income, Akiba estimates monthly income (`daily × work days/month`) and splits it into four goals:

| Bucket | Rule | Type |
|---|---|---|
| Mahitaji (Essentials) | 55% of monthly income | monthly budget |
| Uwekezaji (Invest) | 10% of monthly income | monthly budget |
| Dharura (Emergency fund) | 4× monthly income | cumulative goal |
| Uhuru (Freedom fund) | 200× monthly income | cumulative goal |

The "Uhuru" target assumes a 6% withdrawal rate. If you'd rather plan around the more conservative 4% rule, change the Uhuru multiplier from 200 to 300 in Mipangilio (Settings) — all four bucket percentages/multipliers are editable in the app itself, no code changes needed.

## Stack

Plain HTML/CSS/JS. No build step, no framework, no external dependencies at runtime. Data persists in `localStorage` on-device. `sw.js` caches the app shell so it keeps working offline once loaded once.

## Files

- `index.html` — the app
- `manifest.json` — PWA metadata (name, icon, theme color)
- `sw.js` — service worker, caches the app shell for offline use

## Deploy (GitHub Pages)

1. Push these three files to the repo root
2. Settings → Pages → Deploy from branch → `main` / root
3. Open the live URL in Chrome → menu → "Add to Home Screen"

## Local use

Just open `index.html` in a browser. Service worker registration requires HTTPS (or `localhost`), so offline caching only kicks in once deployed or served locally via `python3 -m http.server`.

## Data & privacy

All data stays on-device in `localStorage`. Nothing is sent anywhere. Clearing browser data or uninstalling the PWA will erase it — use "Pakua CSV" in Mipangilio (Settings) to back up your history before doing either.

## Roadmap

- [x] CSV export
- [x] Reset/clear-data button
- [x] Editable bucket percentages
