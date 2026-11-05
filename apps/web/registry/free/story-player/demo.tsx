"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { RecapActiveMonth, RecapFrame, RecapKeywordCloud, RecapPercentileRing, RecapStreakFlame, recapPalette } from "./recap-slides";
import { StoryPlayer, storyIcons } from "./story-player";

const copy = {
  en: {
    coverTitle: "2026 Wrapped",
    handle: "@mei.writes",
    year: "Your year on Threads",
    tap: "Tap the right side to start",
    outroTitle: "That was your 2026",
    posts: "Posts",
    views: "Views",
    topWord: "Top word",
    thanks: "Thanks for writing with us. See you in 2027.",
    region: "Your 2026 recap",
    download: "Download summary",
    saving: "Saving image...",
    share: "Share to Threads",
    replay: "Watch again",
    words: ["coffee", "design", "Taipei", "cats", "side project", "rain", "ramen", "books"],
  },
  "zh-TW": {
    coverTitle: "2026 年度回顧",
    handle: "@mei.writes",
    year: "你在 Threads 的一年",
    tap: "點右側開始播放",
    outroTitle: "這就是你的 2026",
    posts: "貼文",
    views: "瀏覽",
    topWord: "年度關鍵字",
    thanks: "謝謝你這一年的分享，2027 見。",
    region: "你的 2026 回顧",
    download: "下載回顧圖",
    saving: "正在儲存圖片...",
    share: "分享到 Threads",
    replay: "再看一次",
    words: ["咖啡", "設計", "台北", "貓", "副業專案", "下雨", "拉麵", "讀書"],
  },
  "zh-CN": {
    coverTitle: "2026 年度回顾",
    handle: "@mei.writes",
    year: "你在 Threads 的一年",
    tap: "点右侧开始播放",
    outroTitle: "这就是你的 2026",
    posts: "动态",
    views: "浏览",
    topWord: "年度关键词",
    thanks: "谢谢你这一年的分享，2027 见。",
    region: "你的 2026 年度回顾",
    download: "下载回顾图",
    saving: "正在保存图片...",
    share: "分享到 Threads",
    replay: "再看一遍",
    words: ["咖啡", "设计", "台北", "猫", "副业项目", "下雨", "拉面", "读书"],
  },
  ja: {
    coverTitle: "2026年のまとめ",
    handle: "@mei.writes",
    year: "Threads でのあなたの1年",
    tap: "右側をタップして再生",
    outroTitle: "これがあなたの2026年",
    posts: "投稿",
    views: "閲覧",
    topWord: "トップワード",
    thanks: "1年間ありがとうございました。また2027年に。",
    region: "あなたの2026年まとめ",
    download: "まとめをダウンロード",
    saving: "画像を保存中...",
    share: "Threads でシェア",
    replay: "もう一度見る",
    words: ["コーヒー", "デザイン", "台北", "猫", "個人開発", "雨", "ラーメン", "読書"],
  },
};

// 一年貼文裡最常出現的字，依次數由多到少
const KEYWORD_COUNTS = [64, 52, 41, 33, 24, 17, 11, 8];

type Copy = (typeof copy)["en"];

// 封面：跟回顧投影片共用 RecapFrame，版面一致
function CoverSlide({ t }: { t: Copy }) {
  return (
    <RecapFrame title={t.coverTitle} footer={<p className="text-[15px] text-[#a3a3a3]">{t.tap}</p>}>
      <div className="flex flex-1 flex-col justify-center">
        <div className="mb-6 flex size-12 items-center justify-center rounded-full text-lg font-semibold" style={{ background: recapPalette.surface, color: recapPalette.soft }}>
          M
        </div>
        <p className="text-[15px]" style={{ color: recapPalette.muted }}>
          {t.handle}
        </p>
        <p className="mt-2 font-serif text-4xl leading-[1.08] tracking-[-0.02em]">{t.year}</p>
        <p className="mt-6 font-serif text-8xl leading-none tracking-[-0.03em] tabular-nums lining-nums">2026</p>
        <div className="mt-4 h-px w-12" style={{ background: recapPalette.accent }} />
      </div>
    </RecapFrame>
  );
}

// 結尾：三個數字的總表，最後一張會停比較久，底部出現動作列
function OutroSlide({ t }: { t: Copy }) {
  const rows = [
    { label: t.posts, value: "312" },
    { label: t.views, value: "48.2K" },
    { label: t.topWord, value: t.words[0] },
  ];
  return (
    <RecapFrame title={t.outroTitle} footer={<p className="text-[15px] leading-relaxed text-[#d4d4d4]">{t.thanks}</p>}>
      <dl className="flex flex-1 flex-col justify-center">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-4 border-b py-4" style={{ borderColor: recapPalette.line }}>
            <dt className="text-[15px]" style={{ color: recapPalette.muted }}>
              {r.label}
            </dt>
            <dd className="font-serif text-4xl leading-none tabular-nums lining-nums">{r.value}</dd>
          </div>
        ))}
      </dl>
    </RecapFrame>
  );
}

export default function StoryPlayerDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [downloading, setDownloading] = useState(false);
  const [index, setIndex] = useState(0);

  const keywords = t.words.map((word, i) => ({ word, count: KEYWORD_COUNTS[i] }));

  const slides = [
    <CoverSlide key="cover" t={t} />,
    <RecapActiveMonth key="month" data={{ monthIndex: 9, count: 38 }} locale={locale} />,
    <RecapKeywordCloud key="keywords" keywords={keywords} locale={locale} />,
    <RecapStreakFlame key="streak" streak={21} locale={locale} />,
    <RecapPercentileRing key="rank" percentileRank={3.4} locale={locale} />,
    <OutroSlide key="outro" t={t} />,
  ];

  return (
    <StoryPlayer
      slides={slides}
      index={index}
      onIndexChange={setIndex}
      cardWidth={360}
      // 底部留出動作列的高度，最後兩張的頁尾文字才不會被蓋住
      className="rounded-xl pb-14"
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
