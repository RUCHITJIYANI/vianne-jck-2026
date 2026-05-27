# Vianne Jewels — JCK 2026 Price Lookup

Interactive jewelry lookup for the JCK 2026 show: search by unique code, scan QR codes, view pricing and stone details.

## Quick start

1. Open **`index.html`** in a browser (or serve this folder with any static file server).
2. Default passcode: **`vianne2026`** (change in `index.html` → `SECURE_KEY`).
3. After login you are taken to **`lookup.html`** with all 452 items loaded.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Password gate |
| `lookup.html` | Main UI (search, scanner, item cards) |
| `data.js` | Price list data (452 items from Excel) |
| `images.js` | Product photos (base64, keyed by unique code) |
| `app.js` | Application logic |
| `JCK 2026 Price List.xlsx` | Source spreadsheet |

## Regenerate data from Excel

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install openpyxl
python scripts/build-data.py
```

This overwrites `data.js` only. Images in `images.js` are unchanged unless you rebuild them separately.

## Local server (recommended for camera / QR)

```bash
cd /Users/rj/Downloads/vianne-jck-2026
python3 -m http.server 8080
```

Then visit `http://localhost:8080/index.html`.

## Notes

- QR scanning uses [jsQR](https://github.com/cozmo/jsQR) and needs HTTPS or `localhost` for camera access.
- Session auth is stored in `sessionStorage` for the browser tab only.

## Deploy to GitHub Pages (`ruchitjiyani12.github.io`)

A **404** at `https://ruchitjiyani12.github.io` means the user-site repo is missing, empty, or Pages is not enabled.

### One-time setup

1. On GitHub, create a **public** repository named exactly:
   ```
   ruchitjiyani12.github.io
   ```
   (Must match your username. Do not use a different name for the root URL.)

2. In the project folder, push the site files:

   ```bash
   cd /Users/rj/Downloads/vianne-jck-2026
   git add index.html lookup.html data.js images.js app.js README.md scripts/ .gitignore
   git commit -m "Publish JCK 2026 jewelry lookup for GitHub Pages"
   git remote add origin https://github.com/ruchitjiyani12/ruchitjiyani12.github.io.git
   git push -u origin main
   ```

3. On GitHub: **Settings → Pages → Build and deployment**
   - Source: **Deploy from a branch**
   - Branch: **main** / **/ (root)**
   - Save

4. Wait 1–3 minutes, then open:
   ```
   https://ruchitjiyani12.github.io/
   ```

### If you use a different repo name

Example repo `vianne-jck-2026` is served at:

```
https://ruchitjiyani12.github.io/vianne-jck-2026/
```

not at the root domain. For the root URL, the repo name must be `ruchitjiyani12.github.io`.

### Large files

The Excel file is excluded from git (data is already in `data.js`). Keep the `.xlsx` locally for updates via `scripts/build-data.py`.
