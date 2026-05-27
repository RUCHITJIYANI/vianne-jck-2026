# Start from the beginning — GitHub + Terminal

Your project folder: `/Users/rj/Downloads/vianne-jck-2026`  
GitHub repo (already created, empty): `ruchitjiyani12/vianne-jck-2026`  
Live site URL after deploy: **https://ruchitjiyani12.github.io/vianne-jck-2026/**

---

## STEP 1 — Security (do this first)

If you ever pasted a GitHub token in chat or email, **revoke it**:

1. Open https://github.com/settings/tokens  
2. Delete the old token  
3. **Generate new token (classic)** → check **repo** → Generate → **copy** it (you will use it once in Step 4)

Your GitHub **username** is: `ruchitjiyani12` (lowercase, no symbols)

---

## STEP 2 — Open Terminal

Press `Cmd + Space`, type **Terminal**, press Enter.

Go to the project:

```bash
cd /Users/rj/Downloads/vianne-jck-2026
```

---

## STEP 3 — Install GitHub CLI (if needed)

```bash
brew install gh
```

(Skip if `gh` is already installed.)

---

## STEP 4 — Log in to GitHub (one time)

```bash
gh auth login
```

Answer exactly:

| Question | Answer |
|----------|--------|
| What account? | **GitHub.com** |
| Protocol? | **HTTPS** |
| Authenticate? | **Login with a web browser** |
| Copy code → Enter | Follow the browser |

Check login:

```bash
gh auth status
```

Must show: `Logged in to github.com as ruchitjiyani12`

---

## STEP 5 — Push your website files

Copy and paste **all** of these lines:

```bash
cd /Users/rj/Downloads/vianne-jck-2026
git remote set-url origin https://github.com/ruchitjiyani12/vianne-jck-2026.git
git add index.html lookup.html data.js images.js app.js README.md .gitignore scripts/
git status
git commit -m "Publish JCK 2026 jewelry lookup" 2>/dev/null || true
git push -u origin main
```

If it asks for username/password:

- **Username:** `ruchitjiyani12`  
- **Password:** paste your **new token** (not your GitHub password)

---

## STEP 6 — Turn on GitHub Pages (browser)

1. Open: https://github.com/ruchitjiyani12/vianne-jck-2026/settings/pages  
2. **Build and deployment** → Source: **Deploy from a branch**  
3. Branch: **main** → Folder: **/ (root)** → **Save**  
4. Wait **2–5 minutes**

---

## STEP 7 — Open your site

**https://ruchitjiyani12.github.io/vianne-jck-2026/**

- Click through to the lookup app, or open:  
  **https://ruchitjiyani12.github.io/vianne-jck-2026/index.html**
- Password: **vianne2026**

---

## Test locally (optional, before GitHub)

```bash
cd /Users/rj/Downloads/vianne-jck-2026
python3 -m http.server 8080
```

Open: http://localhost:8080/index.html

---

## If something fails

| Error | Fix |
|-------|-----|
| `Repository not found` | Repo name must be `vianne-jck-2026` under account `ruchitjiyani12` |
| `Authentication failed` | Run `gh auth login` again; use **token** as password |
| `remote origin already exists` | Run `git remote set-url origin https://github.com/ruchitjiyani12/vianne-jck-2026.git` |
| Site still 404 | Push must succeed first; then enable Pages on **main** |
| Blank page | Open `/index.html` not just the folder URL |

---

## Want the short URL `ruchitjiyani12.github.io` (no folder)?

Create a **second** repo named exactly `ruchitjiyani12.github.io` and push the same files there.  
Your current repo works at: `/vianne-jck-2026/` path.
