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
    // 同 CardFlow 首頁：白底加三顆模糊光斑
    <div className="relative flex w-full max-w-xl min-w-0 justify-center overflow-hidden rounded-xl bg-white px-4 py-8 sm:py-12">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-300/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-300/10 blur-3xl" />
      </div>
      <div className="relative min-w-0">
        <FlipProfileCard data={profile} locale={locale} lightEffect="dynamic" />
      </div>
    </div>
  );
}
