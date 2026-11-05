"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { AssignmentExplainSheet, type AssignmentExplanation, type ReplacementCandidates } from "./assignment-sheet";

type DemoData = { explanation: AssignmentExplanation; replacement: ReplacementCandidates; reopen: string; title: string; dateLabel: string };

const data: Record<"en" | "zh-TW" | "zh-CN" | "ja", DemoData> = {
  en: {
    explanation: {
      shift: "Evening",
      shiftTime: "15:00-23:00",
      locked: false,
      reasons: [
        { type: "positive", message: "Marked this evening as preferred" },
        { type: "positive", message: "Only 3 shifts so far this week, below the team average" },
        { type: "neutral", message: "Has the barista skill this shift needs" },
      ],
      candidates: [
        { id: 2, name: "Leo", status: "warning", reasons: ["Would reach 5 shifts this week"] },
        { id: 3, name: "Ava", status: "available", reasons: ["Available, no preference set"] },
        { id: 4, name: "Noah", status: "excluded", reasons: ["On leave that day"] },
      ],
    },
    replacement: {
      candidates: [
        { id: 3, name: "Ava", recommendation: "RECOMMENDED", label: "Recommended", reasons: [{ type: "positive", message: "Free all day" }] },
        { id: 2, name: "Leo", recommendation: "OVERTIME_RISK", label: "May go overtime", reasons: [{ type: "negative", message: "Would pass 40 hours this week" }] },
      ],
      excluded: [{ id: 4, name: "Noah", message: "On leave that day" }],
    },
    reopen: "Mia, Thu 9/24 Evening",
    title: "Mia",
    dateLabel: "9/24 (Thu)",
  },
  "zh-TW": {
    explanation: {
      shift: "晚班",
      shiftTime: "15:00-23:00",
      locked: false,
      reasons: [
        { type: "positive", message: "把這天晚上設為偏好時段" },
        { type: "positive", message: "本週目前只排了 3 個班，低於團隊平均" },
        { type: "neutral", message: "具備這個班需要的咖啡師技能" },
      ],
      candidates: [
        { id: 2, name: "立偉", status: "warning", reasons: ["本週會排到 5 個班"] },
        { id: 3, name: "雅婷", status: "available", reasons: ["可上班，沒有設定偏好"] },
        { id: 4, name: "冠宇", status: "excluded", reasons: ["當天請假"] },
      ],
    },
    replacement: {
      candidates: [
        { id: 3, name: "雅婷", recommendation: "RECOMMENDED", label: "推薦", reasons: [{ type: "positive", message: "整天都有空" }] },
        { id: 2, name: "立偉", recommendation: "OVERTIME_RISK", label: "可能超時", reasons: [{ type: "negative", message: "本週會超過 40 小時" }] },
      ],
      excluded: [{ id: 4, name: "冠宇", message: "當天請假" }],
    },
    reopen: "美玲，9/24（四）晚班",
    title: "美玲",
    dateLabel: "9/24（四）",
  },
  "zh-CN": {
    explanation: {
      shift: "晚班",
      shiftTime: "15:00-23:00",
      locked: false,
      reasons: [
        { type: "positive", message: "把这天晚上设为偏好时段" },
        { type: "positive", message: "本周目前只排了 3 个班，低于团队平均" },
        { type: "neutral", message: "具备这个班需要的咖啡师技能" },
      ],
      candidates: [
        { id: 2, name: "立伟", status: "warning", reasons: ["本周会排到 5 个班"] },
        { id: 3, name: "雅婷", status: "available", reasons: ["可以上班，没有设置偏好"] },
        { id: 4, name: "冠宇", status: "excluded", reasons: ["当天请假"] },
      ],
    },
    replacement: {
      candidates: [
        { id: 3, name: "雅婷", recommendation: "RECOMMENDED", label: "推荐", reasons: [{ type: "positive", message: "全天有空" }] },
        { id: 2, name: "立伟", recommendation: "OVERTIME_RISK", label: "可能超时", reasons: [{ type: "negative", message: "本周会超过 40 小时" }] },
      ],
      excluded: [{ id: 4, name: "冠宇", message: "当天请假" }],
    },
    reopen: "美玲，9/24（周四）晚班",
    title: "美玲",
    dateLabel: "9/24（周四）",
  },
  ja: {
    explanation: {
      shift: "遅番",
      shiftTime: "15:00-23:00",
      locked: false,
      reasons: [
        { type: "positive", message: "この日の夜を希望シフトにしている" },
        { type: "positive", message: "今週はまだ 3 シフトで、チーム平均より少ない" },
        { type: "neutral", message: "このシフトに必要なバリスタのスキルがある" },
      ],
      candidates: [
        { id: 2, name: "健太", status: "warning", reasons: ["今週 5 シフトになる"] },
        { id: 3, name: "彩花", status: "available", reasons: ["勤務可能、希望なし"] },
        { id: 4, name: "翔", status: "excluded", reasons: ["当日は休み"] },
      ],
    },
    replacement: {
      candidates: [
        { id: 3, name: "彩花", recommendation: "RECOMMENDED", label: "おすすめ", reasons: [{ type: "positive", message: "終日空いている" }] },
        { id: 2, name: "健太", recommendation: "OVERTIME_RISK", label: "残業の恐れ", reasons: [{ type: "negative", message: "今週 40 時間を超える" }] },
      ],
      excluded: [{ id: 4, name: "翔", message: "当日は休み" }],
    },
    reopen: "美咲、9/24（木）遅番",
    title: "美咲",
    dateLabel: "9/24（木）",
  },
};

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export default function AssignmentSheetDemo() {
  const locale = useDemoLocale();
  const d = useDemoText(data);
  const [open, setOpen] = useState(true);
  const [locked, setLocked] = useState(false);
  const [found, setFound] = useState<ReplacementCandidates | null>(null);

  return (
    <div className="flex w-full max-w-md min-w-0 flex-col gap-3">
      {open ? null : (
        <button type="button" onClick={() => setOpen(true)} className="w-fit rounded-md border border-border bg-card px-2 py-1 text-xs font-medium text-foreground hover:bg-muted">
          {d.reopen}
        </button>
      )}
      <AssignmentExplainSheet
        open={open}
        onOpenChange={setOpen}
        locale={locale}
        title={d.title}
        dateLabel={d.dateLabel}
        explanation={{ ...d.explanation, locked }}
        canEdit
        onToggleLock={async (next) => {
          await wait(300);
          setLocked(next);
        }}
        onFindReplacement={() => {
          setFound(null);
          setTimeout(() => setFound(d.replacement), 700);
        }}
        replacement={found}
        onAssign={() => wait(500)}
        onRemove={async () => {
          await wait(400);
          setOpen(false);
        }}
      />
    </div>
  );
}
