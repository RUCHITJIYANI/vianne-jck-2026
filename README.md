# Vianne Jewels — JCK 2026 Price Lookup

Interactive catalog with:

- Password gate (`VianneNY`)
- Search + QR scanning
- Product order tracking (`Need to Order`, `Delivered`)
- Lookup history + top-search analytics
- Daily downloadable Excel report

## Live Site

[https://ruchitjiyani.github.io/vianne-jck-2026/](https://ruchitjiyani.github.io/vianne-jck-2026/)

## Local vs All-Devices Data

- Default: data is stored on each device in browser local storage.
- Optional cloud mode: enable Firebase to combine all devices into one shared analytics/report feed.
- Setup guide: `CLOUD-ANALYTICS-SETUP.md`

## Deploy

```bash
cd /Users/rj/Downloads/vianne-jck-2026
git add .
git commit -m "Update app"
git push
```

## Test Locally

```bash
python3 -m http.server 8080
```

Open [http://localhost:8080/index.html](http://localhost:8080/index.html)

## Main Files

- `index.html` — password entry page
- `lookup.html` — main app page
- `app.js` — app logic, scanner, history, analytics, export
- `cloud-config.js` — cloud sync config
- `CLOUD-ANALYTICS-SETUP.md` — Firebase setup instructions
- `data.js` — product data
- `images.js` — product images
