"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";

import { EASE_SITE } from "@/lib/motion";
import { cn } from "@/lib/utils";

/*
 * 首頁的帶狀型錄（2026-11-22，照 Scrolltide 首頁的公式）：
 * 等寬眉標帶數字 → 左標題右說明 → 篩選膠囊 → 三欄 16:10 卡片 → 「看全部」。
 * 卡片圖是 public/cards/<name>.jpg（淺色分享圖逐張取景裁的，見 scripts/crop-cards.mjs 與 content/home-cards.json）。
 * 由來與並排比較：reports/Scrolltide競品深度分析與完整規劃-2026-11-22.md。
 */

export type BandCard = { name: string; title: string; kind: string; pro: boolean; av1?: boolean };

export function CatalogBand({
  id,
  eyebrow,
  title,
  sub,
  cards,
  kinds,
  copy,
  more,
  extra,
}: {
  id: string;
  eyebrow: string;
  title: ReactNode;
  sub: string;
  cards: BandCard[];
  /** 篩選膠囊的文字，key 是卡片的 kind；只出現有卡片的那幾種 */
  kinds: Record<string, string>;
  copy: { all: string; preview: string; pro: string; free: string; filter: string };
  more: { href: string; label: string };
  /** 「全部」時插在第六格的卡（例如創始會員） */
  extra?: ReactNode;
}) {
  const [kind, setKind] = useState("all");
  const reduce = useReducedMotion();
  // 第一次畫面不做進場，只有按了篩選之後新的一批才淡入
  const [touched, setTouched] = useState(false);
  const present = Object.keys(kinds).filter((k) => cards.some((card) => card.kind === k));
  const shown = kind === "all" ? cards : cards.filter((card) => card.kind === kind);
  const chips = [["all", copy.all], ...present.map((k) => [k, kinds[k]])];

  return (
    <section aria-labelledby={id} className="mt-28 sm:mt-40">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="font-mono text-[11px] tracking-[0.14em] text-subtle uppercase">{eyebrow}</p>
          <h2 id={id} className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-balance sm:text-[40px] sm:leading-[1.1]">
            {title}
          </h2>
        </div>
        <p className="max-w-sm text-[15px] leading-relaxed text-pretty text-subtle lg:text-right">{sub}</p>
      </div>

      <div role="group" aria-label={copy.filter} className="mt-8 flex flex-wrap gap-2">
        {chips.map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={kind === key}
            onClick={() => {
              setKind(key);
              setTouched(true);
            }}
            className={cn(
              "inline-flex h-8 items-center rounded-full px-3.5 text-[13px] transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
              kind === key ? "bg-fg font-medium text-bg" : "text-subtle shadow-[0_0_0_1px_var(--line)] hover:text-fg",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <ul className="mt-8 grid gap-x-5 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((card, i) => (
          <Fragment key={card.name}>
            {kind === "all" && extra && i === 5 && <li>{extra}</li>}
            {/* 換篩選時新的一批淡入、往上 6px，一張接一張；第一次畫面不動 */}
            <motion.li
              key={`${kind}-${card.name}`}
              initial={reduce || !touched ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: EASE_SITE, delay: Math.min(i, 5) * 0.03 }}
            >
              <Card card={card} kindLabel={kinds[card.kind]} copy={copy} />
            </motion.li>
          </Fragment>
        ))}
      </ul>

      <div className="mt-12 flex justify-center">
        <Link href={more.href} className="inline-flex h-11 items-center gap-2 rounded-full px-5 text-[15px] font-medium btn-secondary">
          {more.label}
          <Arrow className="size-4" />
        </Link>
      </div>
    </section>
  );
}

/**
 * 卡片影片（public/cards/<name>.mp4，scripts/record-cards.mjs 錄的）：疊在靜態圖上，捲進畫面才載入與播放，
 * 離開畫面、分頁在背景時暫停。reduced motion 時不放影片，只留靜態圖。影片還沒開始播之前是透明的，看到的是靜態圖。
 */
