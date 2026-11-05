"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { YouTubeCard } from "./youtube-card";

// 內嵌 SVG 縮圖，展示時不向 YouTube 載入任何東西；點擊播放後才嵌入
function TalkThumbnail() {
  return (
    <svg viewBox="0 0 480 270" className="h-full w-full" aria-hidden preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="yt-demo-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0f172a" />
          <stop offset="1" stopColor="#334155" />
        </linearGradient>
      </defs>
      <rect width="480" height="270" fill="url(#yt-demo-bg)" />
      <rect x="36" y="40" width="200" height="130" rx="10" fill="#f8fafc" opacity=".92" />
      <rect x="52" y="58" width="90" height="56" rx="6" fill="#fde68a" />
      <rect x="150" y="58" width="70" height="26" rx="6" fill="#bfdbfe" />
      <rect x="150" y="90" width="70" height="24" rx="6" fill="#fbcfe8" />
      <rect x="52" y="124" width="168" height="10" rx="5" fill="#cbd5e1" />
      <rect x="52" y="142" width="120" height="10" rx="5" fill="#e2e8f0" />
      <path d="M236 105 C290 80 300 150 352 128" stroke="#94a3b8" strokeWidth="3" fill="none" strokeDasharray="6 6" />
      <rect x="300" y="150" width="140" height="80" rx="10" fill="#f8fafc" opacity=".85" />
      <rect x="316" y="166" width="108" height="10" rx="5" fill="#a5b4fc" />
      <rect x="316" y="184" width="80" height="10" rx="5" fill="#cbd5e1" />
      <rect x="36" y="218" width="230" height="14" rx="7" fill="#f8fafc" opacity=".8" />
      <rect x="408" y="238" width="44" height="18" rx="4" fill="#000" opacity=".75" />
      <text x="430" y="251" textAnchor="middle" fontSize="11" fontFamily="system-ui, sans-serif" fill="#fff">
        18:42
      </text>
    </svg>
  );
}

const titles = {
  en: "Visual thinking on an infinite canvas (conference talk)",
  "zh-TW": "在無限畫布上視覺化思考（研討會演講）",
  "zh-CN": "在无限画布上进行可视化思考（大会演讲）",
  ja: "無限キャンバスでのビジュアル思考（カンファレンス講演）",
};

export default function YouTubeCardDemo() {
  const locale = useDemoLocale();
  const title = useDemoText(titles);
  return (
    <div className="w-full max-w-xl min-w-0 rounded-xl bg-[#f3f4f6] p-4 sm:p-6">
      <div className="aspect-[16/10] w-full">
        <YouTubeCard
          videoId="https://www.youtube.com/watch?v=M7lc1UVf-VE"
          locale={locale}
          title={title}
          thumbnail={<TalkThumbnail />}
        />
      </div>
    </div>
  );
}
