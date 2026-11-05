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

function useLoop() {
  const reduce = useReducedMotion() ?? false;
  return (t: object) => (reduce ? { duration: 0 } : t);
}

function Title({ children }: { children: ReactNode }) {
  return (
    <motion.h2 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-6 text-2xl font-bold text-white md:text-3xl">
      {children}
    </motion.h2>
  );
}

function IntroSlide() {
  const loop = useLoop();
  const t = useDemoText(copy);
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-slate-900 via-gray-900 to-black p-6">
      <div className="relative z-10 flex flex-col items-center gap-6">
        <motion.div initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6, ease: "easeOut" }} className="relative">
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 blur-3xl"
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.6, 0.4] }}
            transition={loop({ duration: 3, repeat: Infinity, ease: "easeInOut" })}
          />
          <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-4 border-white bg-gradient-to-br from-indigo-400 to-fuchsia-500 text-5xl font-bold text-white shadow-2xl ring-4 ring-blue-500/20 ring-offset-4 ring-offset-transparent">
            M
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.5 }} className="text-center">
          <p
            className="mb-6 text-3xl leading-tight font-semibold tracking-wide"
            style={{ background: "linear-gradient(135deg, #ffffff 0%, #e2e8f0 50%, #cbd5e1 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
          >
            {t.hi}
          </p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.5 }} className="text-xl text-white/90">
            {t.remember}
          </motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.5 }} className="mt-4 text-lg text-white/80">
            {t.year}
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}

function ViewsSlide({ views }: { views: string }) {
  const loop = useLoop();
  const t = useDemoText(copy);
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-950/50 via-teal-950/40 to-cyan-950/50 p-6">
      {/* 由中心向外的波紋 */}
      <div className="absolute inset-0 flex items-center justify-center">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute h-64 w-64 rounded-full border border-emerald-400/30"
            initial={{ scale: 0, opacity: 0.6 }}
            animate={{ scale: [0, 2.5, 3], opacity: [0.6, 0.3, 0] }}
            transition={loop({ duration: 3, repeat: Infinity, delay: i * 0.8, ease: "easeOut" })}
          />
        ))}
      </div>
      <div className="relative z-10 w-full text-center">
        <Title>{t.views}</Title>
        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.8, type: "spring", bounce: 0.4 }} className="relative mb-8">
          <motion.div
            className="absolute inset-0 rounded-full bg-emerald-400/20 blur-2xl"
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={loop({ duration: 2, repeat: Infinity, ease: "easeInOut" })}
          />
          <motion.div
            className="relative z-10 mb-4 text-7xl font-bold text-white sm:text-8xl"
            animate={{ scale: [1, 1.05, 1] }}
            transition={loop({ duration: 2, repeat: Infinity, ease: "easeInOut" })}
            style={{ textShadow: "0 0 20px rgba(16, 185, 129, 0.5)" }}
          >
            {views}
          </motion.div>
          <div className="relative z-10 text-3xl text-white/90">{t.viewsUnit}</div>
        </motion.div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-lg text-white/80">
          {t.watching}
        </motion.p>
      </div>
    </div>
  );
}

function StreakSlide({ streak }: { streak: number }) {
  const loop = useLoop();
  const t = useDemoText(copy);
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-orange-950/40 via-red-950/30 to-pink-950/40 p-6">
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="h-72 w-72 rounded-full border-4 border-white/20"
          animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
          transition={loop({ duration: 4, repeat: Infinity, ease: "easeInOut" })}
        />
      </div>
      <div className="relative z-10 w-full text-center">
        <Title>{t.streak}</Title>
        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3, duration: 0.8, type: "spring" }} className="relative mb-8 inline-block">
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-400/30 via-red-400/30 to-pink-400/30 blur-3xl"
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={loop({ duration: 2, repeat: Infinity, ease: "easeInOut" })}
          />
          <div className="relative text-8xl font-bold text-white" style={{ textShadow: "0 0 20px rgba(255, 100, 0, 0.8), 0 0 40px rgba(255, 50, 0, 0.6)" }}>
            {streak}
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mb-6 text-2xl font-semibold text-white/90">
          {t.days}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
          className="inline-block rounded-xl border border-white/20 bg-white/10 px-6 py-4 backdrop-blur-md"
        >
          <p className="text-lg font-medium text-white">{t.commitment}</p>
        </motion.div>
      </div>
    </div>
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
      className="rounded-2xl"
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
