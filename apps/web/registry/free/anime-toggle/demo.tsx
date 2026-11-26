"use client";

import { useDemoText } from "@/lib/demo-locale";

import { AnimeToggle } from "./anime-toggle";

const copy = {
  en: { title: "Notifications", items: ["New episodes", "Friend requests", "Event reminders"] },
  "zh-TW": { title: "通知", items: ["新集數上線", "好友邀請", "活動提醒"] },
  "zh-CN": { title: "通知", items: ["新集数上线", "好友邀请", "活动提醒"] },
  ja: { title: "通知", items: ["新エピソード", "フレンド申請", "イベントのリマインド"] },
};

export default function AnimeToggleDemo() {
  const t = useDemoText(copy);
  return (
    <div className="w-full max-w-xs px-2 py-14">
      <h2 className="mb-6 text-lg font-semibold tracking-tight">{t.title}</h2>
      <div className="flex flex-col items-start gap-5">
        {t.items.map((label, i) => (
          <AnimeToggle key={label} label={label} name={`notify-${i}`} defaultChecked={i === 0} />
        ))}
      </div>
    </div>
  );
}
