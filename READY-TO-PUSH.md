# ArchMindCanvas v8.4.0 — Functional Reference Starters

`Use as starting point` is now functional for the first four curated Microsoft reference patterns:

1. Hub-spoke network topology in Azure
2. Baseline architecture for an AKS cluster
3. Highly available multi-region web application
4. Azure Virtual Desktop for the enterprise

Behavior:
- Creates a new editable architecture in the current Project and Environment.
- Populates hierarchy, Azure resource nodes, starter relationships, and sensible starter network ranges.
- Marks the architecture as adapted from Microsoft reference guidance.
- Stores reference title/source URL in Architecture Metadata tags.
- Opens the Model panel after creation for review.
- Other Microsoft reference cards show `Coming soon` until mappings are added.

Important:
- These are ArchMindCanvas starter mappings inspired by Microsoft reference guidance.
- They are not a claim that the generated diagram is an official Microsoft-produced template.
- Review security, sizing, regions, dependencies, and generated IaC before deployment.

Terraform v1, remote backend, tfvars, validation, nested layering and archmind assistant behavior are preserved.

```powershell
git add .
git commit -m "ArchMindCanvas v8.4.0 - functional Microsoft reference starters"
git push origin main
```

## v8.4.1 — clear icon names restored
Normal desktop/laptop views again show icon + name for New, Template, Save, Auto Arrange, Validate, IaC, Cost, Import IaC, Org Vars and Deploy. The Command Center sidebar again shows Home, Projects, Templates, Activity and Settings. Icon-only mode is reserved for narrow/mobile screens. v8.4.0 reference starter functionality is unchanged.
