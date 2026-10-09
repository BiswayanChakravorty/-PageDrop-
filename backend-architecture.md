# PageDrop Backend Architecture

## Upload flow

1. The browser requests a short-lived upload token from `POST /api/upload`.
2. The route validates the slug, file name, MIME type and 50 MB size limit, then reserves the slug in Supabase.
3. The browser uploads directly to Vercel Blob using the token. Files larger than 4 MB use multipart upload, avoiding Vercel Function request-body limits.
4. Vercel Blob calls the route's completion callback, which records the Blob URL and marks the project as published.
5. The UI checks `GET /api/upload/status?slug=...`, then displays the public PageDrop URL and QR code.
6. `GET /p/[slug]` resolves the project. HTML is rendered in a sandboxed iframe; PDFs and images are embedded; ZIP files are offered as downloads.

## Required environment

- `BLOB_READ_WRITE_TOKEN`: Vercel Blob read/write token.
- `SUPABASE_URL` (or `NEXT_PUBLIC_SUPABASE_URL`): Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only Supabase service role key. Never expose it with a `NEXT_PUBLIC_` prefix.
- `NEXT_PUBLIC_APP_URL`: optional canonical origin, e.g. `https://your-project.vercel.app`. If omitted, the app uses the Vercel deployment origin.

## Current MVP boundaries

Uploads are public and anonymous; do not upload confidential files. Slugs are unique in the database. The app does not yet include authentication, rate limiting, billing, password-protected links, or custom domains. Wildcard subdomains require a domain you control and separate Vercel/DNS configuration; the current deployed MVP uses `/p/[slug]` links.
