"use client";

import { animate, motion, useAnimate, useMotionValue, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useId, useMemo, useReducer, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/* 一張會動的流程小圖：畫面背後是一台真的狀態機，每個按鈕都照規則走。
   不合規則的按鈕不會被藏起來，按下去會用一句話說明為什麼不行，這是讀者理解規則的方式。
   三種版面共用同一台機器：flow（流程與分岔）、timeline（照比例的時間軸）、cycle（循環與出口）。 */

export const NEXT = "next";

export type TinyChartLayout = "flow" | "timeline" | "cycle" | "isometric";

export interface TinyState {
  id: string;
  label: string;
  /** 節點旁的小字 */
  note?: string;
  /** 進入這一步時的旁白；省略時用步驟名稱 */
  say?: string;
  /** 終點：畫成靶心，按下一步會說已經結束 */
  final?: boolean;
  /** flow 與 isometric 版面的格位 [欄, 列]；省略時依距離起點的步數自動排 */
  at?: [number, number];
  /** timeline 版面的相對長度，預設 1 */
  duration?: number;
}

export interface TinyTransition {
  from: string;
  to: string;
  /** 觸發事件，預設 "next"（下一步按鈕）；其他值會變成一顆選擇按鈕 */
  on?: string;
  /** 連線上的說明 */
  label?: string;
  /** 條件，畫成 [方括號] */
  guard?: string;
}

export interface TinyMachine {
  initial: string;
  states: TinyState[];
  transitions: TinyTransition[];
  /** 事件 id 對應的按鈕文字 */
  events?: Record<string, string>;
  /** 全部播放時依序送出的事件；省略時沿著下一步走到終點 */
  play?: string[];
  /** 顯示在邏輯面板的業務規則 */
  rules?: { rule: string; says?: string }[];
}

export interface TinyChartCopy {
  play: string;
  next: string;
  logic: string;
  step: (n: number, total: number) => string;
  idle: string;
  done: string;
  choose: (choices: string) => string;
  notHere: (event: string, where: string) => string;
  stuck: string;
  moves: string;
  checks: Record<TinyCheck["id"], string>;
}

export const defaultTinyChartCopy: TinyChartCopy = {
  play: "Play all",
  next: "Next step",
  logic: "The logic",
  step: (n, total) => `step ${n} of ${total}`,
  idle: "Press Play all, or Next step.",
  done: "That was the last step. Press Play all to see it again.",
  choose: (choices) => `Pick one first: ${choices}.`,
  notHere: (event, where) => `Not now: ${event} only happens at ${where}.`,
  stuck: "Nothing leads on from here.",
  moves: "Every move",
  checks: {
    ids: "Every arrow joins two real steps",
    reach: "Every step can be reached from the start",
    exits: "No dead ends: every step can still finish",
    oneWay: "Each button does one thing per step",
  },
};

/* ---------- 規則檢查：讓「每個按鈕都照規則走」可以被驗證 ---------- */

export interface TinyCheck {
  id: "ids" | "reach" | "exits" | "oneWay";
  ok: boolean;
  /** 出問題的步驟或連線 */
  detail: string[];
}

export function checkMachine(m: TinyMachine): TinyCheck[] {
  const ids = new Set(m.states.map((s) => s.id));
  const name = (id: string) => m.states.find((s) => s.id === id)?.label ?? id;
  const spread = (start: string[], next: (id: string) => string[]) => {
    const seen = new Set(start);
    const queue = [...start];
    while (queue.length) for (const n of next(queue.shift()!)) if (!seen.has(n)) seen.add(n), queue.push(n);
    return seen;
  };
  const reached = spread([m.initial], (id) => m.transitions.filter((t) => t.from === id).map((t) => t.to));
  const finishes = spread(
    m.states.filter((s) => s.final).map((s) => s.id),
    (id) => m.transitions.filter((t) => t.to === id).map((t) => t.from),
  );
  const count = new Map<string, number>();
  for (const t of m.transitions) {
    const key = `${name(t.from)} · ${m.events?.[t.on ?? NEXT] ?? t.on ?? NEXT}`;
    count.set(key, (count.get(key) ?? 0) + 1);
  }
  const broken = m.transitions.filter((t) => !ids.has(t.from) || !ids.has(t.to)).map((t) => `${t.from} → ${t.to}`);
  const unreached = m.states.filter((s) => !reached.has(s.id)).map((s) => s.label);
  const stuck = m.states.filter((s) => reached.has(s.id) && !finishes.has(s.id)).map((s) => s.label);
  const twice = [...count].filter(([, n]) => n > 1).map(([k]) => k);
  return [
    { id: "ids", ok: !broken.length, detail: broken },
    { id: "reach", ok: !unreached.length, detail: unreached },
    { id: "exits", ok: !stuck.length, detail: stuck },
    { id: "oneWay", ok: !twice.length, detail: twice },
  ];
}

/* ---------- 引擎：不畫任何東西，可以拿去驅動自己的插圖 ---------- */

/** 旁白存成資料，不存句子：換語系時畫面上的那句話也會跟著換 */
type Note =
  | { kind: "idle" }
  | { kind: "enter"; id: string }
  | { kind: "done" }
  | { kind: "stuck" }
  | { kind: "choose"; events: string[] }
  | { kind: "notHere"; event: string; where: string[] };

interface Run {
  /** 機器的結構指紋；機器換了（步驟或連線不同）就從頭開始，舊的 path 索引不會指到不存在的連線 */
  sig: string;
  at: string;
  /** 走過的連線（transitions 的索引） */
  path: number[];
  note: Note;
  /** 每次回應加一，用來觸發被拒絕時的輕搖 */
  beat: number;
}

type Action = { type: "send"; event: string } | { type: "reset" };

/** 沒有給 play 時：沿下一步走（沒有下一步就取第一條出路），遇到終點或走回頭路就停 */
function autoScript(m: TinyMachine) {
  const out: string[] = [];
  const seen = new Set([m.initial]);
  const finals = new Set(m.states.filter((s) => s.final).map((s) => s.id));
  let at = m.initial;
  for (let i = 0; i < m.states.length * 2; i++) {
    const exits = m.transitions.filter((t) => t.from === at);
    const t = exits.find((x) => (x.on ?? NEXT) === NEXT) ?? exits[0];
    if (!t || finals.has(at) || seen.has(t.to)) break;
    out.push(t.on ?? NEXT);
    seen.add(t.to);
    at = t.to;
  }
  return out;
}

const signature = (m: TinyMachine) =>
  [m.initial, m.states.map((s) => s.id).join(","), m.transitions.map((t) => `${t.from}>${t.to}:${t.on ?? NEXT}`).join(",")].join("|");

export function useStatechart(machine: TinyMachine, copy: TinyChartCopy = defaultTinyChartCopy) {
  const sig = useMemo(() => signature(machine), [machine]);
  const byId = useMemo(() => new Map(machine.states.map((s) => [s.id, s])), [machine]);
  const name = useCallback((id: string) => byId.get(id)?.label ?? id, [byId]);
  const eventLabel = useCallback((e: string) => machine.events?.[e] ?? (e === NEXT ? copy.next : e), [machine, copy]);
  const events = useMemo(() => [...new Set(machine.transitions.map((t) => t.on ?? NEXT))].filter((e) => e !== NEXT), [machine]);
  const script = useMemo(() => machine.play ?? autoScript(machine), [machine]);
  const fresh = useMemo((): Run => ({ sig, at: machine.initial, path: [], note: { kind: "idle" }, beat: 0 }), [sig, machine.initial]);

  const [stored, dispatch] = useReducer((prev: Run, a: Action): Run => {
    const s = prev.sig === sig ? prev : fresh;
    if (a.type === "reset") return fresh;
    const exits: { t: TinyTransition; i: number }[] = [];
    machine.transitions.forEach((t, i) => t.from === s.at && exits.push({ t, i }));
    const hit = exits.find(({ t }) => (t.on ?? NEXT) === a.event);
    if (hit) return { ...s, at: hit.t.to, path: [...s.path, hit.i], note: { kind: "enter", id: hit.t.to }, beat: s.beat + 1 };
    let note: Note = { kind: "stuck" };
    if (byId.get(s.at)?.final) note = { kind: "done" };
    else if (a.event === NEXT && exits.length) note = { kind: "choose", events: exits.map(({ t }) => t.on ?? NEXT) };
    else if (a.event !== NEXT)
      note = { kind: "notHere", event: a.event, where: [...new Set(machine.transitions.filter((t) => (t.on ?? NEXT) === a.event).map((t) => t.from))] };
    return { ...s, note, beat: s.beat + 1 };
  }, fresh);
  // 機器結構變了：這一輪先用新的起點畫，下一次按鈕時 reducer 也會從新起點算
  const run = stored.sig === sig ? stored : fresh;

  const n = run.note;
  const message = {
    refused: n.kind !== "idle" && n.kind !== "enter",
    text:
      n.kind === "idle" ? copy.idle
      : n.kind === "enter" ? byId.get(n.id)?.say ?? name(n.id)
      : n.kind === "done" ? copy.done
      : n.kind === "choose" ? copy.choose(n.events.map(eventLabel).join(" / "))
      : n.kind === "notHere" ? copy.notHere(eventLabel(n.event), n.where.map(name).join(", "))
      : copy.stuck,
  };
  const can = useCallback((e: string) => machine.transitions.some((t) => t.from === run.at && (t.on ?? NEXT) === e), [machine, run.at]);
  const send = useCallback((event: string) => dispatch({ type: "send", event }), []);
  const reset = useCallback(() => dispatch({ type: "reset" }), []);

  return {
    sig,
    at: run.at,
    path: run.path,
    beat: run.beat,
    message,
    state: byId.get(run.at),
    step: run.path.length + 1,
    total: Math.max(script.length + 1, run.path.length + 1),
    events,
    script,
    can,
    name,
    eventLabel,
    send,
    reset,
  };
}

/* ---------- 版面：把機器排成三種圖 ---------- */

type Pt = [number, number];
interface Box { x: number; y: number; w: number; h: number }
interface Edge { d: string; lx: number; ly: number; anchor: "start" | "middle" | "end"; text: string; tape?: boolean }
interface IsoBlock { top: Pt[]; front: Pt[]; side: Pt[]; label: Pt; note: Pt; depth: number }
interface Layout {
  nodes: Map<string, Box>;
  edges: Edge[];
  start: [Pt, Pt];
  tick: boolean;
  /** isometric 版面才有：每一步的三個面與地板格線 */
  iso?: { blocks: Map<string, IsoBlock>; floor: string };
}

const NODE_FONT = 12;
const EDGE_FONT = 11;
const NODE_H = 28;
const r1 = (n: number) => Math.round(n * 10) / 10;
const textW = (s: string, size: number) =>
  [...s].reduce((w, ch) => w + (ch.charCodeAt(0) > 0x2e80 ? size * 1.08 : size * 0.68), 0);
// 終點畫成靶心，方框只是用來算箭頭停在哪
const nodeBox = (s: TinyState, x: number, y: number): Box =>
  s.final ? { x, y, w: 22, h: 22 } : { x, y, w: Math.max(60, textW(s.label.toUpperCase(), NODE_FONT) + 24), h: NODE_H };
const edgeText = (t: TinyTransition) => [t.guard && `[${t.guard}]`, t.label].filter(Boolean).join(" ");

/** 直角折線，轉角帶小圓角 */
function ortho(p: Pt[], radius = 8) {
  const toward = (a: Pt, b: Pt, r: number): Pt => {
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [r1(a[0] + ((b[0] - a[0]) / l) * r), r1(a[1] + ((b[1] - a[1]) / l) * r)];
  };
  let d = `M${p[0][0]} ${p[0][1]}`;
  for (let i = 1; i < p.length - 1; i++) {
    const r = Math.min(radius, Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]) / 2, Math.hypot(p[i + 1][0] - p[i][0], p[i + 1][1] - p[i][1]) / 2);
    d += ` L${toward(p[i], p[i - 1], r).join(" ")} Q${p[i][0]} ${p[i][1]} ${toward(p[i], p[i + 1], r).join(" ")}`;
  }
  return `${d} L${p[p.length - 1].join(" ")}`;
}

