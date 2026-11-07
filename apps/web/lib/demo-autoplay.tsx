"use client";

import { motion, useAnimationControls } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";

/**
 * 網站預覽專用：讓 demo 自己演一次（自動填寫、點擊），訪客不必動手就看得到招牌動態。
 * 跟 demo-locale 一樣只給 demo.tsx 用，不進 registry，元件本身不需要為此加任何 prop。
 *
 * 規則（見 reports/七個普通元件重做分析-2026-11-08.md 第 5 節）：
 * - 進到畫面才開始，播一次停在最終狀態；網站的「重播」會重新載入 iframe。
 * - 離開畫面或分頁隱藏時暫停計時，回來從原處繼續。
 * - 使用者在容器內按下滑鼠或鍵盤就中止劇本，把控制權交還。
 * - 減少動態：游標不移動，文字一次填入，狀態照順序切換。
 */

export interface DemoDriver {
  /** 等待；畫面外或分頁隱藏時不計時 */
  wait: (ms: number) => Promise<void>;
  /** 游標滑到目標再點下去，觸發元件真正的 onClick */
  click: (target: Target) => Promise<void>;
  /** 游標滑到目標並停住，觸發 pointerenter（懸停預覽用），不點擊 */
  hover: (target: Target) => Promise<void>;
  /** 游標離開目標，觸發 pointerleave */
  unhover: (target: Target) => Promise<void>;
  /** 逐字輸入到 input（走 React 的 onChange） */
  type: (target: Target, text: string, opts?: { cps?: number }) => Promise<void>;
  /** 清空 input */
  clear: (target: Target) => Promise<void>;
  /** 在 input 上按 Enter：送出所在的表單 */
  submit: (target: Target) => Promise<void>;
  /** 在容器內找元素；text 用來比對可見文字（各語系由 demo 傳入當下的字串） */
  find: (selector: string, text?: string) => HTMLElement;
  /** 收起游標 */
  hideCursor: () => Promise<void>;
}

type Target = string | HTMLElement | (() => HTMLElement | null | undefined);

class Aborted extends Error {}

const valueSetter = () => Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;

function reduced() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * 用法：
 * const ref = useRef<HTMLDivElement>(null);
 * const cursor = useDemoAutoplay(ref, async (d) => { await d.wait(800); await d.click("button"); });
 * return <div ref={ref} className="relative">...{cursor}</div>;
 */
