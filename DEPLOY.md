# Fix GitHub Pages — step by step

Your code is ready locally. The site is **not online** because nothing has reached GitHub yet (`Repository not found` = the repo does not exist or you are not logged in).

## Part 1 — Create the repository (browser)

1. Sign in at [github.com](https://github.com) as **ruchitjiyani12** (check the top-right avatar).
2. Open: **https://github.com/new**
3. Set:
   - **Repository name:** `ruchitjiyani12.github.io` (must be exactly this for the root URL)
   - **Public**
   - Do **not** add README, .gitignore, or license (leave empty)
4. Click **Create repository**.

You should see an empty repo page. If you get “name already exists”, open that repo instead and use Part 2.

---

## Part 2 — Log in from Terminal (one time)

Run:

```bash
gh auth login
```

Choose: **GitHub.com** → **HTTPS** → **Login with a web browser** → complete login.

Verify:

```bash
gh auth status
```

You must see: `Logged in to github.com as ruchitjiyani12`

---

## Part 3 — Push your project

```bash
cd /Users/rj/Downloads/vianne-jck-2026
git remote set-url origin https://github.com/ruchitjiyani12/ruchitjiyani12.github.io.git
git push -u origin main
```

If `main` is rejected, try:

```bash
git push -u origin main --force
```

(Only if this repo is new/empty.)

---

## Part 4 — Turn on GitHub Pages

1. Open: **https://github.com/ruchitjiyani12/ruchitjiyani12.github.io/settings/pages**
2. **Build and deployment** → Source: **Deploy from a branch**
3. Branch: **main**, folder: **/ (root)** → **Save**
4. Wait 2–5 minutes.

Your site: **https://ruchitjiyani12.github.io/**  
Password: **vianne2026**

---

## Can’t use Terminal? Upload in the browser

1. Create the empty repo (Part 1).
2. On the repo page, click **Add file** → **Upload files**.
3. Upload these from `/Users/rj/Downloads/vianne-jck-2026/`:
   - `index.html`
   - `lookup.html`
   - `data.js`
   - `images.js`
   - `app.js`
4. Click **Commit changes**.
5. Enable Pages (Part 4).

---

## Test locally (works without GitHub)

```bash
cd /Users/rj/Downloads/vianne-jck-2026
python3 -m http.server 8080
```

Open: **http://localhost:8080/index.html**

---

## Common mistakes

| Problem | Fix |
|--------|-----|
| `Repository not found` | Create `ruchitjiyani12.github.io` on GitHub first (Part 1) |
| `Password authentication not supported` | Run `gh auth login`; never use account password for push |
| `remote origin already exists` | Run `git remote set-url origin https://github.com/ruchitjiyani12/ruchitjiyani12.github.io.git` |
| 404 on `ruchitjiyani12.github.io` | Push succeeded + Pages enabled on **main** branch |
| Wrong repo name `vianne-jck-2026` | Site would be at `/vianne-jck-2026/`, not root — use `ruchitjiyani12.github.io` for root URL |
