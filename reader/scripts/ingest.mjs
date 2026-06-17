#!/usr/bin/env node
// Ingest a scraped novel (Chinese source + English translation) into the reader's
// content store: reader/content/novels/<slug>/{chapters,english}/NNN.txt + meta.json
//
// Usage:
//   node scripts/ingest.mjs --slug real-heiress \
//        --title "Returning to Before the Real Heiress Was Reclaimed" \
//        --cn ../chapters --en ../english-chapters \
//        [--original "重回真千金認親前[年代]"] [--author "Unknown"] [--source "https://..."]
//
// Re-running with the same slug refreshes that novel's files (safe to repeat after new chapters).

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const READER_ROOT = path.resolve(__dirname, "..");

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : "true";
      args[key] = val;
    }
  }
  return args;
}

async function listChapterFiles(dir) {
  let entries;
  try {
    entries = await fs.readdir(dir);
  } catch {
    return [];
  }
  return entries
    .filter((f) => /^\d+\.txt$/i.test(f))
    .sort((a, b) => parseInt(a) - parseInt(b));
}

async function copyChapters(srcDir, destDir) {
  await fs.mkdir(destDir, { recursive: true });
  const files = await listChapterFiles(srcDir);
  for (const f of files) {
    const num = String(parseInt(f, 10)).padStart(3, "0");
    await fs.copyFile(path.join(srcDir, f), path.join(destDir, `${num}.txt`));
  }
  return files.length;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const slug = args.slug;
  const title = args.title;
  if (!slug || !title) {
    console.error("Required: --slug <slug> --title <title> --cn <dir> --en <dir>");
    process.exit(1);
  }
  const cnSrc = args.cn ? path.resolve(process.cwd(), args.cn) : null;
  const enSrc = args.en ? path.resolve(process.cwd(), args.en) : null;

  const novelDir = path.join(READER_ROOT, "content", "novels", slug);
  await fs.mkdir(novelDir, { recursive: true });

  let cnCount = 0;
  let enCount = 0;
  if (cnSrc) cnCount = await copyChapters(cnSrc, path.join(novelDir, "chapters"));
  if (enSrc) enCount = await copyChapters(enSrc, path.join(novelDir, "english"));

  const meta = {
    slug,
    title,
    originalTitle: args.original || "",
    author: args.author || "Unknown",
    source: args.source || "",
    chapterCount: Math.max(cnCount, enCount),
  };
  await fs.writeFile(
    path.join(novelDir, "meta.json"),
    JSON.stringify(meta, null, 2) + "\n",
    "utf8"
  );

  console.log(`Ingested "${title}" (${slug}): ${cnCount} CN, ${enCount} EN chapters → ${novelDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