/** 文字放在最長的那一段旁邊 */
function orthoLabel(p: Pt[], text: string): Edge {
  let best = 0;
  for (let i = 1; i < p.length - 1; i++)
    if (Math.hypot(p[i + 1][0] - p[i][0], p[i + 1][1] - p[i][1]) > Math.hypot(p[best + 1][0] - p[best][0], p[best + 1][1] - p[best][1])) best = i;
  const [a, b] = [p[best], p[best + 1]];
  const vertical = Math.abs(a[0] - b[0]) < 1;
  return vertical
    ? { d: ortho(p), lx: a[0] + 8, ly: (a[1] + b[1]) / 2 + 4, anchor: "start", text }
    : { d: ortho(p), lx: (a[0] + b[0]) / 2, ly: a[1] - 7, anchor: "middle", text };
}

/** 從方框中心往某點的方向，取方框邊上的點 */
function rim(b: Box, toward: Pt, gap = 3): Pt {
  const dx = toward[0] - b.x, dy = toward[1] - b.y;
  const t = Math.min((b.w / 2 + gap) / (Math.abs(dx) || 1e-6), (b.h / 2 + gap) / (Math.abs(dy) || 1e-6));
  return [r1(b.x + dx * t), r1(b.y + dy * t)];
}

function curve(a: Box, b: Box, c: Pt, text: string): Edge {
  const p0 = rim(a, c), p1 = rim(b, c);
  const mx = 0.25 * p0[0] + 0.5 * c[0] + 0.25 * p1[0], my = 0.25 * p0[1] + 0.5 * c[1] + 0.25 * p1[1];
  return { d: `M${p0.join(" ")} Q${r1(c[0])} ${r1(c[1])} ${p1.join(" ")}`, lx: mx + 6, ly: my - 6, anchor: "start", text };
}

