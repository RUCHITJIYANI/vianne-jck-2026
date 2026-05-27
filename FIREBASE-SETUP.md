# Firebase setup — request & approve access

Visitors see a **6-line code** → send it to you → you **Approve** on `admin.html` → their page opens the catalog automatically.

## 1. Create Firebase project (free)

1. Go to https://console.firebase.google.com → **Add project** (e.g. `vianne-jck`)
2. **Build** → **Realtime Database** → **Create database**
3. Choose a region → **Start in test mode** (we’ll fix rules below)

## 2. Copy config into the site

1. Project **Settings** (gear) → **Your apps** → **Web** `</>` → Register app
2. Copy the `firebaseConfig` values into `firebase-config.js`:

```javascript
const FIREBASE_CONFIG = {
  apiKey: "...",
  authDomain: "...",
  databaseURL: "https://XXXX-default-rtdb.firebaseio.com",
  projectId: "...",
  ...
};
```

3. Set your admin password in the same file:

```javascript
const ADMIN_PASSWORD = "pick-a-strong-secret";
```

## 3. Database rules

Realtime Database → **Rules** → paste:

```json
{
  "rules": {
    "access_requests": {
      "$id": {
        ".read": true,
        ".write": "!data.exists() || (data.exists() && newData.child('status').exists())"
      }
    }
  }
}
```

Click **Publish**.

> This is fine for a private show app. Do not store sensitive business data in Firebase.

## 4. Deploy

```bash
cd /Users/rj/Downloads/vianne-jck-2026
./push.sh
```

## 5. Your links

| Who | URL |
|-----|-----|
| **Visitors** | https://ruchitjiyani.github.io/vianne-jck-2026/ |
| **You (approve)** | https://ruchitjiyani.github.io/vianne-jck-2026/admin.html |

## Daily use

1. Visitor opens the site → sees 6 lines like `VK7M-2P4Q` …
2. They tap **Copy message** → send to you on WhatsApp
3. You open **admin.html** → sign in → tap **Approve**
4. Their phone opens the lookup app within a few seconds

## Troubleshooting

- **“Firebase not configured”** → fill in `firebase-config.js` and push again
- **Approve does nothing** → visitor must keep `index.html` open (or reopen the same link)
- **admin.html empty** → check database rules and `databaseURL` in config
