"use client";

import { useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import type { Messages } from "@/lib/messages";

type AgentMessages = Messages["home"]["agent"];
type Ui = AgentMessages["ui"];

/**
 * 首頁「給你的 agent」三卡：查型錄、擬安裝計畫、組好活動頁。
 * 每張卡只有一個動詞，動作對應標題的主張（參考 reports/Altura 動態功能卡 參考分析-2026-11-07.md）。
 *
 * DESIGN.md 不做常駐循環，所以這裡不無限循環：捲進畫面播一次，停在完成狀態，可以手動重播。
 * 每一格都是時間 t 的純函數；離開畫面或分頁隱藏就暫停；reduced motion 直接顯示完成狀態。
 * 伺服器端先畫完成狀態，沒有 JS 也看得到結果。
 */
const DURATION = 3.2;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const prog = (t: number, start: number, dur: number) => clamp01((t - start) / dur);
const easeOut = (p: number) => 1 - (1 - p) ** 3;

export function AgentSteps({ m }: { m: AgentMessages }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const tRef = useRef(DURATION);
  const [t, setT] = useState(DURATION);
  const [run, setRun] = useState(0);

  // 掛載後回到 0 等待進入畫面（這一段在首頁下方，不會看到閃動）
  useEffect(() => {
    if (reduce) {
      tRef.current = DURATION;
      setT(DURATION);
      return;
    }
    tRef.current = 0;
    setT(0);
  }, [reduce, run]);

  useEffect(() => {
    const el = ref.current;
    if (!el || reduce) return;
    let visible = false;
    let raf = 0;
    let last = 0;

    const tick = (now: number) => {
      const dt = last ? (now - last) / 1000 : 0;
      last = now;
      // 回到分頁時不快轉：單格最多前進 0.1 秒
      tRef.current = Math.min(DURATION, tRef.current + Math.min(dt, 0.1));
      setT(tRef.current);
      if (tRef.current < DURATION) raf = requestAnimationFrame(tick);
      else raf = 0;
    };
    const update = () => {
      const should = visible && !document.hidden && tRef.current < DURATION;
      if (should && !raf) {
        last = 0;
        raf = requestAnimationFrame(tick);
      } else if (!should && raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        update();
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    document.addEventListener("visibilitychange", update);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", update);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduce, run]);

  const done = t >= DURATION;
  const visuals = [<SearchVisual key="search" t={t} />, <PlanVisual key="plan" t={t} ui={m.ui} />, <ShipVisual key="ship" t={t} ui={m.ui} />];

  return (
    <section ref={ref} aria-labelledby="agent-title" className="mt-24">
      <div className="grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-end">
        <div>
          <p className="flex items-center gap-2 font-mono text-xs text-subtle">
            <span aria-hidden="true" className="size-1.5 bg-fg" />
            {m.eyebrow}
          </p>
          <h2 id="agent-title" className="mt-3 text-3xl font-semibold tracking-tight text-balance">
            {m.title}
          </h2>
        </div>
        <div>
          <p className="text-sm text-pretty text-subtle">{m.lead}</p>
          <Link
            href="/docs/ai-agents"
            className="mt-4 inline-flex rounded-md bg-fg px-4 py-2 text-sm font-medium text-bg hover:opacity-90"
          >
            {m.docs} →
          </Link>
        </div>
      </div>

      <div className="relative mt-10 border-y border-line">
        {/* 四角的裁切標記 */}
        {["-top-[3px] -left-[3px]", "-top-[3px] -right-[3px]", "-bottom-[3px] -left-[3px]", "-bottom-[3px] -right-[3px]"].map((pos) => (
          <span key={pos} aria-hidden="true" className={`absolute size-1.5 bg-fg ${pos}`} />
        ))}
        <ol className="grid md:grid-cols-3">
          {m.steps.map((step, i) => (
            <li key={step.title} className="border-line px-0 py-6 md:px-5 [&+&]:border-t md:[&+&]:border-t-0 md:[&+&]:border-l">
              <div aria-hidden="true" className="aspect-[4/3] overflow-hidden rounded-md border border-line bg-stage">
                {visuals[i]}
              </div>
              <p className="mt-5 font-mono text-xs text-subtle">{String(i + 1).padStart(2, "0")}</p>
              <h3 className="mt-2 font-medium">{step.title}</h3>
              <p className="mt-1.5 text-sm text-pretty text-subtle">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>

      {!reduce && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={() => setRun((n) => n + 1)}
            disabled={!done}
            className="rounded-md px-2 py-1 font-mono text-xs text-subtle hover:text-fg disabled:opacity-0"
          >
            ↻ {m.replay}
          </button>
        </div>
      )}
    </section>
  );
}

const svgProps = { viewBox: "0 0 320 240", className: "size-full", fontFamily: "var(--font-mono)" } as const;

/* ---------- 01：agent 經由 MCP 查型錄 ---------- */

const SOURCES = ["Claude Code", "Cursor", "Codex"];
const NODE = { x: 204, y: 80, size: 80 };

function pointOn(points: [number, number][], p: number): [number, number] {
  const segs = points.slice(1).map((pt, i) => Math.hypot(pt[0] - points[i][0], pt[1] - points[i][1]));
  let d = p * segs.reduce((a, b) => a + b, 0);
  for (let i = 0; i < segs.length; i++) {
    if (d <= segs[i] || i === segs.length - 1) {
      const k = segs[i] ? d / segs[i] : 0;
      return [points[i][0] + (points[i + 1][0] - points[i][0]) * k, points[i][1] + (points[i + 1][1] - points[i][1]) * k];
    }
    d -= segs[i];
  }
  return points[points.length - 1];
}

function SearchVisual({ t }: { t: number }) {
  const cx = NODE.x + NODE.size / 2;
  const cy = NODE.y + NODE.size / 2;
  const found = t >= 2.3;
  const check = easeOut(prog(t, 2.3, 0.4));

  return (
    <svg {...svgProps}>
      {SOURCES.map((label, i) => {
        const y = 60 + i * 60;
        const pts: [number, number][] = [[120, y], [160, y], [160, cy], [NODE.x, cy]];
        const p = easeOut(prog(t, 0.15 + i * 0.5, 0.9));
        const [dx, dy] = pointOn(pts, p);
        const d = `M${pts.map((pt) => pt.join(" ")).join(" L")}`;
        return (
          <g key={label}>
            <path d={d} fill="none" className="stroke-line" strokeWidth={1.25} />
            <path d={d} fill="none" className="stroke-fg" strokeWidth={1.25} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - p} />
            {p > 0 && p < 1 && <circle cx={dx} cy={dy} r={3} className="fill-fg" />}
            <rect x={16} y={y - 14} width={104} height={28} rx={4} className={`fill-card ${p > 0 ? "stroke-fg" : "stroke-line"}`} />
            <rect x={27} y={y - 3} width={6} height={6} className={p > 0 ? "fill-fg" : "fill-subtle"} />
            <text x={40} y={y + 4} fontSize={11} className="fill-fg">{label}</text>
          </g>
        );
      })}

      <rect x={NODE.x} y={NODE.y} width={NODE.size} height={NODE.size} className="fill-card stroke-fg" />
      {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([a, b]) => (
        <rect key={`${a}${b}`} x={NODE.x + a * NODE.size - 3} y={NODE.y + b * NODE.size - 3} width={6} height={6} className="fill-card stroke-fg" />
      ))}
      {found ? (
        <path d={`M${cx - 13} ${cy} l9 9 l17 -18`} fill="none" className="stroke-fg" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - check} />
      ) : (
        Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          const lead = Math.floor(t * 12) % 8;
          const age = (lead - i + 8) % 8;
          return <circle key={i} cx={cx + Math.cos(a) * 13} cy={cy + Math.sin(a) * 13} r={2.4} className="fill-fg" opacity={1 - age * 0.11} />;
        })
      )}
      <text x={cx} y={NODE.y + NODE.size + 20} fontSize={10} textAnchor="middle" className="fill-subtle">
        sunui · mcp
      </text>
    </svg>
  );
}

/* ---------- 02：擬好安裝指令 ---------- */

const CMD = ["npx shadcn@latest add", "@sunui-pro/campaign-landing"];

function PlanVisual({ t, ui }: { t: number; ui: Ui }) {
  const total = CMD[0].length + CMD[1].length;
  const typing = t < 2.0;
  const chars = Math.floor(prog(t, 0.2, 1.7) * total);
  const line1 = CMD[0].slice(0, chars);
  const line2 = CMD[1].slice(0, Math.max(0, chars - CMD[0].length));
  const caretOn = typing && Math.floor(t * 4) % 2 === 0;
  const fileIn = easeOut(prog(t, 2.0, 0.4));
  const press = t >= 2.5 && t < 2.7 ? 0.96 : 1;
  const installed = t >= 2.7;

  return (
    <svg {...svgProps}>
      <rect x={20} y={34} width={280} height={172} rx={6} className="fill-card stroke-line" />
      <rect x={34} y={52} width={8} height={8} className="fill-fg" />
      <text x={50} y={60} fontSize={11} className="fill-fg">plan_install</text>
      <circle cx={284} cy={56} r={2.5} className={installed ? "fill-fg" : "fill-subtle"} />
      <text x={276} y={60} fontSize={10} textAnchor="end" className="fill-subtle">{ui.justNow}</text>
      <line x1={20} x2={300} y1={74} y2={74} className="stroke-line" />

      <text x={34} y={98} fontSize={10.5} className="fill-fg">
        <tspan className="fill-subtle">$ </tspan>
        {line1}
        {caretOn && chars <= CMD[0].length && "▌"}
      </text>
      <text x={46} y={116} fontSize={10.5} className="fill-fg">
        {line2}
        {caretOn && chars > CMD[0].length && "▌"}
      </text>
      <text x={34} y={138} fontSize={9.5} className="fill-subtle" opacity={fileIn}>
        + components/campaign-landing.tsx
      </text>

      <g transform={`translate(109 169) scale(${press}) translate(-109 -169)`}>
        <rect x={34} y={154} width={150} height={30} rx={4} className="fill-fg" />
        <text x={109} y={173} fontSize={10.5} textAnchor="middle" className="fill-bg" fontFamily="var(--font-sans)">
          {installed ? `✓ ${ui.installed}` : `✓ ${ui.approve}`}
        </text>
      </g>
      <rect x={192} y={154} width={64} height={30} rx={4} className="fill-card stroke-line" />
      <text x={224} y={173} fontSize={10.5} textAnchor="middle" className="fill-fg" fontFamily="var(--font-sans)">
        {ui.edit}
      </text>
    </svg>
  );
}

/* ---------- 03：活動頁組好 ---------- */

const TAGS = ["free", "pro", "pro"];

function ShipVisual({ t, ui }: { t: number; ui: Ui }) {
  const bar = easeOut(prog(t, 0.3, 2.3));
  const ready = bar >= 1;

  return (
    <svg {...svgProps}>
      <rect x={20} y={30} width={280} height={180} rx={6} className="fill-card stroke-line" />
      <rect x={34} y={48} width={8} height={8} className="fill-fg" />
      <text x={50} y={56} fontSize={11} className="fill-fg" fontFamily="var(--font-sans)">{ui.campaign}</text>
      <rect x={250} y={49} width={6} height={6} className="fill-subtle" />
      <text x={286} y={56} fontSize={10} textAnchor="end" className="fill-subtle" fontFamily="var(--font-sans)">{ui.auto}</text>

      {ui.rows.map((row, i) => {
        const y = 86 + i * 30;
        const p = prog(t, 0.5 + i * 0.7, 0.25);
        const on = p > 0;
        return (
          <g key={row}>
            <rect x={30} y={y - 13} width={260} height={26} rx={3} className="fill-fg" opacity={on ? 0.05 * p : 0} />
            <rect x={40} y={y - 6} width={12} height={12} rx={2} className={on ? "fill-fg stroke-fg" : "fill-card stroke-subtle"} opacity={on ? 0.4 + 0.6 * p : 1} />
            {on && <path d={`M${43} ${y} l2.5 2.5 l5 -5`} fill="none" className="stroke-bg" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />}
            <text x={62} y={y + 4} fontSize={11} className={on ? "fill-fg" : "fill-subtle"} fontFamily="var(--font-sans)">{row}</text>
            <text x={280} y={y + 4} fontSize={9.5} textAnchor="end" className="fill-subtle">{TAGS[i]}</text>
          </g>
        );
      })}

      <text x={34} y={189} fontSize={10} className={ready ? "fill-fg" : "fill-subtle"} fontFamily="var(--font-sans)">{ui.ready}</text>
      <rect x={130} y={184} width={156} height={3} rx={1.5} className="fill-line" />
      <rect x={130} y={184} width={156 * bar} height={3} rx={1.5} className="fill-fg" />
    </svg>
  );
}
