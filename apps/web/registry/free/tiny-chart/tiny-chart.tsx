"use client";

import { animate, motion, useAnimate, useMotionValue, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useId, useMemo, useReducer, useRef, useState } from "react";

import { cn } from "@/lib/utils";

import { Figure, ISO_C, ISO_S, iso, placeScene, r1, SceneParts, type Pt, type SceneDraw, type TinyScene } from "./tiny-scenes";

export { tinyProps, type TinyProp, type TinyScene } from "./tiny-scenes";

/* An animated flow diagram. A real state machine sits behind it, and every button follows its rules.
   Buttons that break the rules are not hidden: pressing one explains in a sentence why it is not allowed, which is how readers learn the rules.
   Three layouts share one machine: flow (steps and branches), timeline (to-scale time axis), cycle (loops and exits). */

export const NEXT = "next";

export type TinyChartLayout = "flow" | "timeline" | "cycle" | "isometric";

export interface TinyState {
  id: string;
  label: string;
  /** Small text beside the node */
  note?: string;
  /** Narration shown when entering this step; falls back to the step name */
  say?: string;
  /** Terminal step: drawn as a bullseye; pressing next says it is already finished */
  final?: boolean;
  /** Grid cell [column, row] for the flow and isometric layouts; placed automatically by distance from the start when omitted */
  at?: [number, number];
  /** Isometric layout: small scene beside this step, e.g. "truck" or { prop: "counter", person: true } */
  scene?: TinyScene;
  /** Relative length in the timeline layout, default 1 */
  duration?: number;
}

export interface TinyTransition {
  from: string;
  to: string;
  /** Triggering event, default "next" (the next-step button); any other value becomes a choice button */
  on?: string;
  /** Label on the connection */
  label?: string;
  /** Condition, drawn in [square brackets] */
  guard?: string;
}

