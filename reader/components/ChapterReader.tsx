"use client";

import { useEffect, useState } from "react";

type Props = {
  englishParagraphs: string[];
  chineseParagraphs: string[];
  hasEnglish: boolean;
  hasChinese: boolean;
};

type Mode = "en" | "cn" | "both";

const FONT_SIZES = ["text-base", "text-lg", "text-xl", "text-2xl"];

export default function ChapterReader({
  englishParagraphs,
  chineseParagraphs,
  hasEnglish,
  hasChinese,
}: Props) {
  const [mode, setMode] = useState<Mode>(hasEnglish ? "en" : "cn");
  const [fontIdx, setFontIdx] = useState(1);

  // Persist preferences across chapters.
  useEffect(() => {
    const savedMode = localStorage.getItem("reader.mode") as Mode | null;
    const savedFont = localStorage.getItem("reader.font");
    if (savedMode && (savedMode !== "en" || hasEnglish) && (savedMode !== "cn" || hasChinese)) {
      setMode(savedMode);
    }
    if (savedFont) setFontIdx(Math.min(FONT_SIZES.length - 1, Math.max(0, Number(savedFont))));
  }, [hasEnglish, hasChinese]);

  useEffect(() => {
    localStorage.setItem("reader.mode", mode);
  }, [mode]);
  useEffect(() => {
    localStorage.setItem("reader.font", String(fontIdx));
  }, [fontIdx]);

  const fontClass = FONT_SIZES[fontIdx];
  const showEn = mode === "en" || mode === "both";
  const showCn = mode === "cn" || mode === "both";
  const len = Math.max(englishParagraphs.length, chineseParagraphs.length);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-8 border-b border-neutral-800 pb-4">
        <div className="inline-flex rounded-md border border-neutral-700 overflow-hidden text-sm">
          <ModeBtn active={mode === "en"} disabled={!hasEnglish} onClick={() => setMode("en")}>
            English
          </ModeBtn>
          <ModeBtn active={mode === "cn"} disabled={!hasChinese} onClick={() => setMode("cn")}>
            中文
          </ModeBtn>
          <ModeBtn
            active={mode === "both"}
            disabled={!hasEnglish || !hasChinese}
            onClick={() => setMode("both")}
          >
            Both
          </ModeBtn>
        </div>

        <div className="ml-auto inline-flex items-center gap-1 text-sm">
          <button
            onClick={() => setFontIdx((i) => Math.max(0, i - 1))}
            className="rounded border border-neutral-700 px-2 py-1 hover:bg-neutral-800"
            aria-label="Smaller text"
          >
            A−
          </button>
          <button
            onClick={() => setFontIdx((i) => Math.min(FONT_SIZES.length - 1, i + 1))}
            className="rounded border border-neutral-700 px-2 py-1 hover:bg-neutral-800"
            aria-label="Larger text"
          >
            A+
          </button>
        </div>
      </div>

      {mode === "both" ? (
        <div className={`prose-reading font-reading ${fontClass} text-neutral-200`}>
          {Array.from({ length: len }).map((_, i) => (
            <div key={i} className="mb-6">
              {chineseParagraphs[i] ? (
                <p className="text-neutral-400 mb-1">{chineseParagraphs[i]}</p>
              ) : null}
              {englishParagraphs[i] ? <p>{englishParagraphs[i]}</p> : null}
            </div>
          ))}
        </div>
      ) : (
        <div className={`prose-reading font-reading ${fontClass} text-neutral-200`}>
          {showEn &&
            englishParagraphs.map((p, i) => <p key={`e${i}`}>{p}</p>)}
          {showCn &&
            chineseParagraphs.map((p, i) => <p key={`c${i}`}>{p}</p>)}
        </div>
      )}
    </div>
  );
}

function ModeBtn({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={[
        "px-3 py-1.5 transition",
        active ? "bg-neutral-100 text-neutral-900" : "text-neutral-300 hover:bg-neutral-800",
        disabled ? "opacity-30 cursor-not-allowed hover:bg-transparent" : "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}