function selfLoop(b: Box, text: string): Edge {
  const x = b.x + b.w / 2, y0 = b.y - 6, y1 = b.y + 6;
  return { d: `M${x + 2} ${y0} C${x + 34} ${y0 - 16}, ${x + 34} ${y1 + 16}, ${x + 3} ${y1}`, lx: x + 36, ly: b.y + 4, anchor: "start", text };
}

/** 每一步的格位 [欄, 列]：有 at 用 at，沒有就依距離起點的步數排列，同列置中 */
function gridOf(m: TinyMachine) {
  const depth = new Map([[m.initial, 0]]);
  const queue = [m.initial];
  while (queue.length) {
    const id = queue.shift()!;
    for (const t of m.transitions) if (t.from === id && !depth.has(t.to)) depth.set(t.to, depth.get(id)! + 1), queue.push(t.to);
  }
  const rows = new Map<number, TinyState[]>();
  for (const s of m.states) {
    const r = s.at?.[1] ?? depth.get(s.id) ?? 0;
    rows.set(r, [...(rows.get(r) ?? []), s]);
  }
  const cells = new Map<string, Pt>();
  for (const [r, list] of rows) list.forEach((s, i) => cells.set(s.id, [s.at?.[0] ?? i - (list.length - 1) / 2, r]));
  return cells;
}

function layoutFlow(m: TinyMachine): Layout {
  const colW = Math.max(150, ...m.states.map((s) => nodeBox(s, 0, 0).w + 44));
  const rowH = 80;
  const nodes = new Map<string, Box>();
  for (const [id, [c, r]] of gridOf(m)) nodes.set(id, nodeBox(m.states.find((s) => s.id === id)!, c * colW, 40 + r * rowH));
  const right = Math.max(...[...nodes.values()].map((b) => b.x + b.w / 2));
  const edges = m.transitions.map((t, i) => {
    const a = nodes.get(t.from)!, b = nodes.get(t.to)!;
    if (t.from === t.to) return selfLoop(a, edgeText(t));
    const top = a.y + a.h / 2, bottom = b.y - b.h / 2;
    if (b.y > a.y + 1) {
      // 一分多：在出發處就轉彎；多合一：在抵達前才轉彎
      const splits = m.transitions.filter((x) => x.from === t.from && nodes.get(x.to)!.y > a.y + 1).length > 1;
      if (Math.abs(a.x - b.x) < 1) {
        const e = orthoLabel([[a.x, top], [b.x, bottom]], edgeText(t));
        // 分岔時直走那條的文字放左邊，讓出右邊給轉彎那條
        return splits ? { ...e, lx: a.x - 8, anchor: "end" as const } : e;
      }
      const ym = splits ? top + (rowH - NODE_H) / 2 : bottom - (rowH - NODE_H) / 2;
      return orthoLabel([[a.x, top], [a.x, ym], [b.x, ym], [b.x, bottom]], edgeText(t));
    }
    if (Math.abs(b.y - a.y) < 1) {
      const dir = b.x > a.x ? 1 : -1;
      return orthoLabel([[a.x + (dir * a.w) / 2, a.y], [b.x - (dir * b.w) / 2, b.y]], edgeText(t));
    }
    // 回頭的線走右側外圈，每一條錯開一點
    const lane = right + 26 + (i % 3) * 12;
    return orthoLabel([[a.x + a.w / 2, a.y], [lane, a.y], [lane, b.y], [b.x + b.w / 2, b.y]], edgeText(t));
  });
  const first = nodes.get(m.initial)!;
  return { nodes, edges, start: [[first.x, first.y - 40], [first.x, first.y - first.h / 2 - 3]], tick: false };
}

function layoutTimeline(m: TinyMachine): Layout {
  const x = 0;
  const total = m.states.reduce((n, s) => n + (s.final ? 0 : s.duration ?? 1), 0) || 1;
  const nodes = new Map<string, Box>();
  let y = 40;
  for (const s of m.states) {
    nodes.set(s.id, { x, y, w: 14, h: 14 });
    if (!s.final) y += Math.max(54, ((s.duration ?? 1) / total) * 400);
  }
  const index = new Map(m.states.map((s, i) => [s.id, i]));
  const edges = m.transitions.map((t): Edge => {
    const a = nodes.get(t.from)!, b = nodes.get(t.to)!;
    if (t.from === t.to) return selfLoop(a, edgeText(t));
    if (index.get(t.to) === index.get(t.from)! + 1)
      return { d: `M${x} ${a.y + 8} L${x} ${b.y - 8}`, lx: x - 14, ly: (a.y + b.y) / 2 + 4, anchor: "end", text: edgeText(t), tape: true };
    // 跳過或折返的線，從時間軸左側繞過去
    const bend = x - 46 - Math.min(40, Math.abs(b.y - a.y) / 10);
    // 文字靠近出發端，避開時間段中間的長度標示
    return { d: `M${x - 7} ${a.y} C${bend} ${a.y}, ${bend} ${b.y}, ${x - 8} ${b.y}`, lx: 0.75 * bend - 8, ly: a.y + (b.y - a.y) * 0.3 + 4, anchor: "end", text: edgeText(t) };
  });
  const first = nodes.get(m.initial)!;
  return { nodes, edges, start: [[x, first.y - 30], [x, first.y - 9]], tick: true };
}

