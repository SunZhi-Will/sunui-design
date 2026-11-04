"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState, type ReactNode } from "react";

import { StoryPlayer, storyIcons } from "./story-player";

// 固定的偽隨機，避免 SSR 與瀏覽器算出不同位置
const rand = (i: number) => {
  const x = Math.sin(i * 9301 + 49297) * 233280;
  return x - Math.floor(x);
};

const formatNumber = (num: number) => {
  if (num >= 1_000_000) return `${(num / 1_000_000) % 1 === 0 ? (num / 1_000_000).toFixed(0) : (num / 1_000_000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000) % 1 === 0 ? (num / 1000).toFixed(0) : (num / 1000).toFixed(1)}K`;
  return String(num);
};

// 依數值分級的背景色系（原本的 getBackground）
const tier = (v: number, steps: [number, number, number]) =>
  v < steps[0]
    ? "from-slate-950/40 via-gray-950/30 to-zinc-950/40"
    : v < steps[1]
      ? "from-blue-950/40 via-indigo-950/30 to-purple-950/40"
      : v < steps[2]
        ? "from-purple-950/40 via-pink-950/30 to-rose-950/40"
        : "from-orange-950/40 via-red-950/30 to-pink-950/40";

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
            Hi, @mei.writes
          </p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.5 }} className="text-xl text-white/90">
            Remember your 2026?
          </motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.5 }} className="mt-4 text-lg text-white/80">
            Here is your year on Threads.
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}

function ViewsSlide({ views }: { views: number }) {
  const loop = useLoop();
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
        <Title>Total views</Title>
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
            {formatNumber(views)}
          </motion.div>
          <div className="relative z-10 text-3xl text-white/90">views</div>
        </motion.div>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="text-lg text-white/80">
          People really are watching.
        </motion.p>
      </div>
    </div>
  );
}

function StreakSlide({ streak }: { streak: number }) {
  const loop = useLoop();
  return (
    <div className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br ${tier(streak, [3, 7, 14])} p-6`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="h-72 w-72 rounded-full border-4 border-white/20"
          animate={{ scale: [1, 1.3, 1], rotate: [0, 180, 360] }}
          transition={loop({ duration: 4, repeat: Infinity, ease: "easeInOut" })}
        />
      </div>
      {/* 火焰粒子 */}
      <div className="absolute inset-0">
        {Array.from({ length: 15 }, (_, i) => (
          <motion.div
            key={i}
            className="absolute h-3 w-3 rounded-full"
            style={{
              background: `radial-gradient(circle, rgba(255, ${100 + i * 10}, 0, 0.8), transparent)`,
              left: `${50 + (rand(i) - 0.5) * 20}%`,
              bottom: `${20 + rand(i + 40) * 30}%`,
            }}
            animate={{ y: [0, -100, -200], x: [(rand(i + 1) - 0.5) * 50, (rand(i + 2) - 0.5) * 100, (rand(i + 3) - 0.5) * 150], opacity: [0, 1, 0], scale: [0.5, 1.5, 0] }}
            transition={loop({ duration: rand(i + 4) * 2 + 2, repeat: Infinity, delay: rand(i + 5) * 2, ease: "easeOut" })}
          />
        ))}
      </div>
      <div className="relative z-10 w-full text-center">
        <Title>Longest streak</Title>
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
          days in a row
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1 }}
          className="inline-block rounded-xl border border-white/20 bg-white/10 px-6 py-4 backdrop-blur-md"
        >
          <p className="text-lg font-medium text-white">That is real commitment.</p>
        </motion.div>
      </div>
    </div>
  );
}

const outroCards = [
  { label: "Posts", value: "312", unit: "posts", gradient: "from-purple-500/20 via-pink-500/15 to-rose-500/20", text: "from-purple-300 to-pink-300" },
  { label: "Likes", value: formatNumber(18400), unit: "likes", gradient: "from-red-500/20 via-pink-500/15 to-rose-500/20", text: "from-red-300 to-pink-300" },
  { label: "Replies", value: formatNumber(2310), unit: "replies", gradient: "from-cyan-500/20 via-blue-500/15 to-indigo-500/20", text: "from-cyan-300 to-blue-300" },
  { label: "Views", value: formatNumber(1_240_000), unit: "views", gradient: "from-emerald-500/20 via-teal-500/15 to-cyan-500/20", text: "from-emerald-300 to-teal-300" },
  { label: "Most active", value: "Night", unit: "", gradient: "from-blue-500/20 via-cyan-500/15 to-teal-500/20", text: "from-blue-300 to-cyan-300" },
  { label: "Streak", value: "21", unit: "days", gradient: "from-orange-500/20 via-amber-500/15 to-yellow-500/20", text: "from-orange-300 to-amber-300" },
];

function OutroSlide() {
  const loop = useLoop();
  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950/30 to-slate-950 p-4 pb-16 md:p-6 md:pb-16">
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-purple-500/10 blur-3xl"
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2], x: [0, 50, 0], y: [0, 30, 0] }}
          transition={loop({ duration: 8, repeat: Infinity, ease: "easeInOut" })}
        />
      </div>
      <div className="relative z-10 flex w-full min-w-0 flex-1 flex-col items-center justify-center px-1">
        <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.6 }} className="mb-3 text-xl font-bold text-white drop-shadow-lg">
          Your 2026 on Threads
        </motion.h2>
        <div className="mb-5 inline-flex items-center rounded-full border border-white/20 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-rose-500/20 px-3 py-1.5 backdrop-blur-sm">
          <p
            className="text-lg font-bold"
            style={{ background: "linear-gradient(135deg, #ffffff 0%, #e0e7ff 50%, #fce7f3 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
          >
            @mei.writes
          </p>
        </div>
        <div className="grid w-full min-w-0 grid-cols-2 gap-2 text-left md:gap-3">
          {outroCards.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.05, duration: 0.5, type: "spring", stiffness: 100 }}
              className={`relative w-full min-w-0 overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br ${c.gradient} p-2.5 shadow-lg backdrop-blur-md md:p-3`}
            >
              <div className="mb-2.5 truncate text-xs leading-tight font-medium text-white/70 md:text-sm">{c.label}</div>
              <div className="flex min-w-0 items-baseline gap-1">
                <div className={`bg-gradient-to-r ${c.text} bg-clip-text text-xl leading-tight font-bold whitespace-nowrap text-transparent`}>{c.value}</div>
                {c.unit && <div className={`bg-gradient-to-r ${c.text} bg-clip-text text-sm whitespace-nowrap text-transparent opacity-80`}>{c.unit}</div>}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function StoryPlayerDemo() {
  const [downloading, setDownloading] = useState(false);
  const [index, setIndex] = useState(0);

  const slides = [<IntroSlide key="intro" />, <ViewsSlide key="views" views={48200} />, <StreakSlide key="streak" streak={21} />, <OutroSlide key="outro" />];

  return (
    <StoryPlayer
      slides={slides}
      index={index}
      onIndexChange={setIndex}
      cardWidth={360}
      className="rounded-2xl"
      labels={{ region: "Your 2026 recap" }}
      actions={[
        {
          key: "download",
          label: "Download summary",
          loadingLabel: "Saving image...",
          icon: storyIcons.download,
          loading: downloading,
          onClick: () => {
            setDownloading(true);
            setTimeout(() => setDownloading(false), 1600);
          },
        },
        { key: "share", label: "Share to Threads", icon: storyIcons.share, onClick: () => {} },
        { key: "replay", label: "Watch again", icon: storyIcons.replay, onClick: () => setIndex(0) },
      ]}
    />
  );
}
