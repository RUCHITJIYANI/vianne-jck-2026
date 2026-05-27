#!/bin/bash
# Deploy Vianne JCK 2026 lookup to GitHub Pages (RUCHITJIYANI account)
set -e
cd "$(dirname "$0")"

if ! gh auth status &>/dev/null; then
  echo "Run first: gh auth login"
  exit 1
fi

echo "Logged in as: $(gh api user -q .login)"

# Fix large push failures on macOS
git config http.postBuffer 524288000
git config http.version HTTP/1.1

git remote set-url origin https://github.com/RUCHITJIYANI/vianne-jck-2026.git

git add index.html lookup.html admin.html data.js images.js app.js assets/ js/ firebase-config.js .nojekyll README.md FIREBASE-SETUP.md .gitignore scripts/
git status
git commit -m "Final build: JCK 2026 jewelry lookup for GitHub Pages" || true

echo "Pushing..."
git push -u origin main

echo ""
echo "Enable Pages (once): https://github.com/RUCHITJIYANI/vianne-jck-2026/settings/pages"
echo "  Branch: main  |  Folder: / (root)"
echo ""
echo "Live site: https://ruchitjiyani.github.io/vianne-jck-2026/"
echo "Password:  vianne2026"