function CardVideo({ name, av1 }: { name: string; av1?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduce = useReducedMotion();
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const video = ref.current;
    if (!video || reduce) return;
    // 選檔：手機（視窗 640 以下）或開了省流量用 480 寬的版本，省約六成流量，會動的畫面糊一點看不太出來；
    // 桌機三欄和手機一欄的卡片 CSS 寬度差不多（約 360px），所以用視窗寬判斷，不用卡片寬。支援 AV1 就用 AV1（同畫質小三到四成）
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
    const small = saveData || window.matchMedia("(max-width: 639px)").matches;
    const useAv1 = av1 && video.canPlayType('video/mp4; codecs="av01.0.05M.08"') !== "";
    const src = `/cards/${name}${small ? "-480" : ""}${useAv1 ? ".av1" : ""}.mp4`;
    if (video.getAttribute("src") !== src) video.setAttribute("src", src);
    let visible = false;
    let retry = 0;
    const sync = () => {
      window.clearTimeout(retry);
      if (visible && !document.hidden) {
        if (video.preload !== "auto") video.preload = "auto";
        // 瀏覽器有時會拒絕播放（例如分頁剛從背景切回來）：還在畫面裡就一秒後再試
        video.play().catch(() => {
          retry = window.setTimeout(sync, 1000);
        });
      } else video.pause();
    };
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      sync();
    }, { rootMargin: "120px" });
    io.observe(video);
    document.addEventListener("visibilitychange", sync);
    return () => {
      window.clearTimeout(retry);
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [reduce, name, av1]);
  if (reduce) return null;
  return (
    <video
      ref={ref}
      muted
      loop
      playsInline
      preload="none"
      aria-hidden="true"
      onPlaying={() => setReady(true)}
      className={cn(
        "absolute inset-0 size-full object-cover transition-[opacity,scale] duration-700 ease-site group-hover/card:scale-[1.04] motion-reduce:transition-none",
        ready ? "opacity-100" : "opacity-0",
      )}
    />
  );
}

function Card({ card, kindLabel, copy }: { card: BandCard; kindLabel?: string; copy: { preview: string; pro: string; free: string } }) {
  return (
    <Link href={`/blocks/${card.name}`} className="group/card block rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent">
      <span className="relative block aspect-[16/10] overflow-hidden rounded-xl bg-card shadow-e1 transition-shadow duration-200 group-hover/card:shadow-e2">
        <Image
          src={`/cards/${card.name}.jpg`}
          alt=""
          fill
          sizes="(min-width: 1024px) 370px, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-700 ease-site group-hover/card:scale-[1.04] motion-reduce:transition-none"
        />
        <CardVideo name={card.name} av1={card.av1} />
        <span className="absolute bottom-3 left-3 inline-flex h-8 translate-y-1 items-center gap-1.5 rounded-full bg-black/75 px-3 text-[13px] font-medium text-white opacity-0 transition-[opacity,translate] duration-300 ease-site group-hover/card:translate-y-0 group-hover/card:opacity-100 group-focus-visible/card:translate-y-0 group-focus-visible/card:opacity-100">
          {copy.preview}
          <Arrow className="size-3.5" />
        </span>
      </span>
      <span className="mt-3 flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-medium text-fg">{card.title}</span>
          {kindLabel && <span className="mt-0.5 block text-[13px] text-subtle">{kindLabel}</span>}
        </span>
        <span
          className={cn(
            "mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
            card.pro ? "text-accent shadow-[0_0_0_1px_color-mix(in_srgb,var(--accent)_45%,transparent)]" : "text-subtle shadow-[0_0_0_1px_var(--line)]",
          )}
        >
          {card.pro ? copy.pro : copy.free}
        </span>
      </span>
    </Link>
  );
}

function Arrow({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
