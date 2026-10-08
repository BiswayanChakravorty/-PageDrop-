import "./globals.css";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "PageDrop — Publish files instantly", description: "Drop a file, publish it instantly, and share it with a QR code." };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
