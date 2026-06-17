import Link from "next/link";
import { getNovels } from "@/lib/content";

export const dynamic = "force-static";

export default async function HomePage() {
  const novels = await getNovels();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Library</h1>
      <p className="text-neutral-400 mb-8 text-sm">
        {novels.length} {novels.length === 1 ? "novel" : "novels"} in your collection.
      </p>

      {novels.length === 0 ? (
        <div className="rounded-lg border border-neutral-800 p-6 text-neutral-400">
          No novels yet. Ingest one with{" "}
          <code className="text-neutral-200">npm run ingest -- --slug …</code>.
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {novels.map((n) => (
            <li key={n.slug}>
              <Link
                href={`/novels/${n.slug}`}
                className="block rounded-lg border border-neutral-800 bg-neutral-900/40 p-5 hover:border-neutral-600 hover:bg-neutral-900 transition"
              >
                <h2 className="font-semibold text-lg leading-snug">{n.title}</h2>
                {n.originalTitle ? (
                  <p className="text-neutral-500 text-sm mt-1">{n.originalTitle}</p>
                ) : null}
                <p className="text-neutral-400 text-xs mt-3">
                  {n.chapterCount} chapters
                  {n.author && n.author !== "Unknown" ? ` · ${n.author}` : ""}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
