"use client";

import { FlipProfileCard, type ProfileCardData } from "./flip-profile-card";

const profile: ProfileCardData = {
  name: "Mia Chen",
  title: "Product Designer",
  email: "mia.chen@example.com",
  phone: "+886 912 345 678",
  location: "Taipei, Taiwan",
  bio: "I design calm, tactile interfaces and the systems behind them. Currently shaping a card-based canvas for small teams.",
  skills: ["Figma", "Design systems", "Prototyping", "React", "Motion"],
  socialLinks: {
    github: "https://github.com",
    linkedin: "https://www.linkedin.com",
    website: "https://example.com",
  },
};

export default function FlipProfileCardDemo() {
  return (
    // 同 CardFlow 首頁：白底加三顆模糊光斑
    <div className="relative flex w-full max-w-xl min-w-0 justify-center overflow-hidden rounded-xl bg-white px-4 py-8 sm:py-12">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-blue-300/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-300/10 blur-3xl" />
      </div>
      <div className="relative min-w-0">
        <FlipProfileCard data={profile} lightEffect="dynamic" />
      </div>
    </div>
  );
}
