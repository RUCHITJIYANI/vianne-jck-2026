# Daily backup to Google Sheets (Excel in Drive)

Your app already saves **everything live** in Firebase:

| Cloud folder | What it stores |
|--------------|----------------|
| `history/` | Every search (code, price, customer, user, time) |
| `users/` | All login accounts |
| `permissions/` | Role toggles (manager/staff visibility) |
| `meta/` | Last update time and counts |

**View live data anytime:**  
[Firebase Console → Realtime Database](https://console.firebase.google.com/project/vianne-jck-2026/database/vianne-jck-2026-default-rtdb/data)

This guide adds a **Google Sheet** that refreshes automatically every night (like Excel on Google Drive).

---

## Step 1 — Create the spreadsheet

1. Go to [Google Sheets](https://sheets.google.com) → **Blank spreadsheet**
2. Name it: `Vianne JCK 2026 — Daily Backup`
3. **Extensions → Apps Script**
4. Delete any sample code and paste the full contents of:  
   `google-sheets/DailyBackup.gs` (from this repo)
5. **Save** (disk icon)

---

## Step 2 — Script properties

In Apps Script: **Project Settings** (gear) → **Script properties** → Add:

| Property | Value |
|----------|--------|
| `FIREBASE_DB_URL` | `https://vianne-jck-2026-default-rtdb.firebaseio.com` |
| `PATH_PREFIX` | `vianne-jck-2026-prod` |
| `BACKUP_SECRET` | Pick any long random password (e.g. `vj-backup-2026-x7k9`) |

---

## Step 3 — Test manual backup

1. In Apps Script, select function **`dailyBackupFromFirebase`**
2. Click **Run** → allow permissions when asked
3. Open your Google Sheet — you should see tabs:
   - **Searches** — all lookups (Excel-ready)
   - **Users** — names and roles (no passwords)
   - **Summary** — totals for the day
   - **Backup_Log** — each run timestamp

---

## Step 4 — Automatic daily run (end of day)

1. In Apps Script, select function **`installDailyTrigger`**
2. Click **Run** once
3. **Triggers** (clock icon) should show: `dailyBackupFromFirebase` — **Every day** around **11pm**

To change time: edit `atHour(23)` in `installDailyTrigger` (0 = midnight, 23 = 11 PM).

---

## Step 5 (optional) — Push from the app instantly

For “backup now” from Admin in the app:

1. Apps Script → **Deploy → New deployment**
2. Type: **Web app**
3. Execute as: **Me** | Who has access: **Anyone**
4. Copy the **Web app URL**

Edit `cloud-config.js`:

```javascript
googleSheetBackup: {
  enabled: true,
  webAppUrl: "https://script.google.com/macros/s/XXXX/exec",
  secret: "same-as-BACKUP_SECRET"
}
```

Push to GitHub. In the app: **Admin → Send to Google Sheet now**.

The app also tries one automatic push per day when someone logs in (if enabled).

---

## Download as Excel

Open the Google Sheet → **File → Download → Microsoft Excel (.xlsx)**

Or share the Sheet link with your team (view-only).

---

## Where is data stored?

| Place | Purpose |
|-------|---------|
| **Firebase** | Live sync across all phones (real-time) |
| **Google Sheet** | Daily Excel-style archive in your Drive |
| **CSV export** | Instant download from History tab in the app |

Google Drive does **not** replace Firebase for live booth use — the Sheet is your end-of-day report.