export interface TinyMachine {
  initial: string;
  states: TinyState[];
  transitions: TinyTransition[];
  /** Button label for each event id */
  events?: Record<string, string>;
  /** Events sent in order by Play all; when omitted, follows next steps to the end */
  play?: string[];
  /** Business rules shown in the logic panel */
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

/* ---------- Rule checks: make "every button follows the rules" verifiable ---------- */

export interface TinyCheck {
  id: "ids" | "reach" | "exits" | "oneWay";
  ok: boolean;
  /** The step or transition at fault */
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

/* ---------- Engine: draws nothing, so you can use it to drive your own illustration ---------- */

/** Narration is stored as data, not sentences, so the on-screen line follows a locale change */
type Note =
  | { kind: "idle" }
  | { kind: "enter"; id: string }
  | { kind: "done" }
  | { kind: "stuck" }
  | { kind: "choose"; events: string[] }
  | { kind: "notHere"; event: string; where: string[] };

interface Run {
  /** Fingerprint of the machine structure; when the machine changes (different steps or transitions) it restarts, so a stale path index never points at a missing transition */
  sig: string;
  at: string;
  /** Transitions taken so far (indexes into transitions) */
  path: number[];
  note: Note;
  /** Incremented on every response, used to trigger the shake on rejection */
  beat: number;
}

type Action = { type: "send"; event: string } | { type: "reset" };

/** When no play script is given: follow next steps (take the first exit if there is no next), and stop at a terminal step or when a path doubles back */
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
  // Machine structure changed: this render draws from the new start, and the reducer also computes from the new start on the next button press
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

/* ---------- Layout: arrange the machine into three kinds of diagram ---------- */

interface Box { x: number; y: number; w: number; h: number }
interface Edge { d: string; lx: number; ly: number; anchor: "start" | "middle" | "end"; text: string; tape?: boolean }
interface IsoBlock { top: Pt[]; front: Pt[]; side: Pt[]; label: Pt; note: Pt; depth: number }
interface Layout {
  nodes: Map<string, Box>;
  edges: Edge[];
  start: [Pt, Pt];
  tick: boolean;
  /** Isometric layout only: the three faces of each step, plus the floor grid lines */
  iso?: {
    blocks: Map<string, IsoBlock>;
    floor: string;
    scenes: Map<string, SceneDraw>;
    /** Where the figure stands at each step (center of the block top, or the terminal disc) */
    stands: Map<string, Pt>;
  };
  /** Extra points the viewBox must also contain (scene props) */
  extra?: Pt[];
}

const NODE_FONT = 12;
const EDGE_FONT = 11;
const NODE_H = 28;
const textW = (s: string, size: number) =>
  [...s].reduce((w, ch) => w + (ch.charCodeAt(0) > 0x2e80 ? size * 1.08 : size * 0.68), 0);
// The terminal step is drawn as a bullseye; the box is only used to work out where arrows stop
const nodeBox = (s: TinyState, x: number, y: number): Box =>
  s.final ? { x, y, w: 22, h: 22 } : { x, y, w: Math.max(60, textW(s.label.toUpperCase(), NODE_FONT) + 24), h: NODE_H };
const edgeText = (t: TinyTransition) => [t.guard && `[${t.guard}]`, t.label].filter(Boolean).join(" ");

/** Right-angle polyline with slightly rounded corners */
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

/** Place the label beside the longest segment */
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

/** From the box center toward a point, take the point on the box edge */
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

/** Grid cell [column, row] per step: use at if given, otherwise arrange by distance from the start, centered within a row */
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
      // One-to-many: turn right at the departure point; many-to-one: turn only just before arriving
      const splits = m.transitions.filter((x) => x.from === t.from && nodes.get(x.to)!.y > a.y + 1).length > 1;
      if (Math.abs(a.x - b.x) < 1) {
        const e = orthoLabel([[a.x, top], [b.x, bottom]], edgeText(t));
        // At a fork, put the label of the straight-ahead line on the left, leaving the right side for the one that turns
        return splits ? { ...e, lx: a.x - 8, anchor: "end" as const } : e;
      }
      const ym = splits ? top + (rowH - NODE_H) / 2 : bottom - (rowH - NODE_H) / 2;
      return orthoLabel([[a.x, top], [a.x, ym], [b.x, ym], [b.x, bottom]], edgeText(t));
    }
    if (Math.abs(b.y - a.y) < 1) {
      const dir = b.x > a.x ? 1 : -1;
      return orthoLabel([[a.x + (dir * a.w) / 2, a.y], [b.x - (dir * b.w) / 2, b.y]], edgeText(t));
    }
    // Lines that go back run around the right-hand outside, each offset a little from the last
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
    // Lines that skip ahead or turn back go around the left side of the timeline
    const bend = x - 46 - Math.min(40, Math.abs(b.y - a.y) / 10);
    // Keep the label near the departure end, away from the duration marks in the middle of each segment
    return { d: `M${x - 7} ${a.y} C${bend} ${a.y}, ${bend} ${b.y}, ${x - 8} ${b.y}`, lx: 0.75 * bend - 8, ly: a.y + (b.y - a.y) * 0.3 + 4, anchor: "end", text: edgeText(t) };
  });
  const first = nodes.get(m.initial)!;
  return { nodes, edges, start: [[x, first.y - 30], [x, first.y - 9]], tick: true };
}

function layoutCycle(m: TinyMachine): Layout {
  // Only the main loop goes on the ring: the steps that lead from the start along next back to the start; other steps (pause, terminal) sit outside the ring
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
    // A step outside the ring sits in the direction of the ring step it connects to, pushed outward
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
      // Lines going into or out of an outside step curve slightly outward
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, l = Math.hypot(mx, my) || 1;
      return curve(a, b, [mx + (mx / l) * 18, my + (my / l) * 18], edgeText(t));
    }
    const forward = (i + 1) % loop.length === j;
    const mid = angle(i) + (((j - i + loop.length) % loop.length) / loop.length) * Math.PI;
    // Lines that follow the flow use the outer ring; lines that skip or go backward cut through the inside
    const k = forward ? R * 1.18 : R * 0.3;
    return curve(a, b, [Math.cos(mid) * k, Math.sin(mid) * k], edgeText(t));
  });
  // The start arrow points in from outside the ring
  const first = nodes.get(m.initial)!;
  const fl = Math.hypot(first.x, first.y) || 1;
  const from: Pt = [first.x + (first.x / fl) * 44, first.y + (first.y / fl) * 44];
  return { nodes, edges, start: [from, rim(first, from)], tick: false };
}


