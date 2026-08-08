# ArchMindCanvas v7.7.1 — Project Workspace Build Fix

Fixes the production TypeScript error:

`Argument of type 'string' is not assignable to parameter of type
SetStateAction<\`${string}-${string}-${string}-${string}-${string}\`>`

Cause:
`crypto.randomUUID()` caused TypeScript to infer `designId` as the UUID template-literal type.
Project-created architecture IDs use normal string IDs (`arch-...`).

Fix:
- `designId` is explicitly `useState<string>()`
- Organization / Project / Environment ID states are also explicitly typed as `string`
- Project → Environment → Architecture functionality is unchanged

Push:

```powershell
git add .
git commit -m "ArchMindCanvas v7.7.1 - fix project workspace ID typing"
git push origin main
```
