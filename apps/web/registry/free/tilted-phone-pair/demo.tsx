"use client";

import { useDemoText } from "@/lib/demo-locale";

import { TiltedPhonePair } from "./tilted-phone-pair";

const ACCENT = "#d4a24c";

const copy = {
  en: {
    week: "This week",
    done: "3 of 4 runs",
    runs: [
      ["Tue", "Easy 6 km"],
      ["Thu", "Tempo 8 km"],
      ["Sat", "Long run 14 km"],
    ],
    live: "Live run",
    recording: "Recording",
    pace: "Pace",
    distance: "Distance",
    label: "Stride Log weekly plan and live run screen on two phones",
    callout: "Coach Lena: easy 6 km today. Keep your heart rate under 150 and finish with four strides.",
  },
  "zh-TW": {
    week: "本週",
    done: "已完成 3 / 4 次",
    runs: [
      ["週二", "輕鬆跑 6 公里"],
      ["週四", "節奏跑 8 公里"],
      ["週六", "長距離 14 公里"],
    ],
    live: "跑步中",
    recording: "記錄中",
    pace: "配速",
    distance: "距離",
    label: "兩支手機上的 Stride Log 每週課表與跑步即時畫面",
    callout: "教練 Lena：今天輕鬆跑 6 公里，心率保持在 150 以下，最後加四趟加速跑。",
  },
  "zh-CN": {
    week: "本周",
    done: "已完成 3 / 4 次",
    runs: [
      ["周二", "轻松跑 6 公里"],
      ["周四", "节奏跑 8 公里"],
      ["周六", "长距离 14 公里"],
    ],
    live: "跑步中",
    recording: "记录中",
    pace: "配速",
    distance: "距离",
    label: "两部手机上的 Stride Log 每周课表与跑步实时画面",
    callout: "教练 Lena：今天轻松跑 6 公里，心率保持在 150 以下，最后加四组加速跑。",
  },
  ja: {
    week: "今週",
    done: "4 回中 3 回完了",
    runs: [
      ["火", "ジョグ 6 km"],
      ["木", "テンポ走 8 km"],
      ["土", "ロング走 14 km"],
    ],
    live: "ラン計測中",
    recording: "記録中",
    pace: "ペース",
    distance: "距離",
    label: "2台のスマートフォンに映る Stride Log の週間メニューとラン画面",
    callout: "コーチ Lena：今日はジョグ 6 km。心拍は 150 以下で、最後に流しを 4 本。",
  },
};

type Copy = (typeof copy)["en"];

// 後方手機：本週課表
function PlanScreen({ t }: { t: Copy }) {
  return (
    <div className="pt-6">
      <div className="mb-3 flex items-baseline justify-between border-b border-white/[0.08] px-1 pb-2">
        <span className="font-serif text-[18px] text-[#f5f5f4]">{t.week}</span>
        <span className="text-[10px] tabular-nums text-[#a8a29e]">{t.done}</span>
      </div>
      <div className="space-y-2">
        {t.runs.map(([day, run], idx) => (
          <div key={day} className="rounded-lg border border-white/[0.08] bg-[#161412] p-2.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#a8a29e]">{day}</span>
              <span className="text-[#e7e5e4]">{run}</span>
            </div>
            <div className="mt-2 h-1 rounded-full bg-white/[0.08]">
              <div className="h-full rounded-full" style={{ width: idx < 2 ? "100%" : "0%", background: idx < 2 ? "#a8a29e" : undefined }} />
            </div>
          </div>
        ))}
        <div className="h-16 rounded-lg border border-dashed border-white/[0.08]" />
      </div>
    </div>
  );
}

// 前方手機：跑步即時畫面
function LiveScreen({ t }: { t: Copy }) {
  return (
    <div className="pt-5">
      <div className="mb-3 flex items-center justify-between px-1 text-[10px] text-[#a8a29e]">
        <span>{t.live}</span>
        <span className="flex items-center gap-1.5 rounded-full border border-white/[0.08] px-2 py-0.5 text-[#d6d3d1]">
          <span className="size-1.5 rounded-full" style={{ background: ACCENT }} />
          {t.recording}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2 px-1">
        <div>
          <div className="text-[9px] uppercase tracking-[0.14em] text-[#a8a29e]">{t.distance}</div>
          <div className="font-serif text-[26px] leading-tight tabular-nums lining-nums text-[#f5f5f4]">3.84</div>
        </div>
        <div>
          <div className="text-[9px] uppercase tracking-[0.14em] text-[#a8a29e]">{t.pace}</div>
          <div className="font-serif text-[26px] leading-tight tabular-nums lining-nums text-[#f5f5f4]">5:12</div>
        </div>
      </div>
      {/* 路線示意：中性底加一條強調色的路徑 */}
      <svg viewBox="0 0 100 60" className="mt-3 h-28 w-full rounded-lg border border-white/[0.08] bg-[#161412]" aria-hidden>
        <path d="M0 40 H100 M0 20 H100 M30 0 V60 M70 0 V60" stroke="rgb(255 255 255 / 0.06)" strokeWidth="0.6" />
        <path d="M12 48 C24 30 36 44 48 28 S72 14 86 18" fill="none" stroke={ACCENT} strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="86" cy="18" r="2.2" fill="#f5f5f4" />
      </svg>
    </div>
  );
}

export default function TiltedPhonePairDemo() {
  const t = useDemoText(copy);
  return (
    <section className="relative isolate w-full max-w-2xl min-w-0 overflow-hidden rounded-3xl bg-[#0c0a09] px-4 py-8 sm:px-8">
      <TiltedPhonePair label={t.label} callout={t.callout} backScreen={<PlanScreen t={t} />} frontScreen={<LiveScreen t={t} />} />
    </section>
  );
}
