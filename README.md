# ArchMindCanvas

A starter visual cloud architecture design tool built with React, TypeScript, Vite, and React Flow.

## Features

- Drag Azure-style resources onto a visual canvas
- Move and connect resources
- Edit resource name, region, SKU, and description
- Delete resources and connections
- Save/load diagrams in browser local storage
- Import/export architecture JSON files
- Mini-map, zoom, pan, grid snapping
- GitHub Pages deployment workflow included

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`.

## Build locally

```bash
npm run build
npm run preview
```

## Push to GitHub

Create an empty GitHub repository, then run:

```bash
git init
git add .
git commit -m "Initial cloud architecture designer"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

## Deploy with GitHub Pages

1. Open your GitHub repository.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Push to the `main` branch.
5. The included `.github/workflows/deploy.yml` workflow builds and deploys the app.

For a normal GitHub project page, the workflow automatically sets the Vite base path to your repository name.

## Next upgrade ideas

- Official Azure SVG icons
- Containers/groups for subscriptions, VNets, subnets, and resource groups
- Terraform/Bicep generation
- Architecture validation rules
- Cost estimation
- GitHub repository save/load
- Authentication
- AI prompt-to-diagram generation
