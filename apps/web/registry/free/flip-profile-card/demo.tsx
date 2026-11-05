"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { FlipProfileCard, type ProfileCardData } from "./flip-profile-card";

const socialLinks = {
  github: "https://github.com",
  linkedin: "https://www.linkedin.com",
  website: "https://example.com",
};
const skillsBase = ["Figma"];

const profiles: { en: ProfileCardData; "zh-TW": ProfileCardData; "zh-CN": ProfileCardData; ja: ProfileCardData } = {
  en: {
    name: "Mia Chen",
    title: "Product Designer",
    email: "mia.chen@example.com",
    phone: "+886 912 345 678",
    location: "Taipei, Taiwan",
    bio: "I design calm, tactile interfaces and the systems behind them. Currently shaping a card-based canvas for small teams.",
    skills: [...skillsBase, "Design systems", "Prototyping", "React", "Motion"],
    socialLinks,
  },
  "zh-TW": {
    name: "陳米亞",
    title: "產品設計師",
    email: "mia.chen@example.com",
    phone: "+886 912 345 678",
    location: "台灣台北",
    bio: "我設計安靜、有觸感的介面，以及支撐它們的設計系統。目前正在為小型團隊打造一塊以卡片為核心的畫布。",
    skills: [...skillsBase, "設計系統", "原型製作", "React", "動態設計"],
    socialLinks,
  },
  "zh-CN": {
    name: "陈米亚",
    title: "产品设计师",
    email: "mia.chen@example.com",
    phone: "+886 912 345 678",
    location: "台北",
    bio: "我设计安静、有触感的界面，以及支撑它们的设计系统。目前正在为小团队打造一块以卡片为核心的画布。",
    skills: [...skillsBase, "设计系统", "原型设计", "React", "动效设计"],
    socialLinks,
  },
  ja: {
    name: "陳 ミア",
    title: "プロダクトデザイナー",
    email: "mia.chen@example.com",
    phone: "+886 912 345 678",
    location: "台湾・台北",
    bio: "静かで手ざわりのあるインターフェースと、それを支える仕組みをデザインしています。いまは小さなチーム向けのカード型キャンバスを形にしています。",
    skills: [...skillsBase, "デザインシステム", "プロトタイピング", "React", "モーション"],
    socialLinks,
  },
};

export default function FlipProfileCardDemo() {
  const locale = useDemoLocale();
  const profile = useDemoText(profiles);
  return (
    // CardFlow 首頁的背景光斑已拿掉，改成安靜的點格畫布
    <div
      className="relative flex w-full max-w-xl min-w-0 justify-center overflow-hidden rounded-xl border border-border bg-background px-4 py-8 sm:py-12"
      style={{ backgroundImage: "radial-gradient(circle, color-mix(in oklab, var(--muted-foreground) 25%, transparent) 1px, transparent 1px)", backgroundSize: "20px 20px" }}
    >
      <div className="relative min-w-0">
        <FlipProfileCard data={profile} locale={locale} lightEffect="dynamic" />
      </div>
    </div>
  );
}
