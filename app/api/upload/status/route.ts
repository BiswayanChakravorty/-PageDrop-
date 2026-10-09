import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug") || "";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 60) {
    return NextResponse.json({ error: "Invalid slug." }, { status: 400 });
  }
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await supabase.from("projects").select("status").eq("slug", slug).maybeSingle();
  if (error) return NextResponse.json({ error: "Could not check publish status." }, { status: 500 });
  if (!data) return NextResponse.json({ status: "missing" }, { status: 404 });
  return NextResponse.json({ status: data.status }, { headers: { "Cache-Control": "no-store" } });
}
