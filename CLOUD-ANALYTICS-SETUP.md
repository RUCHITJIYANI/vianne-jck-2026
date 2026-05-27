# Cloud Analytics Setup (All Devices)

This enables one shared dataset across all phones/laptops.

## 1) Create Firebase Realtime Database

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Create project (or use existing).
3. Add a **Web app**.
4. Enable **Realtime Database** (start in test mode first).
5. Copy web config values.

## 2) Configure this project

Edit `cloud-config.js`:

- Set `enabled: true`
- Paste all `firebaseConfig` values.

## 3) Realtime Database rules

Use these minimum rules:

```json
{
  "rules": {
    "vianne-jck-2026-prod": {
      ".read": true,
      ".write": true
    }
  }
}
```

You can harden this later with auth keys, but this works quickly for shared sales-floor devices.

## 4) Deploy

```bash
cd /Users/rj/Downloads/vianne-jck-2026
git add cloud-config.js CLOUD-ANALYTICS-SETUP.md app.js lookup.html
git commit -m "Enable all-device cloud analytics and daily export"
git push
```

## What you get

- Shared lookup history from all devices
- Shared top searched products analytics
- Shared order status tracking (`Need to Order`, `Delivered`)
- Daily Excel download across all devices in one file
