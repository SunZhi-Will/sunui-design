"use client";

import { AvatarStack, type AvatarStackPerson } from "./avatar-stack";

const buyers: AvatarStackPerson[] = [
  { id: "1", name: "Mina P.", note: "Taipei, 2 hours ago" },
  { id: "2", name: "Leo C.", note: "Osaka, 5 hours ago" },
  { id: "3", name: "Ava L.", note: "Seoul, yesterday" },
  { id: "4", name: "Noah W.", note: "Taichung, yesterday" },
  { id: "5", name: "Sara K.", note: "Singapore, 2 days ago" },
];

/** 型錄卡片：一排買家頭像，滑過任一個會抬起並顯示名字。 */
export default function AvatarStackCard() {
  return (
    <div className="mx-auto flex w-64 flex-col items-center gap-3 pt-12 text-foreground">
      <AvatarStack people={buyers} total={1284} max={4} size="lg" label="Recent buyers" />
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground tabular-nums">1,284</span> bought in the last 30 days
      </p>
    </div>
  );
}
