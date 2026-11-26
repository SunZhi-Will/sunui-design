"use client";

import { useDemoText } from "@/lib/demo-locale";

import { AnimeCheckbox } from "./anime-checkbox";

const copy = {
  en: { title: "Before you join the raid", items: ["Remember me on this device", "Send me new episode alerts", "I have read the house rules"] },
  "zh-TW": { title: "加入團戰之前", items: ["在這台裝置記住我", "新集數上線時通知我", "我已閱讀社群規範"] },
  "zh-CN": { title: "加入团战之前", items: ["在这台设备记住我", "新集数上线时通知我", "我已阅读社区规范"] },
  ja: { title: "レイドに参加する前に", items: ["この端末でログインを保持する", "新しいエピソードを通知する", "コミュニティルールを読みました"] },
};

export default function AnimeCheckboxDemo() {
  const t = useDemoText(copy);
  return (
    <form className="w-full max-w-sm px-2 py-14" onSubmit={(e) => e.preventDefault()}>
      <h2 className="mb-6 text-lg font-semibold tracking-tight">{t.title}</h2>
      <div className="flex flex-col items-start gap-5">
        {t.items.map((item, i) => (
          <AnimeCheckbox key={item} name={`option-${i}`} defaultChecked={i === 0}>
            {item}
          </AnimeCheckbox>
        ))}
      </div>
    </form>
  );
}
