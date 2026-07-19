# ArchMindCanvas Deployment API

This is the server-side deployment scaffold for ArchMindCanvas.

Recommended hosting: Azure Functions or Azure Container Apps.

The browser should call this API instead of storing Azure DevOps PATs, GitHub tokens, Azure client secrets, or service-principal credentials.

## Suggested endpoints

- POST /api/deploy/validate
- POST /api/deploy/plan
- POST /api/deploy/run
- GET  /api/deploy/status/{runId}

For production, use managed identity / workload identity federation wherever possible.