function layoutCycle(m: TinyMachine): Layout {
  // 圈上只放主循環：從起點沿下一步走回起點的那幾步；其他步驟（暫停、終點）放在圈外
  const loop: string[] = [m.initial];
  for (let at = m.initial; ; ) {
    const t = m.transitions.find((x) => x.from === at && (x.on ?? NEXT) === NEXT);
    if (!t || t.to === m.initial || loop.includes(t.to)) {
      if (t?.to !== m.initial) loop.splice(0, loop.length, ...m.states.filter((x) => !x.final).map((x) => x.id));
      break;
    }
    loop.push((at = t.to));
  }
  const R = Math.max(96, loop.length * 32);
  const angle = (i: number) => -Math.PI / 2 + (i / loop.length) * Math.PI * 2;
  const byId = new Map(m.states.map((s) => [s.id, s]));
  const nodes = new Map<string, Box>();
  loop.forEach((id, i) => nodes.set(id, nodeBox(byId.get(id)!, Math.cos(angle(i)) * R, Math.sin(angle(i)) * R)));
  for (const s of m.states.filter((x) => !nodes.has(x.id))) {
    // 圈外的步驟放在它連到的圈上步驟的方向，往外推
    const near = m.transitions.flatMap((t) => (t.to === s.id ? [t.from] : t.from === s.id ? [t.to] : [])).filter((id) => nodes.has(id));
    const vx = near.reduce((n, id) => n + nodes.get(id)!.x, 0), vy = near.reduce((n, id) => n + nodes.get(id)!.y, 0);
    const l = Math.hypot(vx, vy) || 1;
    const out = R + 44 + Math.max(0, ...near.map((id) => nodes.get(id)!.w / 2)) + (s.final ? 0 : 20);
    nodes.set(s.id, nodeBox(s, near.length ? (vx / l) * out : 0, near.length ? (vy / l) * out : R + 80));
  }
  const pos = new Map(loop.map((id, i) => [id, i]));
  const edges = m.transitions.map((t) => {
    const a = nodes.get(t.from)!, b = nodes.get(t.to)!;
    if (t.from === t.to) return selfLoop(a, edgeText(t));
    const i = pos.get(t.from), j = pos.get(t.to);
    if (i === undefined || j === undefined) {
      // 進出圈外的線向外微彎
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, l = Math.hypot(mx, my) || 1;
      return curve(a, b, [mx + (mx / l) * 18, my + (my / l) * 18], edgeText(t));
    }
    const forward = (i + 1) % loop.length === j;
    const mid = angle(i) + (((j - i + loop.length) % loop.length) / loop.length) * Math.PI;
    // 順著走的沿外圈，跨步或倒退的從圈內穿過
    const k = forward ? R * 1.18 : R * 0.3;
    return curve(a, b, [Math.cos(mid) * k, Math.sin(mid) * k], edgeText(t));
  });
  // 起點箭頭從圈外指進來
  const first = nodes.get(m.initial)!;
  const fl = Math.hypot(first.x, first.y) || 1;
  const from: Pt = [first.x + (first.x / fl) * 44, first.y + (first.y / fl) * 44];
  return { nodes, edges, start: [from, rim(first, from)], tick: false };
}


/* ---------- 等角版面：步驟是立在等角地板上的方塊，連線走在地板上 ---------- */

const ISO_C = Math.cos(Math.PI / 6), ISO_S = 0.5;
/** 世界座標 (x, y, z) 投影到畫面：y（流程前進方向）往右下、x（分岔）往左下、z 往上，讀起來由左上到右下 */
const iso = (x: number, y: number, z = 0): Pt => [r1((y - x) * ISO_C), r1((x + y) * ISO_S - z)];
const ISO_FONT = 11;
const BLOCK_D = 30, BLOCK_H = 24, DISC = 13;

