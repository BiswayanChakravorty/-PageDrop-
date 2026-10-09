import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
const MAX_SIZE = 50 * 1024 * 1024;
const allowedContentTypes = ["text/html", "application/pdf", "application/zip", "application/x-zip-compressed", "image/png", "image/jpeg", "image/webp"];

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel Environment Variables.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
function validSlug(value: unknown): value is string {
  return typeof value === "string" && value.length >= 2 && value.length <= 60 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json({ error: "Vercel Blob is not configured. Create a Blob store in Vercel Storage and add BLOB_READ_WRITE_TOKEN." }, { status: 503 });
  }
  let body: HandleUploadBody;
  try { body = (await request.json()) as HandleUploadBody; }
  catch { return NextResponse.json({ error: "Invalid upload request." }, { status: 400 }); }

  try {
    const response = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        let payload: { slug?: unknown; fileName?: unknown; contentType?: unknown; size?: unknown };
        try { payload = JSON.parse(clientPayload || "{}"); }
        catch { throw new Error("Invalid upload metadata."); }
        if (!validSlug(payload.slug)) throw new Error("Invalid slug. Use 2–60 lowercase letters, numbers, and hyphens.");
        if (typeof payload.fileName !== "string" || payload.fileName.length > 255) throw new Error("Invalid file name.");
        if (typeof payload.size !== "number" || payload.size < 1 || payload.size > MAX_SIZE) throw new Error("Files must be smaller than 50 MB.");
        if (typeof payload.contentType !== "string" || !allowedContentTypes.includes(payload.contentType)) throw new Error("This file type is not supported.");
        if (!pathname.startsWith(`uploads/${payload.slug}/`)) throw new Error("Upload path does not match the selected slug.");

        const supabase = getSupabase();
        const base = (process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL || "http://localhost:3000").replace(/^https?:\/\//, "").replace(/\/$/, "");
        const protocol = process.env.NEXT_PUBLIC_APP_URL?.startsWith("http://") ? "http://" : "https://";
        const publishedUrl = `${process.env.NEXT_PUBLIC_APP_URL ? "" : protocol}${base}/p/${payload.slug}`;
        const { error } = await supabase.from("projects").insert({
          slug: payload.slug,
          file_name: payload.fileName,
          file_url: null,
          published_url: publishedUrl,
          content_type: payload.contentType,
          file_size: payload.size,
          status: "pending",
        });
        if (error) {
          if (error.code === "23505") throw new Error("That slug is already taken. Choose another one.");
          throw new Error("Could not reserve this slug in Supabase. Check the database schema and service-role key.");
        }
        return {
          allowedContentTypes,
          maximumSizeInBytes: MAX_SIZE,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ slug: payload.slug, fileName: payload.fileName, contentType: payload.contentType, size: payload.size }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payload = JSON.parse(tokenPayload || "{}") as { slug?: string; fileName?: string; contentType?: string; size?: number };
        if (!validSlug(payload.slug)) throw new Error("Invalid upload completion metadata.");
        const supabase = getSupabase();
        const { error } = await supabase.from("projects").update({
          file_url: blob.url,
          file_name: payload.fileName,
          content_type: blob.contentType || payload.contentType,
          file_size: payload.size,
          status: "published",
        }).eq("slug", payload.slug);
        if (error) throw new Error("Blob uploaded, but project metadata could not be saved.");
      },
    });
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload request failed." }, { status: 400 });
  }
}
