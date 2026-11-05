"use client";

import type { ReactNode } from "react";

import type { AppShellAccount, AppShellNavGroup, AppShellWorkspace } from "./app-shell";

// demo 與 card 共用：排班工具的導覽（對照 Schedary 店長身分的導覽結構）。
// icon 形狀照 lucide，實際專案直接傳 lucide-react 元件即可。

function make(paths: ReactNode) {
  return function Icon({ className, strokeWidth = 2 }: { className?: string; strokeWidth?: number }) {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
        className={className}
      >
        {paths}
      </svg>
    );
  };
}

export const CalendarIcon = make(
  <>
    <path d="M8 2v4" />
    <path d="M16 2v4" />
    <rect width="18" height="18" x="3" y="4" rx="2" />
    <path d="M3 10h18" />
  </>,
);
const UsersIcon = make(
  <>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </>,
);
const PeopleIcon = make(
  <>
    <path d="M18 21a8 8 0 0 0-16 0" />
    <circle cx="10" cy="8" r="5" />
    <path d="M22 20c0-3.37-2-6.5-4-8a5 5 0 0 0-.45-8.3" />
  </>,
);
const ClockIcon = make(
  <>
    <path d="M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5" />
    <path d="M16 2v4" />
    <path d="M8 2v4" />
    <path d="M3 10h5" />
    <path d="M17.5 17.5 16 16.3V14" />
    <circle cx="16" cy="16" r="6" />
  </>,
);
const ClipboardIcon = make(
  <>
    <rect width="8" height="4" x="8" y="2" rx="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="m9 14 2 2 4-4" />
  </>,
);
const SettingsIcon = make(
  <>
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </>,
);
const ChartIcon = make(
  <>
    <path d="M18 21V10" />
    <path d="M12 21V3" />
    <path d="M6 21v-6" />
  </>,
);
export const StoreIcon = make(
  <>
    <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
    <path d="M2 7h20" />
    <path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7" />
  </>,
);
const GridIcon = make(
  <>
    <rect width="7" height="7" x="3" y="3" rx="1" />
    <rect width="7" height="7" x="14" y="3" rx="1" />
    <rect width="7" height="7" x="14" y="14" rx="1" />
    <rect width="7" height="7" x="3" y="14" rx="1" />
  </>,
);
const LogOutIcon = make(
  <>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </>,
);

const copy = {
  en: {
    brand: "Shiftly",
    schedule: "Schedule",
    people: "People",
    staff: "Staff",
    availability: "Availability",
    availabilityTab: "Avail.",
    leave: "Leave requests",
    leaveTab: "Leave",
    setup: "Setup",
    rules: "Scheduling rules",
    stores: "Stores",
    analysis: "Analysis",
    history: "Version history",
    research: "Research mode",
    storeNames: ["Xinyi store", "Da'an store", "Banqiao store"],
    allStores: "All stores",
    name: "Grace Chen",
    role: "Store manager",
    signOut: "Sign out",
    detail: "Version details",
  },
  "zh-TW": {
    brand: "排班表",
    schedule: "班表",
    people: "人員",
    staff: "員工",
    availability: "可上班時間",
    availabilityTab: "可上班",
    leave: "請假審核",
    leaveTab: "請假",
    setup: "設定",
    rules: "排班設定",
    stores: "門市",
    analysis: "分析",
    history: "歷史版本",
    research: "研究模式",
    storeNames: ["信義店", "大安店", "板橋店"],
    allStores: "所有門市",
    name: "陳怡君",
    role: "店長",
    signOut: "登出",
    detail: "版本詳情",
  },
  "zh-CN": {
    brand: "排班表",
    schedule: "班表",
    people: "人员",
    staff: "员工",
    availability: "可上班时间",
    availabilityTab: "可上班",
    leave: "请假审批",
    leaveTab: "请假",
    setup: "设置",
    rules: "排班设置",
    stores: "门店",
    analysis: "分析",
    history: "历史版本",
    research: "研究模式",
    storeNames: ["信义店", "大安店", "板桥店"],
    allStores: "所有门店",
    name: "陈怡君",
    role: "店长",
    signOut: "退出登录",
    detail: "版本详情",
  },
  ja: {
    brand: "シフト表",
    schedule: "シフト",
    people: "スタッフ",
    staff: "従業員",
    availability: "出勤可能時間",
    availabilityTab: "出勤可",
    leave: "休暇申請",
    leaveTab: "休暇",
    setup: "設定",
    rules: "シフト設定",
    stores: "店舗",
    analysis: "分析",
    history: "バージョン履歴",
    research: "リサーチモード",
    storeNames: ["新宿店", "渋谷店", "池袋店"],
    allStores: "すべての店舗",
    name: "佐藤 恵",
    role: "店長",
    signOut: "ログアウト",
    detail: "バージョン詳細",
  },
};

export const shellCopy = copy;
export type ShellCopy = (typeof copy)["en"];

export function buildGroups(t: ShellCopy, pending: number): AppShellNavGroup[] {
  return [
    {
      items: [
        { href: "/", label: t.schedule, tabLabel: t.schedule, icon: CalendarIcon },
        {
          id: "people",
          label: t.people,
          icon: PeopleIcon,
          children: [
            { href: "/employees", label: t.staff, tabLabel: t.staff, icon: UsersIcon },
            { href: "/availability", label: t.availability, tabLabel: t.availabilityTab, icon: ClockIcon },
            { href: "/leave-requests", label: t.leave, tabLabel: t.leaveTab, icon: ClipboardIcon, badge: pending },
          ],
        },
        {
          id: "setup",
          label: t.setup,
          icon: SettingsIcon,
          children: [
            { href: "/settings", label: t.rules, icon: SettingsIcon },
            { href: "/locations", label: t.stores, icon: StoreIcon },
          ],
        },
        {
          id: "analysis",
          label: t.analysis,
          icon: ChartIcon,
          children: [
            { href: "/history", label: t.history, icon: ChartIcon },
            { href: "/research", label: t.research, icon: ChartIcon },
          ],
        },
      ],
    },
  ];
}

export function buildWorkspace(t: ShellCopy, value: string, onChange: (id: string) => void): AppShellWorkspace {
  const options = t.storeNames.map((label, i) => ({ id: `s${i}`, label }));
  return {
    label: options.find((o) => o.id === value)?.label ?? options[0].label,
    icon: StoreIcon,
    options,
    value,
    onChange,
    action: { label: t.allStores, icon: GridIcon, onSelect: () => {} },
  };
}

export function buildAccount(t: ShellCopy): AppShellAccount {
  return {
    name: t.name,
    detail: t.role,
    email: "grace@shiftly.example",
    actions: [{ label: t.signOut, icon: LogOutIcon, onSelect: () => {} }],
  };
}
