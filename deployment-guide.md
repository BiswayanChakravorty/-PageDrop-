# PageDrop — Vercel Deployment

## 1. Deploy the GitHub repository

1. Open https://vercel.com/new and import `BiswayanChakravorty/-PageDrop-`.
2. Framework preset: **Next.js**. Root directory: `./`. Build command: `npm run build`.
3. Deploy. The app shell builds without credentials, but publishing files requires the next two setup steps.

## 2. Create Vercel Blob storage

1. In the Vercel project, open **Storage → Create Database → Blob**.
2. Create a **Public** Blob store and connect it to the PageDrop project for Production and Preview.
3. Confirm `BLOB_READ_WRITE_TOKEN` is present in project environment variables.

## 3. Configure Supabase

1. Create a Supabase project.
2. Open **SQL Editor** and run the entire `supabase/schema.sql` file from this repository.
3. In Supabase project settings, copy the project URL and service-role key.
4. In Vercel → Project → Settings → Environment Variables, add:
   - `SUPABASE_URL` = Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = service-role key (**server-only; never use a NEXT_PUBLIC_ prefix**)
   - `NEXT_PUBLIC_APP_URL` = the canonical app origin, e.g. `https://your-project.vercel.app`
5. Redeploy after adding or changing environment variables.

## 4. Verify

- Open the deployment URL.
- Upload a small HTML file, PDF, or image.
- Confirm the success link opens at `/p/<slug>`, and download the generated QR code.
- Test a file larger than 4.5 MB to verify multipart direct-to-Blob upload.
- Confirm the project row has `status = 'published'` in Supabase and the file appears in Blob storage.

## Custom domains and wildcard subdomains

The current MVP publishes links on the Vercel app domain as `https://your-app.vercel.app/p/<slug>`. For `https://<slug>.yourdomain.com`, first add and verify a domain you own in Vercel, configure wildcard DNS as instructed by Vercel, then implement and test host-based tenant routing before changing published URLs. Do not point a wildcard domain at this MVP and assume subdomain routing is already implemented.

## Important

- Uploads are public and anonymous; do not upload confidential or copyrighted material without permission.
- Add rate limiting, abuse reporting, authentication and file-retention rules before a public launch.
- Google Search Console TXT verification is done in your domain's DNS provider; it is not required for the MVP to publish files.