export function useDemoAutoplay(
  ref: RefObject<HTMLElement | null>,
  script: (d: DemoDriver) => Promise<void>,
  { startDelay = 600 }: { startDelay?: number } = {},
): ReactNode {
  const controls = useAnimationControls();
  const [shown, setShown] = useState(false);
  const scriptRef = useRef(script);
  scriptRef.current = script;

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    let aborted = false;
    let inView = false;
    let started = false;
    const pos = { x: 0, y: 0 };
    const rm = reduced();
    let shownLocal = false;

    const active = () => inView && document.visibilityState === "visible";
    const check = () => {
      if (aborted) throw new Aborted();
    };

    // 只在可見時累計時間
    const wait = (ms: number) =>
      new Promise<void>((resolve, reject) => {
        let left = ms;
        let last = performance.now();
        // setTimeout 而不是 rAF：rAF 在背景會被降到極低頻率，打字節奏會亂掉
        const tick = () => {
          if (aborted) return reject(new Aborted());
          const now = performance.now();
          if (active()) left -= now - last;
          last = now;
          if (left <= 0) resolve();
          else setTimeout(tick, Math.min(left, 100));
        };
        if (ms <= 0) resolve();
        else setTimeout(tick, Math.min(ms, 100));
      });

    const resolveTarget = (t: Target): HTMLElement => {
      const el = typeof t === "string" ? root.querySelector<HTMLElement>(t) : typeof t === "function" ? t() : t;
      if (!el) throw new Aborted();
      return el;
    };

    const find = (selector: string, text?: string) => {
      // 只找看得見的：同一個元件常有寬窄兩種版面，隱藏的那份不算
      const all = Array.from(root.querySelectorAll<HTMLElement>(selector)).filter((n) => n.getClientRects().length > 0);
      const el = text ? all.find((n) => n.textContent?.replace(/\s+/g, " ").includes(text)) : all[0];
      if (!el) throw new Aborted();
      return el;
    };

    // 游標指向目標中心偏下一點，像真的指著按鈕
    const moveTo = async (el: HTMLElement) => {
      check();
      const r = el.getBoundingClientRect();
      const box = root.getBoundingClientRect();
      const x = Math.min(r.width - 6, Math.max(6, r.width / 2)) + r.left - box.left;
      const y = r.top - box.top + r.height * 0.6;
      if (rm) {
        pos.x = x;
        pos.y = y;
        return;
      }
      if (!shownLocal) {
        // 第一次出現：從目標右下方淡入
        controls.set({ x: x + 40, y: y + 36, opacity: 0, scale: 1 });
        setShown(true);
        shownLocal = true;
      }
      const dist = Math.hypot(x - pos.x, y - pos.y);
      pos.x = x;
      pos.y = y;
      await controls.start({
        x,
        y,
        opacity: 1,
        transition: { type: "spring", bounce: 0.1, duration: Math.min(0.9, 0.4 + dist / 900) },
      });
      check();
    };
    const press = async () => {
      if (rm) return;
      await controls.start({ scale: 0.82, transition: { duration: 0.08 } });
      await controls.start({ scale: 1, transition: { type: "spring", stiffness: 520, damping: 30 } });
    };

    const driver: DemoDriver = {
      wait,
      find,
      async click(t) {
        const el = resolveTarget(t);
        await moveTo(el);
        await wait(rm ? 0 : 120);
        await press();
        check();
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) el.focus({ preventScroll: true });
        else el.click();
        await wait(rm ? 0 : 80);
      },
      async hover(t) {
        const el = resolveTarget(t);
        await moveTo(el);
        check();
        // React 的 onPointerEnter / onMouseEnter 聽的是 over 事件
        el.dispatchEvent(new PointerEvent("pointerover", { bubbles: true }));
        el.dispatchEvent(new MouseEvent("mouseover", { bubbles: true }));
      },
      async unhover(t) {
        const el = resolveTarget(t);
        check();
        el.dispatchEvent(new PointerEvent("pointerout", { bubbles: true, relatedTarget: document.body }));
        el.dispatchEvent(new MouseEvent("mouseout", { bubbles: true, relatedTarget: document.body }));
      },
      async type(t, text, { cps = 17 } = {}) {
        const el = resolveTarget(t) as HTMLInputElement;
        el.focus({ preventScroll: true });
        const set = valueSetter();
        if (rm) {
          set.call(el, el.value + text);
          el.dispatchEvent(new Event("input", { bubbles: true }));
          return;
        }
        for (const ch of text) {
          check();
          set.call(el, el.value + ch);
          el.dispatchEvent(new Event("input", { bubbles: true }));
          // 人打字的節奏：平均 1000/cps，帶一點隨機
          await wait((1000 / cps) * (0.7 + Math.random() * 0.6));
        }
      },
      async clear(t) {
        const el = resolveTarget(t) as HTMLInputElement;
        el.focus({ preventScroll: true });
        valueSetter().call(el, "");
        el.dispatchEvent(new Event("input", { bubbles: true }));
        await wait(rm ? 0 : 120);
      },
      async submit(t) {
        const el = resolveTarget(t) as HTMLInputElement;
        check();
        if (el.form) el.form.requestSubmit();
        else el.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
        await wait(rm ? 0 : 80);
      },
      async hideCursor() {
        if (rm || !shownLocal) return;
        await controls.start({ opacity: 0, transition: { duration: 0.2 } });
      },
    };

    // 使用者接手：任何真實的按下或按鍵都中止劇本
    const takeOver = (e: Event) => {
      if (!e.isTrusted || aborted) return;
      aborted = true;
      controls.start({ opacity: 0, transition: { duration: 0.12 } });
    };
    root.addEventListener("pointerdown", takeOver, true);
    root.addEventListener("keydown", takeOver, true);

    const run = async () => {
      try {
        await wait(startDelay);
        await scriptRef.current(driver);
        await wait(rm ? 0 : 500);
        await driver.hideCursor();
      } catch (e) {
        if (!(e instanceof Aborted)) console.error(e);
      }
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        // 比視窗高的區塊（評價牆）永遠到不了固定比例：看得見的高度達到自身 35% 或視窗一半就算在畫面上
        const seen = entry.intersectionRect.height;
        inView = entry.isIntersecting && seen >= Math.min(entry.boundingClientRect.height * 0.35, window.innerHeight * 0.5);
        if (inView && !started) {
          started = true;
          void run();
        }
      },
      { threshold: Array.from({ length: 21 }, (_, i) => i / 20) },
    );
    io.observe(root);

    return () => {
      aborted = true;
      io.disconnect();
      root.removeEventListener("pointerdown", takeOver, true);
      root.removeEventListener("keydown", takeOver, true);
    };
    // 劇本只在掛載時跑一次；重播由外層重新載入 iframe
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      aria-hidden
      initial={{ opacity: 0 }}
      animate={controls}
      className="pointer-events-none absolute top-0 left-0 z-50"
      style={{ display: shown ? "block" : "none" }}
    >
      <Arrow />
    </motion.div>
  );
}

/** 中性灰箭頭：深淺色都讀得到（白填黑框），不加光暈 */
function Arrow() {
  return (
    <svg width="18" height="22" viewBox="0 0 18 22" className="-translate-x-[3px] -translate-y-[2px]">
      <path
        d="M2 1.5v16.2l4.3-3.9 2.9 6.6 2.8-1.2-2.9-6.5H15L2 1.5Z"
        fill="#fafafa"
        stroke="#171717"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
