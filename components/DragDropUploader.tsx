"use client";

import React, { useCallback, useState } from "react";
import { upload } from "@vercel/blob/client";
import { useDropzone } from "react-dropzone";
import { QRCodeSVG } from "qrcode.react";

const MAX_SIZE = 50 * 1024 * 1024;
const ACCEPTED = {
  "text/html": [".html", ".htm"],
  "application/pdf": [".pdf"],
  "application/zip": [".zip"],
  "application/x-zip-compressed": [".zip"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/webp": [".webp"],
};

function slugify(value: string) {
  return value.toLowerCase().replace(/\.[^.]+$/, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

function normalizeSlug(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);
}

function getContentType(file: File) {
  const declared = file.type.toLowerCase().split(";")[0].trim();
  if (declared === "application/x-zip-compressed") return "application/zip";
  if (Object.prototype.hasOwnProperty.call(ACCEPTED, declared)) return declared;

  const extension = file.name.toLowerCase().split(".").pop();
  const byExtension: Record<string, string> = {
    html: "text/html",
    htm: "text/html",
    pdf: "application/pdf",
    zip: "application/zip",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
  };
  return extension ? byExtension[extension] || declared : declared;
}

export default function DragDropUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [customSlug, setCustomSlug] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    const selected = acceptedFiles[0];
    if (!selected) return;
    setFile(selected);
    setCustomSlug((current) => current || slugify(selected.name));
    setPublishedUrl(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: ACCEPTED,
    maxFiles: 1,
    maxSize: MAX_SIZE,
    noClick: true,
    onDropRejected: (rejected) => setError(rejected[0]?.errors[0]?.message ?? "Unsupported file. Choose HTML, PDF, ZIP, PNG, JPG, or WEBP up to 50 MB."),
  });

  const handleUpload = async () => {
    if (!file) return;
    const slug = normalizeSlug(customSlug);
    if (!slug) { setError("Enter a valid URL slug."); return; }
    if (slug.length < 2) { setError("Slug must contain at least 2 characters."); return; }

    setError(null);
    setIsUploading(true);
    setProgress(0);
    try {
      const contentType = getContentType(file);
      if (!Object.prototype.hasOwnProperty.call(ACCEPTED, contentType)) {
        throw new Error("Unsupported file type. Choose HTML, PDF, ZIP, PNG, JPG, or WEBP.");
      }
      const clientPayload = JSON.stringify({ slug, fileName: file.name, contentType, size: file.size });
      await upload(`uploads/${slug}/${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`, file, {
        access: "public",
        contentType,
        handleUploadUrl: "/api/upload",
        clientPayload,
        multipart: file.size > 4 * 1024 * 1024,
        onUploadProgress: (event) => setProgress(Math.round(event.percentage)),
      });

      const statusUrl = `/api/upload/status?slug=${encodeURIComponent(slug)}`;
      let published = false;
      for (let attempt = 0; attempt < 20; attempt++) {
        const response = await fetch(statusUrl, { cache: "no-store" });
        if (response.ok) {
          const status = await response.json();
          if (status.status === "published") { published = true; break; }
          if (status.status === "failed") throw new Error(status.error || "The file uploaded, but publishing failed.");
        }
        await new Promise((resolve) => setTimeout(resolve, 750));
      }
      if (!published) throw new Error("The upload finished, but the database is still processing it. Refresh in a few seconds; your slug is reserved.");
      const base = (process.env.NEXT_PUBLIC_APP_URL || window.location.origin).replace(/\/$/, "");
      setPublishedUrl(`${base}/p/${slug}`);
      setProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Check that Vercel Blob and Supabase are configured.");
    } finally {
      setIsUploading(false);
    }
  };

  const copyLink = async () => {
    if (!publishedUrl) return;
    await navigator.clipboard.writeText(publishedUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  const downloadQr = () => {
    const svg = document.getElementById("pagedrop-qr");
    if (!svg || !publishedUrl) return;
    const source = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "pagedrop-qr.svg";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">
      {!publishedUrl ? (
        <div className="space-y-5">
          <div {...getRootProps()} className={["rounded-2xl border-2 border-dashed p-10 text-center transition", isDragActive ? "border-indigo-500 bg-indigo-50" : "border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/50"].join(" ")}>
            <input {...getInputProps()} />
            <button type="button" onClick={open} className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-indigo-100 text-2xl text-indigo-700" aria-label="Choose a file">↑</button>
            <p className="font-semibold text-slate-900">{file ? file.name : isDragActive ? "Drop it here" : "Drag & drop your file"}</p>
            <p className="mt-2 text-sm text-slate-500">HTML, PDF, ZIP, PNG, JPG or WEBP · max 50 MB</p>
            {file && <p className="mt-1 text-xs text-slate-400">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>}
          </div>
          <div>
            <label htmlFor="slug" className="mb-2 block text-sm font-semibold text-slate-700">Custom link slug</label>
            <div className="flex overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-indigo-500">
              <span className="flex items-center bg-slate-50 px-3 text-sm text-slate-400">your-app.vercel.app/p/</span>
              <input id="slug" value={customSlug} onChange={(event) => setCustomSlug(event.target.value)} placeholder="my-project" maxLength={60} className="min-w-0 flex-1 px-3 py-3 outline-none" />
            </div>
          </div>
          {isUploading && <div aria-live="polite"><div className="mb-2 flex justify-between text-xs text-slate-500"><span>Uploading and publishing</span><span>{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${progress}%` }} /></div></div>}
          {error && <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
          <button onClick={handleUpload} disabled={!file || isUploading} className="w-full rounded-xl bg-indigo-600 py-3.5 font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">{isUploading ? "Publishing…" : "Publish instantly"}</button>
          <p className="text-center text-xs text-slate-400">By uploading, you confirm you have the right to share this file. Public links are accessible to anyone who has the URL.</p>
        </div>
      ) : (
        <div className="space-y-6 text-center">
          <div><p className="text-sm font-medium text-emerald-600">Published successfully</p><h2 className="mt-1 text-2xl font-bold text-slate-950">Your file is live.</h2></div>
          <a href={publishedUrl} target="_blank" rel="noreferrer" className="block break-all font-mono text-sm text-indigo-600 hover:underline">{publishedUrl}</a>
          <div className="mx-auto w-fit rounded-2xl border border-slate-200 bg-white p-4"><QRCodeSVG id="pagedrop-qr" value={publishedUrl} size={220} includeMargin /></div>
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={copyLink} className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white hover:bg-indigo-700">{copied ? "Copied" : "Copy link"}</button>
            <button onClick={downloadQr} className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50">Download QR (SVG)</button>
            <button onClick={() => { setFile(null); setCustomSlug(""); setPublishedUrl(null); setProgress(0); }} className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50">Upload another</button>
          </div>
          <p className="text-xs text-slate-400">Hosted with PageDrop</p>
        </div>
      )}
    </div>
  );
}
