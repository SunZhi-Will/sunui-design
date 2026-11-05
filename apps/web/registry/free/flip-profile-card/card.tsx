"use client";

import { FlipProfileCard, type ProfileCardData } from "./flip-profile-card";

const profile: ProfileCardData = {
  name: "Mia Chen",
  title: "Product Designer",
  bio: "Calm, tactile interfaces.",
  skills: ["Figma", "React", "Motion"],
};

/** 型錄卡片：一張名片，滑過會傾斜反光，點一下翻到背面。 */
export default function FlipProfileCardCard() {
  return (
    <div className="mx-auto w-64">
      <FlipProfileCard
        data={profile}
        lightEffect="dynamic"
        // 縮短卡高與內距，正反兩面都完整放進型錄格
        className="w-64 [&_.fpc-3d]:h-56 [&_.h-24]:size-16 [&_.mb-6]:mb-3 [&_.p-8]:p-5"
      />
    </div>
  );
}
