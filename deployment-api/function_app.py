import json
import os
import urllib.request

def _json_response(status_code: int, body: dict):
    return {
        "statusCode": status_code,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(body),
    }

def main(req):
    """Minimal Azure Function-style handler scaffold.

    Production notes:
    - Store no secrets in the browser.
    - Authenticate this API with Microsoft Entra ID.
    - Prefer workload identity federation for Azure deployment pipelines.
    - Replace the placeholder response with Azure DevOps/GitHub API calls.
    """
    try:
        body = req.get_json()
    except Exception:
        return _json_response(400, {"error": "Invalid JSON body"})

    required = ["provider", "iacType", "environment"]
    missing = [key for key in required if not body.get(key)]
    if missing:
        return _json_response(400, {"error": f"Missing fields: {', '.join(missing)}"})

    return _json_response(202, {
        "status": "queued",
        "provider": body["provider"],
        "iacType": body["iacType"],
        "environment": body["environment"],
        "message": "Deployment request accepted by ArchMindCanvas deployment API scaffold."
    })
