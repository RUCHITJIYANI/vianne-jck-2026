# Where your data lives + Google Drive folder

## 1. Live data (real-time, all devices)

**Firebase Console** — see every search as it happens:

👉 https://console.firebase.google.com/project/vianne-jck-2026/database/vianne-jck-2026-default-rtdb/data

Expand **`vianne-jck-2026-prod`**:

| Node | What's inside |
|------|----------------|
| `history/` | Every lookup — code, price, customer, who searched, time |
| `users/` | All login accounts |
| `permissions/` | Manager/staff visibility toggles |
| `meta/` | Last update time, search count |

**In the app (Admin):**  
https://ruchitjiyani.github.io/vianne-jck-2026/ → Login → **Admin** → **Open Firebase (live data)**

---

## 2. Google Drive folder — **Vianne JCK 2026**

End-of-day Excel-style backups go here (after one-time setup below).

**Folder name:** `Vianne JCK 2026`

After setup, the folder will contain:

| File | What it is |
|------|------------|
| `Vianne JCK 2026 — Daily Backup` | Google Sheet (Searches, Users, Summary tabs) |
| `VianneJCK_Backup_2026-05-28.csv` | Daily CSV (opens in Excel) |
| `README — Vianne JCK 2026.txt` | Short guide inside the folder |

**Open Drive:** https://drive.google.com → search **Vianne JCK 2026**

---

## 3. Instant download from the app

| Button | Location |
|--------|----------|
| **Export CSV** | History tab |
| **Full backup CSV** | Admin → Cloud & Daily Backup |
| **Google Sheet now** | Admin (after Step 5 below) |

---

# One-time setup — attach to Google Drive

### Step A — Create the folder

1. Go to [Google Drive](https://drive.google.com)
2. **New → Folder**
3. Name it exactly: **`Vianne JCK 2026`**
4. Open the folder (keep this tab open)

### Step B — Create the backup sheet inside the folder

1. Inside the folder: **New → Google Sheets → Blank spreadsheet**
2. Rename it: **`Vianne JCK 2026 — Daily Backup`**
3. **Extensions → Apps Script**
4. Delete sample code → paste all of **`google-sheets/DailyBackup.gs`** from this repo
5. **Save**

### Step C — Script properties

Apps Script → **Project Settings** (gear) → **Script properties**:

| Property | Value |
|----------|--------|
| `FIREBASE_DB_URL` | `https://vianne-jck-2026-default-rtdb.firebaseio.com` |
| `PATH_PREFIX` | `vianne-jck-2026-prod` |
| `DRIVE_FOLDER_NAME` | `Vianne JCK 2026` |
| `BACKUP_SECRET` | Any long password (e.g. `vj-backup-2026-x7k9`) |

### Step D — Run setup (creates/links folder)

1. Select function **`setupDriveFolder`** → **Run** → allow Drive permissions
2. **View → Logs** — copy the folder URL (or find **Vianne JCK 2026** in Drive)

### Step E — Test backup

1. Run **`dailyBackupFromFirebase`**
2. Open Drive folder **Vianne JCK 2026** — you should see the Sheet + a `.csv` file

### Step F — Automatic every night (~11 PM)

1. Run **`installDailyTrigger`** once
2. **Triggers** (clock icon) → `dailyBackupFromFirebase` daily

---

## Optional — push from the app instantly

1. Apps Script → **Deploy → New deployment → Web app**
2. Execute as: **Me** | Access: **Anyone**
3. Copy the Web app URL

Edit `cloud-config.js`:

```javascript
googleSheetBackup: {
  enabled: true,
  webAppUrl: "https://script.google.com/macros/s/XXXX/exec",
  secret: "same-as-BACKUP_SECRET"
}
```

Ask to **push to GitHub**. Then in the app: **Admin → Google Sheet now**.

---

## Summary

| Where | When | Best for |
|-------|------|----------|
| **Firebase Console** | Live, always | Watching searches during the show |
| **App History / Analytics** | Live | Staff on the floor |
| **Google Drive folder** | Daily + on-demand | Excel reports, sharing with team |
| **CSV export** | Anytime | Quick download on phone/laptop |

Firebase = live booth. Google Drive folder = your daily archive in **Vianne JCK 2026**.
