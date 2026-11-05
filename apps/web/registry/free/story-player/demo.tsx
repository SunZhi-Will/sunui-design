"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState, type ReactNode } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { StoryPlayer, storyIcons } from "./story-player";

const copy = {
  en: {
    hi: "Hi, @mei.writes",
    remember: "Remember your 2026?",
    year: "Here is your year on Threads.",
    views: "Total views",
    viewsUnit: "views",
    watching: "People really are watching.",
    streak: "Longest streak",
    days: "days in a row",
    commitment: "That is real commitment.",
    region: "Your 2026 recap",
    download: "Download summary",
    saving: "Saving image...",
    share: "Share to Threads",
    replay: "Watch again",
  },
  "zh-TW": {
    hi: "嗨，@mei.writes",
    remember: "還記得你的 2026 嗎？",
    year: "這是你在 Threads 的一年。",
    views: "總瀏覽次數",
    viewsUnit: "次瀏覽",
    watching: "真的有很多人在看。",
    streak: "最長連續天數",
    days: "天連續發文",
    commitment: "這才叫堅持。",
    region: "你的 2026 回顧",
    download: "下載回顧圖",
    saving: "正在儲存圖片...",
    share: "分享到 Threads",
    replay: "再看一次",
  },
  "zh-CN": {
    hi: "嗨，@mei.writes",
    remember: "还记得你的 2026 吗？",
    year: "这是你在 Threads 的一年。",
    views: "总浏览量",
    viewsUnit: "次浏览",
    watching: "真的有很多人在看。",
    streak: "最长连续天数",
    days: "天连续发帖",
    commitment: "这才叫坚持。",
    region: "你的 2026 年度回顾",
    download: "下载回顾图",
    saving: "正在保存图片...",
    share: "分享到 Threads",
    replay: "再看一遍",
  },
  ja: {
    hi: "こんにちは、@mei.writes",
    remember: "2026年を覚えていますか？",
    year: "あなたの Threads での1年です。",
    views: "総閲覧数",
    viewsUnit: "回閲覧",
    watching: "たくさんの人が見ています。",
    streak: "最長連続記録",
    days: "日連続",
    commitment: "本物の継続力です。",
    region: "あなたの2026年まとめ",
    download: "まとめをダウンロード",
    saving: "画像を保存中...",
    share: "Threads でシェア",
    replay: "もう一度見る",
  },
};

// 進場只做一次淡入上移；reduced motion 直接顯示最終畫面
function useEnter() {
  const reduce = useReducedMotion() ?? false;
  return (delay = 0) =>
    reduce
      ? { initial: false as const }
      : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.36, ease: [0.23, 1, 0.32, 1] as const } };
}

function Eyebrow({ children }: { children: ReactNode }) {
  const enter = useEnter();
  return (
    <motion.p {...enter(0)} className="mb-5 text-[11px] font-medium tracking-[0.14em] text-white/50 uppercase">
      {children}
    </motion.p>
  );
}

function Slide({ children }: { children: ReactNode }) {
  return <div className="relative flex h-full w-full flex-col justify-center bg-[#0f0f0f] p-7">{children}</div>;
}

function IntroSlide() {
  const enter = useEnter();
  const t = useDemoText(copy);
  return (
    <Slide>
      <motion.div {...enter(0)} className="mb-8 flex size-16 items-center justify-center rounded-full bg-[#3a3531] text-2xl font-semibold text-white/90">
        M
      </motion.div>
      <motion.p {...enter(0.12)} className="mb-3 text-2xl leading-tight font-semibold text-white">
        {t.hi}
      </motion.p>
      <motion.p {...enter(0.24)} className="text-lg text-white/80">
        {t.remember}
      </motion.p>
      <motion.p {...enter(0.36)} className="mt-2 text-base text-white/55">
        {t.year}
      </motion.p>
    </Slide>
  );
}

// 每月瀏覽數（千），只用白色的深淺
const MONTHS = [1.2, 1.8, 2.4, 2.1, 3.0, 3.6, 4.2, 3.9, 4.8, 5.4, 6.1, 9.7];

function ViewsSlide({ views }: { views: string }) {
  const enter = useEnter();
  const t = useDemoText(copy);
  const max = Math.max(...MONTHS);
  return (
    <Slide>
      <Eyebrow>{t.views}</Eyebrow>
      <motion.div {...enter(0.12)} className="text-6xl font-semibold text-white tabular-nums sm:text-7xl">
        {views}
      </motion.div>
      <motion.div {...enter(0.2)} className="mt-1 text-lg text-white/60">
        {t.viewsUnit}
      </motion.div>
      <motion.div {...enter(0.32)} aria-hidden className="mt-8 flex h-20 items-end gap-1">
        {MONTHS.map((v, i) => (
          <span key={i} className="min-w-0 flex-1 rounded-sm" style={{ height: `${(v / max) * 100}%`, background: i === MONTHS.length - 1 ? "#fff" : "rgba(255,255,255,0.22)" }} />
        ))}
      </motion.div>
      <motion.p {...enter(0.44)} className="mt-6 text-base text-white/70">
        {t.watching}
      </motion.p>
    </Slide>
  );
}

function StreakSlide({ streak }: { streak: number }) {
  const enter = useEnter();
  const t = useDemoText(copy);
  return (
    <Slide>
      <Eyebrow>{t.streak}</Eyebrow>
      <motion.div {...enter(0.12)} className="flex items-baseline gap-3">
        <span className="text-7xl font-semibold text-white tabular-nums sm:text-8xl">{streak}</span>
        <span className="text-lg text-white/60">{t.days}</span>
      </motion.div>
      {/* 連續的天數畫成一格一格，比光暈更能說明「連續」 */}
      <motion.div {...enter(0.24)} aria-hidden className="mt-8 grid max-w-[13rem] grid-cols-7 gap-1">
        {Array.from({ length: 28 }, (_, i) => (
          <span key={i} className="aspect-square rounded-[3px]" style={{ background: i >= 4 && i < 4 + streak ? "rgba(255,255,255,0.86)" : "rgba(255,255,255,0.1)" }} />
        ))}
      </motion.div>
      <motion.p {...enter(0.4)} className="mt-6 border-l-2 border-white/30 pl-3 text-base text-white/80">
        {t.commitment}
      </motion.p>
    </Slide>
  );
}

export default function StoryPlayerDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [downloading, setDownloading] = useState(false);
  const [index, setIndex] = useState(0);

  const slides = [<IntroSlide key="intro" />, <ViewsSlide key="views" views="48.2K" />, <StreakSlide key="streak" streak={21} />];

  return (
    <StoryPlayer
      slides={slides}
      index={index}
      onIndexChange={setIndex}
      cardWidth={360}
      className="rounded-xl"
      locale={locale}
      labels={{ region: t.region }}
      actions={[
        {
          key: "download",
          label: t.download,
          loadingLabel: t.saving,
          icon: storyIcons.download,
          loading: downloading,
          onClick: () => {
            setDownloading(true);
            setTimeout(() => setDownloading(false), 1600);
          },
        },
        { key: "share", label: t.share, icon: storyIcons.share, onClick: () => {} },
        { key: "replay", label: t.replay, icon: storyIcons.replay, onClick: () => setIndex(0) },
      ]}
    />
  );
}
