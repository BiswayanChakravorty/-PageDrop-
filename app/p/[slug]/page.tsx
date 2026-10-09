import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

function getSupabase() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export default async function PublishedFilePage({ params }: Props) {
  const { slug } = await params;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 60) notFound();
  const supabase = getSupabase();
  if (!supabase) {
    return <main className="grid min-h-screen place-items-center bg-slate-50 p-6"><div className="max-w-lg rounded-2xl border bg-white p-8 text-center"><h1 className="text-xl font-bold">PageDrop needs setup</h1><p className="mt-2 text-slate-600">The database connection is not configured yet. Add the Supabase environment variables in Vercel.</p></div></main>;
  }

  const { data: project, error } = await supabase.from("projects")
    .select("slug,file_name,file_url,published_url,content_type,status")
    .eq("slug", slug).maybeSingle();
  if (error || !project) notFound();

  if (project.status !== "published" || !project.file_url) {
    return <main className="grid min-h-screen place-items-center bg-slate-50 p-6"><div className="max-w-lg rounded-2xl border bg-white p-8 text-center"><p className="text-sm font-semibold text-indigo-600">PAGEDROP</p><h1 className="mt-2 text-xl font-bold">This file is still being published</h1><p className="mt-2 text-slate-600">Refresh this page in a few seconds.</p></div></main>;
  }

  const contentType = String(project.content_type || "");
  if (contentType === "text/html" || /\.html?$/i.test(project.file_name)) {
    const response = await fetch(project.file_url, { cache: "no-store" });
    if (!response.ok) {
      return <main className="p-8 text-center"><h1 className="text-xl font-bold">Could not load this page</h1><p className="mt-2 text-slate-600">The stored file could not be retrieved.</p></main>;
    }
    let html = await response.text();
    const baseTag = `<base href="${project.file_url.replace(/&/g, "&amp;").replace(/"/g, "&quot;")}">`;
    html = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (head) => head + baseTag) : `<!doctype html><html><head>${baseTag}</head><body>${html}</body></html>`;
    return <main className="min-h-screen bg-white"><iframe title={project.file_name} srcDoc={html} sandbox="allow-scripts allow-forms allow-popups" referrerPolicy="no-referrer" className="h-screen w-full border-0" /></main>;
  }

  if (contentType === "application/pdf" || contentType.startsWith("image/")) {
    return <main className="min-h-screen bg-slate-100"><header className="flex items-center justify-between gap-4 border-b bg-white px-5 py-3"><a href="/" className="font-bold tracking-tight text-indigo-700">PageDrop</a><a href={project.file_url} target="_blank" rel="noreferrer" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">Open original</a></header>{contentType === "application/pdf" ? <iframe title={project.file_name} src={project.file_url} className="h-[calc(100vh-57px)] w-full border-0" /> : <div className="grid min-h-[calc(100vh-57px)] place-items-center p-6"><img src={project.file_url} alt={project.file_name} className="max-h-[85vh] max-w-full object-contain" /></div>}</main>;
  }

  return <main className="grid min-h-screen place-items-center bg-slate-50 p-6"><div className="w-full max-w-lg rounded-2xl border bg-white p-8 text-center"><p className="text-sm font-semibold text-indigo-600">PAGEDROP</p><h1 className="mt-2 break-words text-2xl font-bold">{project.file_name}</h1><p className="mt-2 text-slate-600">Your file is ready to download.</p><a href={project.file_url} className="mt-6 inline-flex rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white">Download file</a><p className="mt-6 text-xs text-slate-400">Hosted with PageDrop</p></div></main>;
}
