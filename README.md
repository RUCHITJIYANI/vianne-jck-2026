# Vianne Jewels — JCK 2026 Price Lookup

Interactive show app: search 452 items, scan QR codes, view pricing and stones.

## Live site

After GitHub Pages is enabled:

**https://ruchitjiyani.github.io/vianne-jck-2026/**

- Visitors request access with a **6-line code** (you approve on `admin.html`)
- See **FIREBASE-SETUP.md** for one-time Firebase setup

## Deploy (one command)

```bash
cd /Users/rj/Downloads/vianne-jck-2026
./push.sh
```

Then: [GitHub Pages settings](https://github.com/RUCHITJIYANI/vianne-jck-2026/settings/pages) → **main** / **(root)** → Save.

If push fails with HTTP 400, run:

```bash
git config http.postBuffer 524288000
git push -u origin main
```

## Test locally

```bash
python3 -m http.server 8080
```

Open http://localhost:8080/index.html

## Files

| File | Purpose |
|------|---------|
| `index.html` | Access request (6-line code) |
| `admin.html` | You approve/deny requests |
| `firebase-config.js` | Firebase + admin password |
| `lookup.html` | Main app UI |
| `data.js` | 452 items from price list |
| `images.js` | Product photos |
| `app.js` | Logic + QR scanner |
| `assets/favicon.png` | App icon |

## Regenerate data from Excel

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install openpyxl
python scripts/build-data.py
```