/* ---------- Isometric layout: steps are blocks standing on an isometric floor, with connections running along the floor ---------- */

const ISO_FONT = 11;
const BLOCK_D = 30, BLOCK_H = 24, DISC = 13;

function layoutIso(m: TinyMachine): Layout {
  const cells = gridOf(m);
  const byId = new Map(m.states.map((s) => [s.id, s]));
  const width = (s: TinyState) => (s.final ? DISC * 2 : Math.max(76, textW(s.label.toUpperCase(), ISO_FONT) + 28));
  const colW = Math.max(...m.states.map(width)) + 70, rowW = 136;
  // Blocks in world coordinates: center, length along x, depth along y
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
    // Lines that go back loop around the outside of the floor
    const lane = right + 34 + (i % 3) * 14;
    return floorEdge([[a.x + a.w / 2, a.y], [lane, a.y], [lane, b.y], [b.x + b.w / 2 + 4, b.y]], edgeText(t));
  });

  // Scene: steps on the main line sit on the far side (upper right of the view), branch steps on the near side (lower left), so the main line is never blocked
  const scenes = new Map<string, SceneDraw>();
  const stands = new Map<string, Pt>();
  const extra: Pt[] = [];
  for (const [id, b] of world) {
    const s = byId.get(id)!;
    stands.set(id, iso(b.x, b.y, s.final ? 0 : BLOCK_H));
    if (!s.scene) continue;
    const draw = placeScene(s.scene, b.x, b.y, b.w, cells.get(id)![0] >= 1 ? 1 : -1);
    scenes.set(id, draw);
    for (const part of draw.parts) part.kind === "person" ? extra.push(part.at, [part.at[0], part.at[1] - 38]) : extra.push(...part.pts);
  }

  // Floor: one grid line every 26 units, extending one ring beyond the blocks and scenes
  const all = [
    ...[...world.values()].map((b) => ({ x0: b.x - b.w / 2, x1: b.x + b.w / 2, y0: b.y - b.d / 2, y1: b.y + b.d / 2 })),
    ...[...scenes.values()].map((d) => d.footprint),
  ];
  const pad = 40, step = 26;
  const [fx0, fx1] = [Math.min(...all.map((b) => b.x0)) - pad, Math.max(right + 60, ...all.map((b) => b.x1)) + pad / 2];
  const [fy0, fy1] = [Math.min(...all.map((b) => b.y0)) - pad, Math.max(...all.map((b) => b.y1)) + pad];
  let floor = "";
  for (let x = Math.ceil(fx0 / step) * step; x <= fx1; x += step) floor += `M${iso(x, fy0).join(" ")} L${iso(x, fy1).join(" ")} `;
  for (let y = Math.ceil(fy0 / step) * step; y <= fy1; y += step) floor += `M${iso(fx0, y).join(" ")} L${iso(fx1, y).join(" ")} `;

  const first = world.get(m.initial)!;
  return {
    nodes,
    edges,
    start: [iso(first.x, first.y - first.d / 2 - 46), iso(first.x, first.y - first.d / 2 - 4)],
    tick: false,
    iso: { blocks, floor, scenes, stands },
    extra,
  };
}

/** Hand-drawn-looking box: each of the four lines overshoots its corner slightly, with a small endpoint offset derived from the id, so it does not jump on redraw */
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

/* ---------- Component ---------- */

