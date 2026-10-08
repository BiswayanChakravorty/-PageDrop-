# Backend Architecture & Upload Flow

## Endpoint: POST /api/upload

Request parameters: File payload (HTML, PDF, ZIP) and custom URL slug.

Processing:
1. Parse the incoming payload and extract the file.
2. Upload the file to object storage under the target slug folder.
3. Save project metadata in PostgreSQL.
4. Return the published URL and QR target.

The current route keeps a deterministic response fallback until Blob/R2 and database credentials are configured.
