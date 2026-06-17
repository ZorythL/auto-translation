import Link from "next/link";
import { notFound } from "next/navigation";
import { getNovels, getNovel, getChapterList } from "@/lib/content";

export const dynamic = "force-static";

export async function generateStaticParams() {
  const novels = await getNovels();
  return novels.map((n) => ({ slug: n.slug }));
}

export default async function NovelPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const novel = await getNovel(slug);
  if (!novel) notFound();
  const chapters = await getChapterList(slug);

  return (
    <div>
      <Link href="/" className="text-sm text-neutral-400 hover:text-neutral-200">
        ← Library
      </Link>

      <h1 className="text-2xl font-bold mt-4 leading-snug">{novel.title}</h1>
      {novel.originalTitle ? (
        <p className="text-neutral-500 mt-1">{novel.originalTitle}</p>
      ) : null}
      <p className="text-neutral-400 text-sm mt-3">{chapters.length} chapters</p>

      {chapters.length > 0 ? (
        <div className="mt-6 flex gap-3">
          <Link
            href={`/novels/${slug}/${chapters[0].num}`}
            className="rounded-md bg-neutral-100 text-neutral-900 px-4 py-2 text-sm font-medium hover:bg-white"
          >
            Start reading
          </Link>
        </div>
      ) : null}

      <ul className="mt-8 grid gap-1 sm:grid-cols-2">
        {chapters.map((c) => (
          <li key={c.id}>
            <Link
              href={`/novels/${slug}/${c.num}`}
              className="block rounded-md px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-900 hover:text-white"
            >
              {c.title}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
