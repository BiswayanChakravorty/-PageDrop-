import DragDropUploader from "@/components/DragDropUploader";
export default function Home() {
  return <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white px-6 py-16"><section className="mx-auto max-w-5xl"><div className="mb-10 text-center"><div className="mb-4 inline-flex items-center rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1 text-xs font-semibold tracking-wide text-indigo-700">PAGEDROP</div><h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-6xl">Drop a file. Get a live link.</h1><p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">Publish HTML, PDF, ZIP, or images in seconds, then share the live URL or its QR code.</p></div><DragDropUploader /></section></main>;
}
