"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { FlipProfileCard, type ProfileCardData } from "./flip-profile-card";

const profiles: { en: ProfileCardData; "zh-TW": ProfileCardData; "zh-CN": ProfileCardData; ja: ProfileCardData } = {
  en: { name: "Mia Chen", title: "Product Designer", bio: "Calm, tactile interfaces.", skills: ["Figma", "React", "Motion"] },
  "zh-TW": { name: "陳米亞", title: "產品設計師", bio: "安靜、有觸感的介面。", skills: ["Figma", "React", "動態"] },
  "zh-CN": { name: "陈米亚", title: "产品设计师", bio: "安静、有触感的界面。", skills: ["Figma", "React", "动效"] },
  ja: { name: "陳 ミア", title: "プロダクトデザイナー", bio: "静かで手ざわりのある UI。", skills: ["Figma", "React", "モーション"] },
};

/** 型錄卡片：一張名片，滑過會傾斜反光，點一下翻到背面。 */
export default function FlipProfileCardCard() {
  const locale = useDemoLocale();
  const profile = useDemoText(profiles);
  return (
    <div className="mx-auto w-64">
      <FlipProfileCard
        data={profile}
        locale={locale}
        lightEffect="dynamic"
        // 縮短卡高與內距，正反兩面都完整放進型錄格
        className="w-64 [&_.fpc-3d]:h-56 [&_.h-24]:size-16 [&_.mb-6]:mb-3 [&_.p-8]:p-5"
      />
    </div>
  );
}