function layoutIso(m: TinyMachine): Layout {
  const cells = gridOf(m);
  const byId = new Map(m.states.map((s) => [s.id, s]));
  const width = (s: TinyState) => (s.final ? DISC * 2 : Math.max(76, textW(s.label.toUpperCase(), ISO_FONT) + 28));
  const colW = Math.max(...m.states.map(width)) + 70, rowW = 136;
  // 世界座標裡的方塊：中心、x 方向長度、y 方向深度
  const world = new Map<string, { x: number; y: number; w: number; d: number }>();
  for (const [id, [c, r]] of cells) {
    const s = byId.get(id)!;
    world.set(id, { x: c * colW, y: r * rowW, w: width(s), d: s.final ? DISC * 2 : BLOCK_D });
  }
  const blocks = new Map<string, IsoBlock>();
  const nodes = new Map<string, Box>();
  for (const [id, b] of world) {
    const s = byId.get(id)!;
    const h = s.final ? 0 : BLOCK_H;
    const [x0, x1, y0, y1] = [b.x - b.w / 2, b.x + b.w / 2, b.y - b.d / 2, b.y + b.d / 2];
    const block: IsoBlock = {
      top: [iso(x0, y0, h), iso(x1, y0, h), iso(x1, y1, h), iso(x0, y1, h)],
      front: [iso(x0, y1), iso(x1, y1), iso(x1, y1, h), iso(x0, y1, h)],
      side: [iso(x1, y0), iso(x1, y1), iso(x1, y1, h), iso(x1, y0, h)],
      label: s.final ? iso(b.x, b.y) : iso(b.x, y1, h / 2 - 4),
      note: iso(b.x, y1),
      depth: b.x + b.y,
    };
    blocks.set(id, block);
    const pts = [...block.top, ...block.front, ...block.side];
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    const [mx, Mx, my, My] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    nodes.set(id, { x: (mx + Mx) / 2, y: (my + My) / 2, w: Mx - mx, h: My - my });
  }

  const right = Math.max(...[...world.values()].map((b) => b.x + b.w / 2));
  const floorEdge = (p: Pt[], text: string): Edge => {
    const q = p.map(([x, y]) => iso(x, y));
    let best = 0;
    for (let i = 1; i < q.length - 1; i++)
      if (Math.hypot(q[i + 1][0] - q[i][0], q[i + 1][1] - q[i][1]) > Math.hypot(q[best + 1][0] - q[best][0], q[best + 1][1] - q[best][1])) best = i;
    const [a, b] = [q[best], q[best + 1]];
    return { d: ortho(q, 10), lx: (a[0] + b[0]) / 2 + 9, ly: (a[1] + b[1]) / 2 + 2, anchor: "start", text };
  };
  const edges = m.transitions.map((t, i) => {
    const a = world.get(t.from)!, b = world.get(t.to)!;
    if (t.from === t.to) return selfLoop(nodes.get(t.from)!, edgeText(t));
    const front = a.y + a.d / 2, back = b.y - b.d / 2 - 4;
    if (b.y > a.y + 1) {
      if (Math.abs(a.x - b.x) < 1) return floorEdge([[a.x, front], [b.x, back]], edgeText(t));
      const splits = m.transitions.filter((x) => x.from === t.from && world.get(x.to)!.y > a.y + 1).length > 1;
      const ym = splits ? front + (rowW - BLOCK_D) / 2 : back - (rowW - BLOCK_D) / 2;
      return floorEdge([[a.x, front], [a.x, ym], [b.x, ym], [b.x, back]], edgeText(t));
    }
    if (Math.abs(b.y - a.y) < 1) {
      const dir = b.x > a.x ? 1 : -1;
      return floorEdge([[a.x + (dir * a.w) / 2, a.y], [b.x - dir * (b.w / 2 + 4), b.y]], edgeText(t));
    }
    // 回頭的線沿地板外側繞回去
    const lane = right + 34 + (i % 3) * 14;
    return floorEdge([[a.x + a.w / 2, a.y], [lane, a.y], [lane, b.y], [b.x + b.w / 2 + 4, b.y]], edgeText(t));
  });

  // 地板：每 26 單位一條格線，範圍比方塊多出一圈
  const all = [...world.values()];
  const pad = 52, step = 26;
  const [fx0, fx1] = [Math.min(...all.map((b) => b.x - b.w / 2)) - pad, Math.max(right + 60, ...all.map((b) => b.x + b.w / 2)) + pad / 2];
  const [fy0, fy1] = [Math.min(...all.map((b) => b.y - b.d / 2)) - pad, Math.max(...all.map((b) => b.y + b.d / 2)) + pad];
  let floor = "";
  for (let x = Math.ceil(fx0 / step) * step; x <= fx1; x += step) floor += `M${iso(x, fy0).join(" ")} L${iso(x, fy1).join(" ")} `;
  for (let y = Math.ceil(fy0 / step) * step; y <= fy1; y += step) floor += `M${iso(fx0, y).join(" ")} L${iso(fx1, y).join(" ")} `;

  const first = world.get(m.initial)!;
  return {
    nodes,
    edges,
    start: [iso(first.x, first.y - first.d / 2 - 46), iso(first.x, first.y - first.d / 2 - 4)],
    tick: false,
    iso: { blocks, floor },
  };
}

/** 手畫感方框：四條線各自略超出轉角，端點有一點點偏移，由 id 決定，重繪不會跳 */
function sketchRect(b: Box, id: string) {
  let seed = [...id].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619), 2166136261);
  const rnd = () => ((seed = Math.imul(seed ^ (seed >>> 15), 1 | seed) + 0x6d2b79f5) >>> 0) / 4294967296;
  const j = () => r1((rnd() - 0.5) * 1.6), o = () => r1(1 + rnd() * 2.4);
  const [x0, x1, y0, y1] = [b.x - b.w / 2, b.x + b.w / 2, b.y - b.h / 2, b.y + b.h / 2];
  return [
    `M${r1(x0 - o())} ${y0 + j()} Q${b.x} ${y0 + j()} ${r1(x1 + o())} ${y0 + j()}`,
    `M${x1 + j()} ${r1(y0 - o())} L${x1 + j()} ${r1(y1 + o())}`,
    `M${r1(x1 + o())} ${y1 + j()} Q${b.x} ${y1 + j()} ${r1(x0 - o())} ${y1 + j()}`,
    `M${x0 + j()} ${r1(y1 + o())} L${x0 + j()} ${r1(y0 - o())}`,
  ].join(" ");
}

/* ---------- 元件 ---------- */

export interface TinyChartProps {
  machine: TinyMachine;
  layout?: TinyChartLayout;
  title: string;
  subtitle?: string;
  /** 手畫感方框，關掉是乾淨的直線框 */
  sketch?: boolean;
  /** 顯示「邏輯」面板的按鈕 */
  showLogic?: boolean;
  copy?: Partial<TinyChartCopy>;
  onStateChange?: (id: string) => void;
  className?: string;
}

const INK = "stroke-[#1c1917] dark:stroke-[#ece7dc]";
const RED = "stroke-[#c8361d] dark:stroke-[#ec6a4f]";
const PAPER = "fill-[#faf7f0] dark:fill-[#1f1c18]";
// 等角方塊的兩個側面：同一張紙的兩階明度，平塗，不用漸層
const FACE_FRONT = "fill-[#efe8da] dark:fill-[#2a2620]";
const FACE_SIDE = "fill-[#e3dbc9] dark:fill-[#15130f]";
const poly = (p: Pt[]) => p.map((q) => q.join(",")).join(" ");

