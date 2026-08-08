# ArchMindCanvas v7.2.3 — Ready to Push

This repository is prepared for the existing GitHub Pages custom domain:

- Domain: `archmindcanvas.in`
- Branch: `main`
- Vite base path: `/`
- Custom-domain CNAME: `public/CNAME`
- Production workflow: `.github/workflows/deploy.yml`

## Push from VS Code

```powershell
git add .
git commit -m "ArchMindCanvas v7.2.3 - dynamic Azure properties"
git push origin main
```

After pushing, open **GitHub → Actions → Build and Deploy ArchMindCanvas**.

The `deploy` job runs only if these production gates pass:

1. npm dependency installation
2. TypeScript validation
3. Vite production build
4. `dist/index.html` validation
5. production assets validation
6. custom-domain `CNAME` validation

Do not commit `node_modules`, `dist`, or `*.tsbuildinfo`.
