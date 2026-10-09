import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks = {
    blobToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    supabaseUrl: Boolean(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL),
    supabaseServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  };
  const missing = Object.entries(checks)
    .filter(([, configured]) => !configured)
    .map(([name]) => name);

  return NextResponse.json(
    { ok: missing.length === 0, checks, missing },
    { headers: { "Cache-Control": "no-store" } },
  );
}