export interface TinyChartProps {
  machine: TinyMachine;
  layout?: TinyChartLayout;
  title: string;
  subtitle?: string;
  /** Hand-drawn-looking box; turn off for a clean straight-line box */
  sketch?: boolean;
  /** Button that shows the "logic" panel */
  showLogic?: boolean;
  copy?: Partial<TinyChartCopy>;
  onStateChange?: (id: string) => void;
  /** Isometric layout: a figure stands at the current step and jumps across when the step changes; on by default */
  walker?: boolean;
  className?: string;
}

const INK = "stroke-foreground";
/** Brand accent: follows the theme's --primary by default; buyers set --sunui-spot to use their own brand colour. Used only for selection, offers, and current progress */
// RED: outline of the path taken and of the current state
const RED = "stroke-[color:var(--sunui-spot,var(--primary))]";
const spotFill = "bg-[color:var(--sunui-spot,var(--primary))] text-[color:var(--sunui-spot-foreground,var(--primary-foreground))]";
const PAPER = "fill-card";
const MUTED = "stroke-muted-foreground/70";
// The two side faces of an isometric block: two lightness steps of the same surface, flat fill, no gradient
const FACE_FRONT = "fill-[#e8e8e8] dark:fill-[#272727]";
const FACE_SIDE = "fill-[#dbdbdb] dark:fill-[#131313]";
const poly = (p: Pt[]) => p.map((q) => q.join(",")).join(" ");

