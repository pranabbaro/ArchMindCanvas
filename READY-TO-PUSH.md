# ArchMindCanvas v7.7.0 — Project / Environment / Architecture Workspace

Functional hierarchy:

Organization
└── Project
    ├── Environments
    │   ├── DEV
    │   ├── TEST
    │   ├── QA
    │   ├── PROD
    │   └── DR
    └── Architectures
        └── Each architecture is assigned to an environment

New functionality:
- Create Project
- Open Project workspace
- Create Environment inside a Project
- Create Architecture inside a Project
- Choose Environment when creating Architecture
- Project Overview / Architectures / Environments tabs
- Open architecture into existing editor with correct Project/Environment/Architecture context
- Project metadata is persisted in browser localStorage

Push:

```powershell
git add .
git commit -m "ArchMindCanvas v7.7.0 - project environment architecture workspace"
git push origin main
```