export function TinyChart({ machine, layout = "flow", title, subtitle, sketch = true, showLogic = true, copy: copyProp, onStateChange, className }: TinyChartProps) {
  const copy = useMemo(() => ({ ...defaultTinyChartCopy, ...copyProp, checks: { ...defaultTinyChartCopy.checks, ...copyProp?.checks } }), [copyProp]);
  const chart = useStatechart(machine, copy);
  const reduce = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const shape = useMemo(() => ({ flow: layoutFlow, timeline: layoutTimeline, cycle: layoutCycle, isometric: layoutIso })[layout](machine), [machine, layout]);
  const checks = useMemo(() => checkMachine(machine), [machine]);
  const [open, setOpen] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const svgRef = useRef<SVGSVGElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const tx = useMotionValue(0), ty = useMotionValue(0), tokenOpacity = useMotionValue(1);
  const [lineRef, animateLine] = useAnimate<HTMLParagraphElement>();
  const { at, path, beat, message, send, reset, script, can } = chart;
  const moved = path.length;
  const isIso = !!shape.iso;
  const byId = useMemo(() => new Map(machine.states.map((s) => [s.id, s])), [machine]);
  // 等角方塊由遠到近畫，近的才會蓋住遠的
  const isoOrder = useMemo(
    () => (shape.iso ? [...machine.states].sort((a, b) => shape.iso!.blocks.get(a.id)!.depth - shape.iso!.blocks.get(b.id)!.depth) : []),
    [shape, machine],
  );

  // 視框依內容算，連線文字也算進去，避免被切掉
  const box = useMemo(() => {
    const xs: number[] = [], ys: number[] = [];
    for (const [id, b] of shape.nodes) {
      const s = byId.get(id)!;
      const half = Math.max(b.w, textW(s.label.toUpperCase(), NODE_FONT)) / 2;
      const labelW = shape.tick ? 22 + Math.max(textW(s.label.toUpperCase(), NODE_FONT), textW(s.note ?? "", EDGE_FONT)) : half;
      xs.push(b.x - (shape.tick ? b.w / 2 : half), b.x + labelW);
      ys.push(b.y - b.h / 2, b.y + b.h / 2 + (s.note ? 18 : 0) + (s.final && !shape.tick ? 22 : 0));
    }
    for (const e of shape.edges) {
      const w = textW(e.text, EDGE_FONT);
      xs.push(e.anchor === "start" ? e.lx + w : e.anchor === "end" ? e.lx - w : e.lx + w / 2, e.anchor === "middle" ? e.lx - w / 2 : e.lx);
      ys.push(e.ly - 12, e.ly + 4);
      // 路徑上的數字依序是 x, y 成對
      (e.d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number).forEach((n, i) => (i % 2 ? ys : xs).push(n));
    }
    ys.push(shape.start[0][1] - 6);
    xs.push(shape.start[0][0] - 6);
    const pad = 14;
    const [minX, maxX, minY, maxY] = [Math.min(...xs) - pad, Math.max(...xs) + pad, Math.min(...ys) - pad, Math.max(...ys) + pad];
    return { minX, minY, w: maxX - minX, h: maxY - minY };
  }, [shape, byId]);

  // 全部播放：從頭開始，一步一步送出劇本裡的事件；手動按任何按鈕就停
  const stop = () => window.clearTimeout(timer.current);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  // 機器換了就停掉播放，舊劇本的事件不會送進新機器
  useEffect(() => () => window.clearTimeout(timer.current), [chart.sig]);

  const playAll = () => {
    stop();
    reset();
    let i = 0;
    const tick = () => {
      if (i >= script.length) return;
      send(script[i++]);
      timer.current = window.setTimeout(tick, reduce ? 700 : 950);
    };
    timer.current = window.setTimeout(tick, 450);
  };
  const press = (event: string) => {
    stop();
    send(event);
  };

  useEffect(() => onStateChange?.(at), [at, onStateChange]);

  // 圖比卡片寬時（手機），橫向捲動跟著目前這一步走
  useEffect(() => {
    const el = scroller.current, b = shape.nodes.get(at);
    if (!el || !b || el.scrollWidth <= el.clientWidth) return;
    const x = ((b.x - box.minX) / box.w) * el.scrollWidth;
    el.scrollTo({ left: x - el.clientWidth / 2, behavior: reduce ? "auto" : "smooth" });
  }, [at, shape, box, reduce]);

  // 被拒絕時旁白輕搖一下，像紙被推回來；減少動態時只換字
  useEffect(() => {
    if (!message.refused || reduce || !lineRef.current) return;
    void animateLine(lineRef.current, { x: [0, -6, 5, -3, 2, 0] }, { duration: 0.32, ease: "easeOut" });
  }, [beat, message.refused, reduce, animateLine, lineRef]);

  // 朱紅小點沿著剛走過的線移動，停在箭頭處
  useEffect(() => {
    const el = path.length ? svgRef.current?.querySelector<SVGPathElement>(`[data-edge="${path[path.length - 1]}"]`) : null;
    if (!el) return;
    const len = el.getTotalLength();
    const put = (t: number) => {
      const p = el.getPointAtLength(t * len);
      tx.set(p.x);
      ty.set(p.y);
    };
    // 等角版面的小點走到方塊後面就收起來，目前位置交給浮起的方塊表示
    const settle = () => tokenOpacity.set(isIso ? 0 : 1);
    tokenOpacity.set(1);
    if (reduce) return put(1), settle();
    const run = animate(0, 1, { duration: 0.4, ease: "easeOut", onUpdate: put, onComplete: settle });
    return () => run.stop();
    // path 只在真的移動或重來時換新陣列，被拒絕時沿用舊的，所以不會重播
  }, [path, reduce, isIso, tx, ty, tokenOpacity]);

  const visited = new Set([machine.initial, ...path.map((i) => machine.transitions[i].to)]);
  const arrow = (tone: "ink" | "red") => `url(#${uid}-${tone})`;

  return (
    <figure className={cn("min-w-0 rounded-md border border-[#e7e0d0] bg-[#faf7f0] p-4 text-[#1c1917] sm:p-5 dark:border-[#38332b] dark:bg-[#1f1c18] dark:text-[#ece7dc]", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <figcaption className="text-lg font-semibold leading-tight tracking-tight">{title}</figcaption>
          {subtitle && <p className="mt-1 text-sm text-[#1c1917]/60 dark:text-[#ece7dc]/60">{subtitle}</p>}
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-[11px] tabular-nums text-[#1c1917]/55 dark:text-[#ece7dc]/55">{copy.step(chart.step, chart.total)}</p>
          <p className="mt-0.5 text-base font-semibold text-[#c8361d] dark:text-[#ec6a4f]">{chart.state?.label}</p>
        </div>
      </div>

      <div ref={scroller} className="-mx-1 mt-3 overflow-x-auto px-1">
        <svg
          viewBox={`${r1(box.minX)} ${r1(box.minY)} ${r1(box.w)} ${r1(box.h)}`}
          className="mx-auto block h-auto w-full"
          style={{ minWidth: Math.min(box.w * 0.68, 480), maxWidth: box.w * 1.25 }}
          ref={svgRef}
          role="img"
          aria-label={`${title}. ${copy.step(chart.step, chart.total)}: ${chart.state?.label ?? ""}`}
        >
          <defs>
            {(["ink", "red"] as const).map((tone) => (
              <marker key={tone} id={`${uid}-${tone}`} viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M1 1.5 L9 5 L1 8.5" fill="none" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={tone === "ink" ? INK : RED} />
              </marker>
            ))}
          </defs>

          {/* 起點：實心圓點加短箭頭 */}
          <circle cx={shape.start[0][0]} cy={shape.start[0][1]} r="4.5" className="fill-[#1c1917] dark:fill-[#ece7dc]" />
          <line x1={shape.start[0][0]} y1={shape.start[0][1]} x2={shape.start[1][0]} y2={shape.start[1][1]} strokeWidth="1.3" className={INK} markerEnd={arrow("ink")} />

          {shape.iso && <path d={shape.iso.floor} fill="none" strokeWidth="0.8" className="stroke-[#e7e0d0] dark:stroke-[#38332b]" />}

          {shape.tick && (() => {
            const ys = [...shape.nodes.values()].map((b) => b.y);
            return <line x1={0} x2={0} y1={Math.min(...ys)} y2={Math.max(...ys)} strokeWidth="5" strokeLinecap="round" className="stroke-[#e7e0d0] dark:stroke-[#38332b]" />;
          })()}

          {shape.edges.map((e, i) => (
            <g key={i}>
              <path
                data-edge={i}
                d={e.d}
                fill="none"
                strokeWidth="1.3"
                strokeLinecap="round"
                className={cn(INK, e.tape ? "opacity-0" : "opacity-70")}
                markerEnd={e.tape ? undefined : arrow("ink")}
              />
              {e.text && !shape.iso && (
                <text x={e.lx} y={e.ly} textAnchor={e.anchor} fontSize={EDGE_FONT} className="fill-[#1c1917]/60 font-mono dark:fill-[#ece7dc]/60">
                  {e.text}
                </text>
              )}
            </g>
          ))}

          {/* 走過的路用朱紅描一遍，最新的一段畫出來 */}
          {path.map((ti, k) => (
            <motion.path
              key={k}
              d={shape.edges[ti].d}
              fill="none"
              strokeWidth={shape.edges[ti].tape ? 5 : 2}
              strokeLinecap="round"
              className={RED}
              markerEnd={shape.edges[ti].tape ? undefined : arrow("red")}
              initial={k === path.length - 1 && !reduce ? { pathLength: 0 } : false}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          ))}

          {shape.iso &&
            isoOrder.map((s) => {
                const k = shape.iso!.blocks.get(s.id)!;
                const here = s.id === at;
                const labelCls = cn("font-mono uppercase", here ? "fill-[#c8361d] dark:fill-[#ec6a4f]" : "fill-[#1c1917] dark:fill-[#ece7dc]");
                if (s.final)
                  return (
                    <g key={s.id}>
                      <ellipse cx={k.label[0]} cy={k.label[1]} rx={DISC * ISO_C * 1.4} ry={DISC * 0.7} strokeWidth="1.4" className={cn(PAPER, here ? RED : INK)} />
                      <ellipse cx={k.label[0]} cy={k.label[1]} rx={DISC * ISO_C * 0.75} ry={DISC * 0.38} className={here ? "fill-[#c8361d] dark:fill-[#ec6a4f]" : "fill-[#1c1917] dark:fill-[#ece7dc]"} />
                      <text x={k.label[0]} y={k.label[1] + 24} textAnchor="middle" fontSize={NODE_FONT} letterSpacing="0.08em" className={labelCls}>
                        {s.label}
                      </text>
                    </g>
                  );
                return (
                  // 目前這一步的方塊浮起一點，像被拿起來看
                  <motion.g key={s.id} animate={{ y: here ? -7 : 0 }} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 34 }}>
                    <polygon points={poly(k.side)} strokeWidth="1.2" strokeLinejoin="round" className={cn(FACE_SIDE, INK)} />
                    <polygon points={poly(k.front)} strokeWidth="1.2" strokeLinejoin="round" className={cn(FACE_FRONT, INK)} />
                    <polygon points={poly(k.top)} strokeWidth={here ? 2 : 1.2} strokeLinejoin="round" className={cn(PAPER, here ? RED : INK)} />
                    {/* 名稱印在正面，跟著面一起斜 */}
                    <text transform={`matrix(${ISO_C} ${-ISO_S} 0 1 ${k.label[0]} ${k.label[1]})`} textAnchor="middle" fontSize={ISO_FONT} letterSpacing="0.08em" className={labelCls}>
                      {s.label}
                    </text>
                    {s.note && (
                      <text x={k.note[0]} y={k.note[1] + 16} textAnchor="middle" fontSize={EDGE_FONT} className="fill-[#1c1917]/55 dark:fill-[#ece7dc]/55">
                        {s.note}
                      </text>
                    )}
                  </motion.g>
                );
              })}

          {shape.iso &&
            shape.edges.map(
              (e, i) =>
                e.text && (
                  <text key={i} x={e.lx} y={e.ly} fontSize={EDGE_FONT} strokeWidth="3" paintOrder="stroke" className="fill-[#1c1917]/65 stroke-[#faf7f0] font-mono dark:fill-[#ece7dc]/65 dark:stroke-[#1f1c18]">
                    {e.text}
                  </text>
                ),
            )}

          {!shape.iso && machine.states.map((s) => {
            const b = shape.nodes.get(s.id)!;
            const here = s.id === at;
            const seen = visited.has(s.id);
            if (shape.tick)
              return (
                <g key={s.id}>
                  {s.final ? (
                    <>
                      <circle cx={b.x} cy={b.y} r="7.5" strokeWidth="1.4" className={cn(PAPER, here ? RED : INK)} />
                      <circle cx={b.x} cy={b.y} r="4" className={here ? "fill-[#c8361d] dark:fill-[#ec6a4f]" : "fill-[#1c1917] dark:fill-[#ece7dc]"} />
                    </>
                  ) : (
                    <circle cx={b.x} cy={b.y} r={here ? 7 : 5.5} strokeWidth="1.5" className={cn(here ? "fill-[#c8361d] dark:fill-[#ec6a4f]" : PAPER, seen ? RED : INK)} />
                  )}
                  <text x={b.x + 18} y={b.y + 4} fontSize={NODE_FONT} letterSpacing="0.08em" className={cn("font-mono uppercase", here ? "fill-[#c8361d] dark:fill-[#ec6a4f]" : "fill-[#1c1917] dark:fill-[#ece7dc]")}>
                    {s.label}
                  </text>
                  {s.note && (
                    <text x={b.x + 18} y={b.y + 20} fontSize={EDGE_FONT} className="fill-[#1c1917]/55 dark:fill-[#ece7dc]/55">
                      {s.note}
                    </text>
                  )}
                </g>
              );
            return (
              <g key={s.id}>
                {s.final ? (
                  <>
                    <circle cx={b.x} cy={b.y} r="9" strokeWidth="1.4" className={cn(PAPER, here ? RED : INK)} />
                    <circle cx={b.x} cy={b.y} r="5" className={here ? "fill-[#c8361d] dark:fill-[#ec6a4f]" : "fill-[#1c1917] dark:fill-[#ece7dc]"} />
                    <text x={b.x} y={b.y + 26} textAnchor="middle" fontSize={NODE_FONT} letterSpacing="0.08em" className={cn("font-mono uppercase", here ? "fill-[#c8361d] dark:fill-[#ec6a4f]" : "fill-[#1c1917] dark:fill-[#ece7dc]")}>
                      {s.label}
                    </text>
                  </>
                ) : (
                  <>
                    <rect x={b.x - b.w / 2} y={b.y - b.h / 2} width={b.w} height={b.h} rx={sketch ? 0 : 3} className={PAPER} />
                    {sketch ? (
                      <path d={sketchRect(b, s.id)} fill="none" strokeWidth="1.2" strokeLinecap="round" className={INK} />
                    ) : (
                      <rect x={b.x - b.w / 2} y={b.y - b.h / 2} width={b.w} height={b.h} rx="3" fill="none" strokeWidth="1.2" className={INK} />
                    )}
                    {here && (
                      <motion.rect
                        key={`${s.id}-${moved}`}
                        x={b.x - b.w / 2 - 4}
                        y={b.y - b.h / 2 - 4}
                        width={b.w + 8}
                        height={b.h + 8}
                        rx="2"
                        fill="none"
                        strokeWidth="1.6"
                        className={RED}
                        initial={reduce ? false : { opacity: 0, scale: 1.08 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{ transformBox: "fill-box", transformOrigin: "center" }}
                        transition={{ type: "spring", stiffness: 520, damping: 34 }}
                      />
                    )}
                    <text x={b.x} y={b.y + 4} textAnchor="middle" fontSize={NODE_FONT} letterSpacing="0.08em" className="fill-[#1c1917] font-mono uppercase dark:fill-[#ece7dc]">
                      {s.label}
                    </text>
                    {s.note && (
                      <text x={b.x} y={b.y + b.h / 2 + 15} textAnchor="middle" fontSize={EDGE_FONT} className="fill-[#1c1917]/55 dark:fill-[#ece7dc]/55">
                        {s.note}
                      </text>
                    )}
                  </>
                )}
              </g>
            );
          })}

          {moved > 0 && <motion.circle r="4.5" cx={tx} cy={ty} opacity={tokenOpacity} strokeWidth="2" className="fill-[#c8361d] stroke-[#faf7f0] dark:fill-[#ec6a4f] dark:stroke-[#1f1c18]" />}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={playAll} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 active:scale-[0.97]">
          <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
            <path d="M5 3.5v9l7-4.5z" fill="currentColor" />
          </svg>
          {copy.play}
        </button>
        <button type="button" onClick={() => press(NEXT)} className="inline-flex h-8 items-center rounded-md border border-[#1c1917]/70 px-3 text-sm transition-colors hover:bg-[#1c1917]/5 active:scale-[0.97] dark:border-[#ece7dc]/70 dark:hover:bg-[#ece7dc]/10">
          {chart.eventLabel(NEXT)} →
        </button>
        {chart.events.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => press(e)}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors active:scale-[0.97]",
              can(e)
                ? "border-[#1c1917]/70 dark:border-[#ece7dc]/70"
                : "border-[#e7e0d0] text-[#1c1917]/50 dark:border-[#38332b] dark:text-[#ece7dc]/50",
            )}
          >
            {can(e) && <span aria-hidden className="size-1.5 rounded-full bg-[#c8361d] dark:bg-[#ec6a4f]" />}
            {chart.eventLabel(e)}
          </button>
        ))}
        {showLogic && (
          <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls={`${uid}-logic`} className="ml-auto inline-flex h-8 items-center px-1 text-sm text-[#1c1917]/65 underline decoration-dotted underline-offset-4 hover:text-[#1c1917] dark:text-[#ece7dc]/65 dark:hover:text-[#ece7dc]">
            {copy.logic}
          </button>
        )}
      </div>

      <p ref={lineRef} aria-live="polite" className={cn("mt-2 min-h-5 text-sm", message.refused ? "text-[#1c1917] dark:text-[#ece7dc]" : "text-[#1c1917]/65 dark:text-[#ece7dc]/65")}>
        {message.text}
      </p>

      {showLogic && open && (
        <motion.div
          id={`${uid}-logic`}
          initial={reduce ? false : { height: 0 }}
          animate={{ height: "auto" }}
          transition={{ type: "spring", stiffness: 240, damping: 30 }}
          className="overflow-hidden"
        >
          <div className="mt-3 space-y-4 border-t border-dashed border-[#e7e0d0] pt-3 text-sm dark:border-[#38332b]">
            <ul className="space-y-1.5">
              {checks.map((c) => (
                <li key={c.id} className="flex gap-2">
                  <svg viewBox="0 0 16 16" className={cn("mt-0.5 size-4 shrink-0", c.ok ? "text-emerald-700 dark:text-emerald-400" : "text-destructive")} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                    {c.ok ? <path d="M3.5 8.5l3 3 6-7" /> : <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />}
                  </svg>
                  <span>
                    {copy.checks[c.id]}
                    {!c.ok && <span className="block font-mono text-xs text-[#1c1917]/60 dark:text-[#ece7dc]/60">{c.detail.join(", ")}</span>}
                  </span>
                </li>
              ))}
            </ul>
            {machine.rules?.length ? (
              <ul className="space-y-1.5">
                {machine.rules.map((r) => (
                  <li key={r.rule}>
                    <span className="font-medium">{r.rule}</span>
                    {r.says && <span className="block text-[#1c1917]/60 dark:text-[#ece7dc]/60">{r.says}</span>}
                  </li>
                ))}
              </ul>
            ) : null}
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#1c1917]/55 dark:text-[#ece7dc]/55">{copy.moves}</p>
              <ul className="mt-1.5 space-y-1 font-mono text-xs">
                {machine.transitions.map((t, i) => (
                  <li key={i} className={cn(path.includes(i) && "text-[#c8361d] dark:text-[#ec6a4f]")}>
                    {chart.name(t.from)} → {chart.name(t.to)}
                    <span className="text-[#1c1917]/55 dark:text-[#ece7dc]/55">
                      {" · "}
                      {chart.eventLabel(t.on ?? NEXT)}
                      {t.guard && ` [${t.guard}]`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </figure>
  );
}