export function TinyChart({ machine, layout = "flow", title, subtitle, sketch = true, showLogic = true, copy: copyProp, onStateChange, walker = true, className }: TinyChartProps) {
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
  const tx = useMotionValue(0), ty = useMotionValue(0);
  const [lineRef, animateLine] = useAnimate<HTMLParagraphElement>();
  const { at, path, beat, message, send, reset, script, can } = chart;
  const moved = path.length;
  const isIso = !!shape.iso;
  const byId = useMemo(() => new Map(machine.states.map((s) => [s.id, s])), [machine]);
  // Isometric blocks and scenes are drawn far to near, so nearer ones cover farther ones
  const isoOrder = useMemo(() => {
    if (!shape.iso) return [];
    const { blocks, scenes } = shape.iso;
    const items: { depth: number; state: TinyState; scene?: SceneDraw }[] = machine.states.map((state) => ({ depth: blocks.get(state.id)!.depth, state }));
    for (const [id, scene] of scenes) items.push({ depth: scene.depth, state: byId.get(id)!, scene });
    return items.sort((a, b) => a.depth - b.depth);
  }, [shape, machine, byId]);

  // The viewBox is computed from the content, including connection labels, so nothing gets clipped
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
      // The numbers in a path are x, y pairs, in order
      (e.d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number).forEach((n, i) => (i % 2 ? ys : xs).push(n));
    }
    for (const [x, y] of shape.extra ?? []) xs.push(x), ys.push(y);
    ys.push(shape.start[0][1] - 6);
    xs.push(shape.start[0][0] - 6);
    const pad = 14;
    const [minX, maxX, minY, maxY] = [Math.min(...xs) - pad, Math.max(...xs) + pad, Math.min(...ys) - pad, Math.max(...ys) + pad];
    return { minX, minY, w: maxX - minX, h: maxY - minY };
  }, [shape, byId]);

  // Play all: start from the beginning and send the script's events one step at a time; pressing any button by hand stops it
  const stop = () => window.clearTimeout(timer.current);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  // Stop playback when the machine changes, so events from an old script never reach the new machine
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

  // When the diagram is wider than the card (mobile), horizontal scroll follows the current step
  useEffect(() => {
    const el = scroller.current, b = shape.nodes.get(at);
    if (!el || !b || el.scrollWidth <= el.clientWidth) return;
    const x = ((b.x - box.minX) / box.w) * el.scrollWidth;
    el.scrollTo({ left: x - el.clientWidth / 2, behavior: reduce ? "auto" : "smooth" });
  }, [at, shape, box, reduce]);

  // On rejection the narration shakes briefly, as if pushed back; with reduced motion only the text changes
  useEffect(() => {
    if (!message.refused || reduce || !lineRef.current) return;
    void animateLine(lineRef.current, { x: [0, -6, 5, -3, 2, 0] }, { duration: 0.32, ease: "easeOut" });
  }, [beat, message.refused, reduce, animateLine, lineRef]);

  // Isometric layout: the figure stands on the top face of the current step and hops along an arc when the step changes (the landing point accounts for the block's lift)
  const stands = shape.iso?.stands;
  useEffect(() => {
    if (!stands || !walker) return;
    const lift = (id: string) => (byId.get(id)?.final ? 0 : 7);
    const to = stands.get(at)!;
    const end: Pt = [to[0], to[1] - lift(at)];
    const last = path.length ? machine.transitions[path[path.length - 1]] : null;
    if (!last || reduce) return void (tx.set(end[0]), ty.set(end[1]));
    const from = stands.get(last.from)!;
    const c: Pt = [(from[0] + end[0]) / 2, Math.min(from[1], end[1]) - 36];
    const run = animate(0, 1, {
      duration: 0.4,
      ease: "easeInOut",
      onUpdate: (t) => {
        const u = 1 - t;
        tx.set(u * u * from[0] + 2 * u * t * c[0] + t * t * end[0]);
        ty.set(u * u * from[1] + 2 * u * t * c[1] + t * t * end[1]);
      },
    });
    return () => run.stop();
  }, [path, at, stands, walker, reduce, byId, machine, tx, ty]);

  // The accent dot travels along the line just taken and stops at the arrowhead (the isometric layout uses the figure instead)
  useEffect(() => {
    if (isIso) return;
    const el = path.length ? svgRef.current?.querySelector<SVGPathElement>(`[data-edge="${path[path.length - 1]}"]`) : null;
    if (!el) return;
    const len = el.getTotalLength();
    const put = (t: number) => {
      const p = el.getPointAtLength(t * len);
      tx.set(p.x);
      ty.set(p.y);
    };
    if (reduce) return put(1);
    const run = animate(0, 1, { duration: 0.4, ease: "easeOut", onUpdate: put });
    return () => run.stop();
    // path gets a new array only on a real move or a restart; on rejection the old one is kept, so nothing replays
  }, [path, reduce, isIso, tx, ty]);

  const visited = new Set([machine.initial, ...path.map((i) => machine.transitions[i].to)]);
  const arrow = (tone: "ink" | "red") => `url(#${uid}-${tone})`;

  return (
    <figure className={cn("min-w-0 rounded-xl border border-foreground/10 bg-card p-4 text-foreground sm:p-5 shadow-[0_1px_2px_rgb(0_0_0/0.05)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <figcaption className="text-lg font-semibold leading-tight tracking-tight">{title}</figcaption>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="shrink-0 text-right">
          <p className="font-mono text-[11px] tabular-nums text-muted-foreground">{copy.step(chart.step, chart.total)}</p>
          <p className="mt-0.5 text-base font-semibold text-foreground">{chart.state?.label}</p>
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

          {/* Start: a solid dot with a short arrow */}
          <circle cx={shape.start[0][0]} cy={shape.start[0][1]} r="4.5" className="fill-foreground" />
          <line x1={shape.start[0][0]} y1={shape.start[0][1]} x2={shape.start[1][0]} y2={shape.start[1][1]} strokeWidth="1.3" className={INK} markerEnd={arrow("ink")} />

          {shape.iso && <path d={shape.iso.floor} fill="none" strokeWidth="0.8" className="stroke-foreground/10" />}

          {shape.tick && (() => {
            const ys = [...shape.nodes.values()].map((b) => b.y);
            return <line x1={0} x2={0} y1={Math.min(...ys)} y2={Math.max(...ys)} strokeWidth="5" strokeLinecap="round" className="stroke-foreground/10" />;
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
                <text x={e.lx} y={e.ly} textAnchor={e.anchor} fontSize={EDGE_FONT} className="fill-foreground/60 font-mono">
                  {e.text}
                </text>
              )}
            </g>
          ))}

          {/* Retrace the path taken in the brand accent, drawing the latest segment */}
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
            isoOrder.map(({ state: s, scene }) => {
                if (scene) return <g key={`scene-${s.id}`}><SceneParts parts={scene.parts} /></g>;
                const k = shape.iso!.blocks.get(s.id)!;
                const here = s.id === at;
                const labelCls = cn("font-mono uppercase", here ? "fill-foreground" : "fill-muted-foreground/70");
                if (s.final)
                  return (
                    <g key={s.id}>
                      <ellipse cx={k.label[0]} cy={k.label[1]} rx={DISC * ISO_C * 1.4} ry={DISC * 0.7} strokeWidth="1.4" className={cn(PAPER, here ? RED : MUTED)} />
                      <ellipse cx={k.label[0]} cy={k.label[1]} rx={DISC * ISO_C * 0.75} ry={DISC * 0.38} className={here ? "fill-foreground" : "fill-muted-foreground/70"} />
                      <text x={k.label[0]} y={k.label[1] + 24} textAnchor="middle" fontSize={NODE_FONT} letterSpacing="0.08em" className={labelCls}>
                        {s.label}
                      </text>
                    </g>
                  );
                return (
                  // The current step's block lifts slightly, as if picked up for a closer look
                  <motion.g key={s.id} animate={{ y: here ? -7 : 0 }} transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 520, damping: 34 }}>
                    <polygon points={poly(k.side)} strokeWidth="1.2" strokeLinejoin="round" className={cn(FACE_SIDE, INK)} />
                    <polygon points={poly(k.front)} strokeWidth="1.2" strokeLinejoin="round" className={cn(FACE_FRONT, INK)} />
                    <polygon points={poly(k.top)} strokeWidth={here ? 2 : 1.2} strokeLinejoin="round" className={cn(PAPER, here ? RED : MUTED)} />
                    {/* Name printed on the front face, skewed along with it */}
                    <text transform={`matrix(${ISO_C} ${-ISO_S} 0 1 ${k.label[0]} ${k.label[1]})`} textAnchor="middle" fontSize={ISO_FONT} letterSpacing="0.08em" className={labelCls}>
                      {s.label}
                    </text>
                    {s.note && (
                      <text x={k.note[0]} y={k.note[1] + 16} textAnchor="middle" fontSize={EDGE_FONT} className="fill-foreground/55">
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
                  <text key={i} x={e.lx} y={e.ly} fontSize={EDGE_FONT} strokeWidth="3" paintOrder="stroke" className="fill-foreground/65 stroke-card font-mono">
                    {e.text}
                  </text>
                ),
            )}

          {/* Figure walking the flow: wears an accent-coloured top, the same "you are here" colour as the outline and the current block */}
          {isIso && walker && (
            <motion.g style={{ x: tx, y: ty }} aria-hidden>
              <Figure tone="red" />
            </motion.g>
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
                      <circle cx={b.x} cy={b.y} r="7.5" strokeWidth="1.4" className={cn(PAPER, here ? RED : MUTED)} />
                      <circle cx={b.x} cy={b.y} r="4" className={here ? "fill-foreground" : "fill-muted-foreground/70"} />
                    </>
                  ) : (
                    <circle cx={b.x} cy={b.y} r={here ? 7 : 5.5} strokeWidth="1.5" className={cn(here ? "fill-foreground" : PAPER, seen ? INK : MUTED)} />
                  )}
                  <text x={b.x + 18} y={b.y + 4} fontSize={NODE_FONT} letterSpacing="0.08em" className={cn("font-mono uppercase", here ? "fill-foreground" : "fill-muted-foreground/70")}>
                    {s.label}
                  </text>
                  {s.note && (
                    <text x={b.x + 18} y={b.y + 20} fontSize={EDGE_FONT} className="fill-foreground/55">
                      {s.note}
                    </text>
                  )}
                </g>
              );
            return (
              <g key={s.id}>
                {s.final ? (
                  <>
                    <circle cx={b.x} cy={b.y} r="9" strokeWidth="1.4" className={cn(PAPER, here ? RED : MUTED)} />
                    <circle cx={b.x} cy={b.y} r="5" className={here ? "fill-foreground" : "fill-muted-foreground/70"} />
                    <text x={b.x} y={b.y + 26} textAnchor="middle" fontSize={NODE_FONT} letterSpacing="0.08em" className={cn("font-mono uppercase", here ? "fill-foreground" : "fill-muted-foreground/70")}>
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
                    <text x={b.x} y={b.y + 4} textAnchor="middle" fontSize={NODE_FONT} letterSpacing="0.08em" className="fill-foreground font-mono uppercase">
                      {s.label}
                    </text>
                    {s.note && (
                      <text x={b.x} y={b.y + b.h / 2 + 15} textAnchor="middle" fontSize={EDGE_FONT} className="fill-foreground/55">
                        {s.note}
                      </text>
                    )}
                  </>
                )}
              </g>
            );
          })}

          {moved > 0 && !isIso && <motion.circle r="4.5" cx={tx} cy={ty} strokeWidth="2" className="fill-foreground stroke-card" />}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={playAll} className={cn("inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-sm font-medium transition-opacity hover:opacity-90 active:scale-[0.97]", spotFill)}>
          <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
            <path d="M5 3.5v9l7-4.5z" fill="currentColor" />
          </svg>
          {copy.play}
        </button>
        <button type="button" onClick={() => press(NEXT)} className="inline-flex h-8 items-center rounded-md border border-foreground/70 px-3 text-sm transition-colors hover:bg-foreground/5 active:scale-[0.97] dark:hover:bg-foreground/10">
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
                ? "border-foreground/70"
                : "border-foreground/10 text-muted-foreground",
            )}
          >
            {can(e) && <span aria-hidden className="size-1.5 rounded-full bg-foreground" />}
            {chart.eventLabel(e)}
          </button>
        ))}
        {showLogic && (
          <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls={`${uid}-logic`} className="ml-auto inline-flex h-8 items-center px-1 text-sm text-muted-foreground underline decoration-dotted underline-offset-4 hover:text-foreground motion-safe:active:scale-[0.97] transition-[color,background-color,border-color,opacity,scale]">
            {copy.logic}
          </button>
        )}
      </div>

      <p ref={lineRef} aria-live="polite" className={cn("mt-2 min-h-5 text-sm", message.refused ? "text-foreground" : "text-muted-foreground")}>
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
          <div className="mt-3 space-y-4 border-t border-foreground/10 pt-3 text-sm">
            <ul className="space-y-1.5">
              {checks.map((c) => (
                <li key={c.id} className="flex gap-2">
                  <svg viewBox="0 0 16 16" className={cn("mt-0.5 size-4 shrink-0", c.ok ? "text-emerald-700 dark:text-emerald-400" : "text-destructive")} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden>
                    {c.ok ? <path d="M3.5 8.5l3 3 6-7" /> : <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />}
                  </svg>
                  <span>
                    {copy.checks[c.id]}
                    {!c.ok && <span className="block font-mono text-xs text-muted-foreground">{c.detail.join(", ")}</span>}
                  </span>
                </li>
              ))}
            </ul>
            {machine.rules?.length ? (
              <ul className="space-y-1.5">
                {machine.rules.map((r) => (
                  <li key={r.rule}>
                    <span className="font-medium">{r.rule}</span>
                    {r.says && <span className="block text-muted-foreground">{r.says}</span>}
                  </li>
                ))}
              </ul>
            ) : null}
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground">{copy.moves}</p>
              <ul className="mt-1.5 space-y-1 font-mono text-xs">
                {machine.transitions.map((t, i) => (
                  <li key={i} className={cn(path.includes(i) && "text-foreground")}>
                    {chart.name(t.from)} → {chart.name(t.to)}
                    <span className="text-muted-foreground">
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
