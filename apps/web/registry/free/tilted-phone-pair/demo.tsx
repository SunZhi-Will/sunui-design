"use client";

import { useDemoText } from "@/lib/demo-locale";

import { TiltedPhonePair } from "./tilted-phone-pair";

const copy = {
  en: {
    devices: "Devices (42/50 Online)",
    running: "Running:",
    live: "Live Device Screens",
    active: "Active",
    label: "OpenRing Cloud console and live device screens on two phones",
    callout:
      "Build me a dark-mode fleet cockpit for Android automation with live device status, workflow deployment, and execution logs.",
  },
  "zh-TW": {
    devices: "裝置（42/50 在線）",
    running: "執行中：",
    live: "即時裝置畫面",
    active: "運作中",
    label: "兩支手機上的 OpenRing Cloud 主控台與即時裝置畫面",
    callout: "幫我做一個深色模式的 Android 自動化機群駕駛艙，要有即時裝置狀態、流程部署和執行紀錄。",
  },
  "zh-CN": {
    devices: "设备（42/50 在线）",
    running: "运行中：",
    live: "实时设备画面",
    active: "运行中",
    label: "两部手机上的 OpenRing Cloud 控制台与实时设备画面",
    callout: "帮我做一个深色模式的 Android 自动化设备群控制台，要有实时设备状态、流程部署和执行日志。",
  },
  ja: {
    devices: "デバイス（42/50 オンライン）",
    running: "実行中：",
    live: "ライブ画面",
    active: "稼働中",
    label: "2台のスマートフォンに映る OpenRing Cloud コンソールとライブ画面",
    callout:
      "Android 自動化のためのダークモードのフリート管理画面を作って。デバイスのリアルタイム状態、ワークフローのデプロイ、実行ログ付きで。",
  },
};

type Copy = (typeof copy)["en"];

// 後方手機：雲端主控台，列出正在跑流程的裝置
function ConsoleScreen({ t }: { t: Copy }) {
  return (
    <>
      <div className="relative mb-3 rounded-lg border border-white/10 bg-zinc-950/80 p-2 text-[11px] text-zinc-200">
        {t.devices}
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((idx) => (
          <div key={idx} className="rounded-lg border border-white/10 bg-zinc-950/70 p-2">
            <div className="h-12 rounded border border-white/10 bg-zinc-800/60" />
            <p className="mt-1 text-[10px] text-zinc-400">
              {t.running} Threads_Auto_Reply.json
            </p>
          </div>
        ))}
      </div>
    </>
  );
}

// 前方手機：即時裝置畫面
function LiveScreen({ t }: { t: Copy }) {
  return (
    <>
      <div className="relative mb-3 flex items-center justify-between text-[10px] text-zinc-300">
        <span>{t.live}</span>
        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-emerald-300">{t.active}</span>
      </div>
      <div className="grid gap-2">
        <div className="h-20 rounded border border-white/10 bg-gradient-to-b from-zinc-800 to-zinc-900" />
        <div className="h-16 rounded border border-white/10 bg-gradient-to-b from-zinc-800 to-zinc-900" />
      </div>
    </>
  );
}

export default function TiltedPhonePairDemo() {
  const t = useDemoText(copy);
  return (
    <section className="relative isolate w-full max-w-2xl min-w-0 overflow-hidden rounded-3xl bg-zinc-950 px-4 py-8 sm:px-8">
      <div className="pointer-events-none absolute -left-40 -top-36 -z-10 h-[26rem] w-[26rem] rounded-full bg-emerald-500/20 blur-[110px]" />
      <div className="pointer-events-none absolute -right-40 top-6 -z-10 h-[24rem] w-[24rem] rounded-full bg-indigo-500/22 blur-[110px]" />
      <TiltedPhonePair
        label={t.label}
        callout={t.callout}
        backScreen={<ConsoleScreen t={t} />}
        frontScreen={<LiveScreen t={t} />}
      />
    </section>
  );
}
