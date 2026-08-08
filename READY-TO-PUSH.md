# ArchMindCanvas v7.9.6

Fixes GitHub Actions TypeScript build error:

`src/App.tsx:908 Cannot find name 'Network'.`

The `Network` icon used by the compact Architecture navigation is now explicitly imported from `lucide-react`.

```powershell
git add .
git commit -m "ArchMindCanvas v7.9.6 - fix Network icon import"
git push origin main
```
