# ArchMindCanvas v7.2.4 — Ready to Push

This release fixes the GitHub Actions failure:

`Dependencies lock file is not found`

The project currently does not commit `package-lock.json`, so npm caching has been removed from `actions/setup-node`.
The workflow now installs dependencies directly with `npm install`.

## Push from VS Code

```powershell
git add .
git commit -m "ArchMindCanvas v7.2.4 - fix production workflow"
git push origin main
```

The production workflow will run:

1. Checkout
2. Setup Node.js 24
3. `npm install`
4. TypeScript validation
5. Vite production build
6. Verify `dist`
7. Upload production artifact
8. Deploy GitHub Pages
