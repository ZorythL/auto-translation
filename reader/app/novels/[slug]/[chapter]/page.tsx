import Link from "next/link";
import { notFound } from "next/navigation";
import { getNovels, getNovel, getChapterList, getChapter } from "@/lib/content";
import ChapterReader from "@/components/ChapterReader";

export const dynamic = "force-static";

export async function generateStaticParams() {
  const novels = await getNovels();
  const params: { slug: string; chapter: string }[] = [];
  for (const n of novels) {
    const chapters = await getChapterList(n.slug);
    for (const c of chapters) {
      params.push({ slug: n.slug, chapter: String(c.num) });
    }
  }
  return params;
}

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ slug: string; chapter: string }>;
}) {
  const { slug, chapter } = await params;
  const num = parseInt(chapter, 10);
  if (!Number.isFinite(num)) notFound();

  const novel = await getNovel(slug);
  if (!novel) notFound();

  const content = await getChapter(slug, num);
  if (!content) notFound();

  const list = await getChapterList(slug);
  const idx = list.findIndex((c) => c.num === num);
  const prev = idx > 0 ? list[idx - 1] : null;
  const next = idx >= 0 && idx < list.length - 1 ? list[idx + 1] : null;

  return (
    <article>
      <div className="flex items-center justify-between text-sm text-neutral-400">
        <Link href={`/novels/${slug}`} className="hover:text-neutral-200">
          ← {novel.title}
        </Link>
        <span>
          {num} / {list.length}
        </span>
      </div>

      <h1 className="text-xl font-bold mt-4 mb-6">{content.title}</h1>

      <ChapterReader
        englishParagraphs={content.englishParagraphs}
        chineseParagraphs={content.chineseParagraphs}
        hasEnglish={content.hasEnglish}
        hasChinese={content.hasChinese}
      />

      <nav className="mt-12 flex items-center justify-between border-t border-neutral-800 pt-6 text-sm">
        {prev ? (
          <Link
            href={`/novels/${slug}/${prev.num}`}
            className="rounded-md border border-neutral-700 px-4 py-2 hover:bg-neutral-900"
          >
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/novels/${slug}/${next.num}`}
            className="rounded-md border border-neutral-700 px-4 py-2 hover:bg-neutral-900"
          >
            {next.title} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  );
}
