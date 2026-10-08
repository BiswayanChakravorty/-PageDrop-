# PageDrop

PageDrop is a focused MVP for publishing files instantly:

**Drop file → choose slug → publish → get live URL + QR code**

## Run locally

```bash
npm install
npm run dev
```

## Environment

Set `NEXT_PUBLIC_APP_URL` to the public origin. The upload route currently returns a deterministic MVP URL until object storage and PostgreSQL credentials are connected.

## Product scope

Supported MVP uploads: HTML, PDF, ZIP, PNG, JPG/JPEG, and WEBP files up to 50 MB.

The supplied architecture calls for object storage + PostgreSQL, wildcard routing, authentication/billing, analytics, and custom domains as the next production layers.
