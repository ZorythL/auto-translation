import { promises as fs } from "node:fs";
import path from "node:path";

const CONTENT_DIR = path.join(process.cwd(), "content", "novels");

export type NovelMeta = {
  slug: string;
  title: string;
  originalTitle?: string;
  author?: string;
  source?: string;
  chapterCount: number;
};

export type ChapterRef = {
  num: number; // 1-based chapter number
  id: string; // zero-padded, e.g. "013"
  title: string; // e.g. "Chapter 13"
};

export type ChapterContent = {
  num: number;
  id: string;
  title: string;
  englishParagraphs: string[];
  chineseParagraphs: string[];
  hasEnglish: boolean;
  hasChinese: boolean;
};

function pad(n: number): string {
  return String(n).padStart(3, "0");
}

async function readDirSafe(dir: string): Promise<string[]> {
  try {
    return await fs.readdir(dir);
  } catch {
    return [];
  }
}

/** All chapter numbers present for a novel (union of english + chinese). */
async function chapterNumbers(slug: string): Promise<number[]> {
  const base = path.join(CONTENT_DIR, slug);
  const en = await readDirSafe(path.join(base, "english"));
  const cn = await readDirSafe(path.join(base, "chapters"));
  const nums = new Set<number>();
  for (const f of [...en, ...cn]) {
    const m = /^(\d+)\.txt$/i.exec(f);
    if (m) nums.add(parseInt(m[1], 10));
  }
  return [...nums].sort((a, b) => a - b);
}

export async function getNovels(): Promise<NovelMeta[]> {
  const slugs = await readDirSafe(CONTENT_DIR);
  const novels: NovelMeta[] = [];
  for (const slug of slugs) {
    const metaPath = path.join(CONTENT_DIR, slug, "meta.json");
    try {
      const raw = await fs.readFile(metaPath, "utf8");
      const meta = JSON.parse(raw) as NovelMeta;
      meta.slug = slug;
      novels.push(meta);
    } catch {
      // skip folders without a valid meta.json
    }
  }
  return novels.sort((a, b) => a.title.localeCompare(b.title));
}

export async function getNovel(slug: string): Promise<NovelMeta | null> {
  try {
    const raw = await fs.readFile(path.join(CONTENT_DIR, slug, "meta.json"), "utf8");
    const meta = JSON.parse(raw) as NovelMeta;
    meta.slug = slug;
    return meta;
  } catch {
    return null;
  }
}

export async function getChapterList(slug: string): Promise<ChapterRef[]> {
  const nums = await chapterNumbers(slug);
  return nums.map((num) => ({
    num,
    id: pad(num),
    title: `Chapter ${num}`,
  }));
}

/** Split raw file text into paragraphs on blank lines, trimming each. */
function toParagraphs(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** English files: first line is "Chapter N", then prose. Drop the heading line. */
function parseEnglish(text: string): string[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/^\s*Chapter\s+\d+\s*\n/i, "");
  return toParagraphs(normalized);
}

/** Chinese source files: first two lines are metadata (title + URL). Drop them. */
function parseChinese(text: string): string[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  // Drop the leading title line and URL line, plus any blank lines after.
  let start = 0;
  if (lines[start] !== undefined) start++; // title line
  if (lines[start] !== undefined && /^https?:\/\//.test(lines[start].trim())) start++;
  const body = lines.slice(start).join("\n");
  return toParagraphs(body);
}

export async function getChapter(slug: string, num: number): Promise<ChapterContent | null> {
  const id = pad(num);
  const base = path.join(CONTENT_DIR, slug);
  let english = "";
  let chinese = "";
  try {
    english = await fs.readFile(path.join(base, "english", `${id}.txt`), "utf8");
  } catch {
    /* no english yet */
  }
  try {
    chinese = await fs.readFile(path.join(base, "chapters", `${id}.txt`), "utf8");
  } catch {
    /* no chinese */
  }
  if (!english && !chinese) return null;
  return {
    num,
    id,
    title: `Chapter ${num}`,
    englishParagraphs: english ? parseEnglish(english) : [],
    chineseParagraphs: chinese ? parseChinese(chinese) : [],
    hasEnglish: Boolean(english),
    hasChinese: Boolean(chinese),
  };
}
