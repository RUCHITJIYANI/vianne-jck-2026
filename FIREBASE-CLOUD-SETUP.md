# Firebase Cloud Setup (Fresh Start)

This is **not Google Drive**. It is **Firebase Realtime Database** — a live cloud folder in the sky where every device reads/writes the same data:

- Lookup history (who searched what, when)
- Role permissions (manager/staff visibility)
- Analytics across all devices

---

## Step 1 — Create Firebase project

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project**
3. Name it e.g. `vianne-jck-2026`
4. Disable Google Analytics if you want (optional)
5. Click **Create project**

---

## Step 2 — Create Realtime Database

1. In left menu: **Build → Realtime Database**
2. Click **Create Database**
3. Choose region close to you (e.g. `us-central1`)
4. Start in **test mode** (we set rules in step 4)
5. Click **Enable**

You will see a URL like:

`https://YOUR-PROJECT-ID-default-rtdb.firebaseio.com`

Copy that — you need it as `databaseURL`.

---

## Step 3 — Add Web App & copy config

1. Project **Settings** (gear icon) → **General**
2. Scroll to **Your apps** → click **Web** `</>`
3. App nickname: `vianne-jck-web`
4. Register app
5. Copy the `firebaseConfig` object values:

```javascript
apiKey: "...",
authDomain: "...",
databaseURL: "https://....firebaseio.com",
projectId: "...",
storageBucket: "...",
messagingSenderId: "...",
appId: "..."
```

---

## Step 4 — Paste into this repo

Edit file: `cloud-config.js`

1. Paste all values into `firebaseConfig`
2. Set `enabled: true`
3. Save file

Example:

```javascript
window.VIANNE_CLOUD_CONFIG = {
  enabled: true,
  appName: "vianne-jck-cloud",
  pathPrefix: "vianne-jck-2026-prod",
  firebaseConfig: {
    apiKey: "AIza...",
    authDomain: "your-project.firebaseapp.com",
    databaseURL: "https://your-project-default-rtdb.firebaseio.com",
    projectId: "your-project",
    storageBucket: "your-project.firebasestorage.app",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123"
  }
};
```

---

## Step 5 — Database rules (required)

In Firebase Console → **Realtime Database → Rules**, paste:

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

Click **Publish**.

> For a private show floor this is fine. Later you can lock with auth.

---

## Step 6 — Deploy site

```bash
cd /Users/rj/Downloads/vianne-jck-2026
git add cloud-config.js index.html lookup.html FIREBASE-CLOUD-SETUP.md
git commit -m "Enable Firebase cloud sync for history and permissions"
git push
```

Wait 1–2 minutes, then open:

https://ruchitjiyani.github.io/vianne-jck-2026/

Hard refresh: **Cmd + Shift + R**

---

## Step 7 — Verify it works

1. Login on Device A → search a product
2. Login on Device B → open **History** → you should see Device A’s search
3. On Device A (admin) → change **Manager** permissions → Device B manager should update after refresh

You should see message: **“Cloud sync active — all devices share data”**

In Firebase Console → Realtime Database → **Data**, you will see:

```
vianne-jck-2026-prod
  ├── history
  │     └── (each lookup entry)
  └── permissions
        ├── admin
        ├── manager
        └── staff
```

---

## Export to Excel (all devices)

Use **History → Export CSV** or Analytics export in the app.  
Cloud history is merged automatically when cloud is enabled.

---

## Troubleshooting

| Problem | Fix |
|--------|-----|
| No cloud message | `enabled: false` or wrong `databaseURL` in `cloud-config.js` |
| Permission denied | Check database rules (step 5) |
| Manager still sees old perms | Hard refresh both devices after admin changes |
| Data not showing | Confirm both devices use same Firebase project URL |

---

## Google Drive?

Google Drive is for **files** (manual upload).  
This app needs **live sync** while people search — Firebase is the right tool.

You can still export CSV/Excel daily and upload that file to Google Drive manually if you want backups.
