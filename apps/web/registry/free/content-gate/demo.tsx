"use client";

import { useState } from "react";

import { ContentGate, ContentGateModal, PreviewPaywall } from "./content-gate";

const lessons = [
  { title: "Why Claude is more than a chat box", length: "8:12", free: true },
  { title: "Projects, files and long context", length: "11:40", free: true },
  {
    title: "Writing prompts that name the format",
    length: "14:05",
    free: false,
  },
  {
    title: "Turning a chat into a reusable workflow",
    length: "12:31",
    free: false,
  },
];

const course = {
  title: "Claude, Not Just Chat",
  subtitle: "Hands-on workshop",
};

export default function ContentGateDemo() {
  const [modalOpen, setModalOpen] = useState(false);
  const [slide, setSlide] = useState(1);
  const previewCount = 3;
  const atLimit = slide >= previewCount;

  return (
    <div className="grid w-full max-w-[56rem] grid-cols-1 gap-6 lg:grid-cols-2">
      {/* 課程頁：已登入但這個帳號沒有購買 */}
      <ContentGate
        {...course}
        state="no-access"
        className="min-w-0 rounded-2xl"
        signInHref="#"
        onSignIn={() => undefined}
        contactHref="#"
      />

      <div className="flex min-w-0 flex-col gap-6">
        {/* 課程大綱：點上鎖的單元跳出權限彈窗 */}
        <div className="relative min-h-[42rem] overflow-hidden rounded-2xl border border-white/10 bg-[#0e0e0e] p-4 text-white/90">
          <p className="text-[12px] font-bold tracking-[0.2em] text-[#da7756] uppercase">
            Syllabus
          </p>
          <ul className="mt-3 divide-y divide-white/[0.06]">
            {lessons.map((lesson, i) => (
              <li key={lesson.title}>
                <button
                  type="button"
                  onClick={() => !lesson.free && setModalOpen(true)}
                  className="flex w-full min-w-0 items-center gap-3 py-3 text-left text-sm transition-colors hover:text-white"
                >
                  <span className="w-5 shrink-0 text-white/45 tabular-nums">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate">
                    {lesson.title}
                  </span>
                  <span className="shrink-0 text-xs text-white/45">
                    {lesson.free ? "Free" : "Locked"}
                  </span>
                  <span className="shrink-0 text-white/45 tabular-nums">
                    {lesson.length}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <ContentGateModal
            {...course}
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            fixed={false}
            signInHref="#"
            contactHref="#"
          />
        </div>

        {/* 投影片試看：到第三張蓋上付費牆 */}
        <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-[#111113]">
          <div className="flex h-full flex-col justify-between p-5 text-white">
            <p className="text-xs text-white/50 tabular-nums">
              Slide {slide} / 24
            </p>
            <p className="text-lg font-bold sm:text-2xl">
              {
                [
                  "Meet your new coworker",
                  "Context is everything",
                  "Name the format",
                ][slide - 1]
              }
            </p>
            <div className="relative z-50 flex gap-2">
              <button
                type="button"
                onClick={() => setSlide((s) => Math.max(1, s - 1))}
                className="rounded-lg px-3 py-1.5 text-sm hover:bg-white/10"
                aria-label="Previous slide"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => setSlide((s) => Math.min(previewCount, s + 1))}
                className="rounded-lg px-3 py-1.5 text-sm hover:bg-white/10"
                aria-label="Next slide"
              >
                ›
              </button>
            </div>
          </div>
          {atLimit && <PreviewPaywall previewCount={previewCount} href="#" />}
        </div>
      </div>
    </div>
  );
}
