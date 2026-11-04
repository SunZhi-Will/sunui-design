import { useId, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type SeededCoverAspect = "book" | "square" | "wide";

export interface SeededCoverProps {
  /** 決定色相與紋理；同一個 seed 永遠得到同一張封面 */
  seed: string;
  title: string;
  subtitle?: ReactNode;
  aspect?: SeededCoverAspect;
  /** 直排標題；不指定時中文標題配直式封面自動直排 */
  vertical?: boolean;
  /** 角落小標籤，例如「Sample」 */
  label?: ReactNode;
  className?: string;
}

const aspectClass: Record<SeededCoverAspect, string> = {
  book: "aspect-[2/3]",
  square: "aspect-square",
  wide: "aspect-video",
};

const cjk = /[㐀-鿿豈-﫿]/;

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

type Pattern = "lines" | "dots" | "grid" | "plain";
const patterns: Pattern[] = ["lines", "dots", "grid", "plain"];

/** 紋理用 SVG pattern 畫單色細線或點，不用漸層 */
function Texture({ kind, id }: { kind: Pattern; id: string }) {
  if (kind === "plain") return null;
  return (
    <svg aria-hidden="true" className="absolute inset-0 size-full opacity-[0.14]" preserveAspectRatio="none">
      <defs>
        <pattern id={id} width={kind === "dots" ? 10 : 8} height={kind === "dots" ? 10 : 8} patternUnits="userSpaceOnUse">
          {kind === "lines" && <path d="M0 8 8 0" stroke="currentColor" strokeWidth="0.75" />}
          {kind === "dots" && <circle cx="2" cy="2" r="0.9" fill="currentColor" />}
          {kind === "grid" && <path d="M8 0V8M0 8H8" stroke="currentColor" strokeWidth="0.5" fill="none" />}
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}

export function SeededCover({ seed, title, subtitle, aspect = "book", vertical, label, className }: SeededCoverProps) {
  const patternId = useId().replace(/:/g, "");
  const h = hash(seed);
  const hue = h % 360;
  const kind = patterns[(h >>> 9) % patterns.length];
  const isCjk = cjk.test(title);
  const upright = vertical ?? (isCjk && aspect === "book");

  return (
    <div
      role="img"
      aria-label={typeof subtitle === "string" ? `${title}, ${subtitle}` : title}
      style={{ "--h": hue } as CSSProperties}
      className={cn(
        "relative w-full overflow-hidden rounded-md border [container-type:inline-size]",
        // 紙色混入少量色相：亮色為淡色紙，暗色為深色紙
        "border-[hsl(var(--h)_18%_84%)] bg-[hsl(var(--h)_32%_92%)] text-[hsl(var(--h)_32%_22%)]",
        "dark:border-[hsl(var(--h)_10%_26%)] dark:bg-[hsl(var(--h)_14%_17%)] dark:text-[hsl(var(--h)_30%_84%)]",
        aspectClass[aspect],
        className,
      )}
    >
      <Texture kind={kind} id={`sc-${patternId}`} />

      {label && (
        <span className="absolute top-2 left-2 rounded-[3px] border border-current/30 px-1.5 py-0.5 font-mono text-[10px] tracking-[0.14em] uppercase opacity-80">
          {label}
        </span>
      )}

      {upright ? (
        <div className="absolute inset-0 flex flex-row-reverse items-start gap-2 p-[9%] pt-[12%]">
          <p
            className="font-serif leading-tight font-semibold tracking-[0.12em] [writing-mode:vertical-rl]"
            // 依封面寬度縮放字級
            style={{ fontSize: "clamp(1rem, 13cqi, 2.25rem)" }}
          >
            {title}
          </p>
          {subtitle && <p className="text-[11px] tracking-[0.2em] opacity-70 [writing-mode:vertical-rl]">{subtitle}</p>}
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col justify-end gap-1 p-[8%]">
          <span aria-hidden="true" className="mb-2 h-px w-8 bg-current opacity-50" />
          <p className="line-clamp-3 font-serif text-lg leading-snug font-semibold tracking-tight [overflow-wrap:anywhere] sm:text-xl">
            {title}
          </p>
          {subtitle && <p className="truncate text-xs opacity-70">{subtitle}</p>}
        </div>
      )}
    </div>
  );
}
