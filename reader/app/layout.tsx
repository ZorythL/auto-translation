import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Novel Reader",
  description: "A personal reader for translated web novels.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-neutral-950 text-neutral-100 antialiased">
        <header className="border-b border-neutral-800 bg-neutral-900/60 backdrop-blur sticky top-0 z-10">
          <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
            <Link href="/" className="font-semibold tracking-tight hover:text-white">
              📚 Novel Reader
            </Link>
            <span className="text-xs text-neutral-500">local library</span>
          </div>
        </header>
        <main className="mx-auto max-w-3xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-3xl px-4 py-10 text-center text-xs text-neutral-600">
          Translations are personal/non-commercial. Built with Next.js.
        </footer>
      </body>
    </html>
  );
}
