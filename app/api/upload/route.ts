import { NextResponse } from "next/server";
export const runtime = "nodejs";
const MAX_SIZE = 50 * 1024 * 1024; const allowedExtensions = new Set(["html","htm","pdf","zip","png","jpg","jpeg","webp"]);
const getExtension = (name: string) => { const parts = name.toLowerCase().split("."); return parts.length > 1 ? parts.pop()! : ""; };
const sanitizeSlug = (value: string) => value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
export async function POST(request: Request) {
  const formData = await request.formData(); const file = formData.get("file"); const requestedSlug = formData.get("slug");
  if (!(file instanceof File)) return NextResponse.json({ error: "File is required." }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: "File exceeds the 50 MB limit." }, { status: 413 });
  const extension = getExtension(file.name); if (!allowedExtensions.has(extension)) return NextResponse.json({ error: "Unsupported file type." }, { status: 415 });
  const slug = sanitizeSlug(typeof requestedSlug === "string" ? requestedSlug : ""); if (!slug) return NextResponse.json({ error: "A valid slug is required." }, { status: 400 });
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://pagedrop.example.com"; const publishedUrl = base.replace(/\/$/, "") + "/" + slug;
  return NextResponse.json({ publishedUrl, qrValue: publishedUrl, fileName: file.name, fileType: extension, storagePending: true });
}
