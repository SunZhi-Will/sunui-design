<script lang="ts" module>
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";

  export type LoadingButtonState = "idle" | "loading" | "success" | "error";

  export interface LoadingButtonProps extends Omit<HTMLButtonAttributes, "onclick" | "children" | "class" | "type"> {
    children?: Snippet | string;
    /** When it returns a Promise, switches loading → success (resolve) or error (reject) automatically */
    onclick?: () => unknown;
    /** Controlled state; when given, the component stops managing it itself */
    state?: LoadingButtonState;
    successLabel?: Snippet | string;
    errorLabel?: Snippet | string;
    /** Text screen readers read while loading */
    loadingLabel?: string;
    /** shrink: shrinks to a circle while loading; inline: keeps its width and the spinner appears before the text */
    loadingStyle?: "shrink" | "inline";
    /** Milliseconds before returning to idle after success or failure; 0 stays on the result */
    resetAfter?: number;
    variant?: "primary" | "paper";
    class?: string;
    type?: "button" | "submit" | "reset";
  }

  /** Brand accent: follows the theme's --primary by default; buyers set --sunui-spot to use their own brand colour. Used only for selection, offers and current progress */
  const spotFill = "bg-[color:var(--sunui-spot,var(--primary))] text-[color:var(--sunui-spot-foreground,var(--primary-foreground))]";

  const gentle = { type: "spring", stiffness: 240, damping: 30 } as const;
</script>

<script lang="ts">
  import { animate, cubicBezier } from "motion";
  import { onDestroy, tick, untrack } from "svelte";
  import { prefersReducedMotion } from "svelte/motion";

  import { cn } from "@/lib/utils";

  let {
    children,
    onclick,
    state: stateProp,
    successLabel = "Done",
    errorLabel = "Try again",
    loadingLabel = "Loading",
    loadingStyle = "shrink",
    resetAfter = 2000,
    variant = "primary",
    class: className,
    disabled,
    type = "button",
    ...rest
  }: LoadingButtonProps = $props();

  let inner = $state<LoadingButtonState>("idle");
  const cur = $derived<LoadingButtonState>(stateProp ?? inner);
  const reduce = $derived(prefersReducedMotion.current);
  const shrunk = $derived(loadingStyle === "shrink" && cur === "loading");
  const key = $derived(shrunk ? "spin" : cur);

  let alive = true;
  let el: HTMLButtonElement | undefined;
  // svelte-ignore non_reactive_update
  let contentEl: HTMLElement | undefined;

  onDestroy(() => {
    alive = false;
    stopPress();
    widthAnim?.stop();
  });

  // Return to idle after success or error (uncontrolled only)
  $effect(() => {
    if (stateProp !== undefined || resetAfter <= 0 || (cur !== "success" && cur !== "error")) return;
    const timer = window.setTimeout(() => alive && (inner = "idle"), resetAfter);
    return () => window.clearTimeout(timer);
  });

  async function handle() {
    if (cur === "loading") return;
    const result = onclick?.();
    if (stateProp !== undefined || !(result instanceof Promise)) return;
    inner = "loading";
    try {
      await result;
      if (alive) inner = "success";
    } catch {
      if (alive) inner = "error";
    }
  }

  // ---- press feedback (whileTap: scale 0.97 with the gentle spring) ----
  let pressed = false;
  let pressAnim: { stop: () => void } | undefined;

  function press() {
    if (!el || reduce || cur === "loading" || pressed) return;
    pressed = true;
    pressAnim?.stop();
    pressAnim = animate(el, { scale: 0.97 }, gentle);
  }

  function release() {
    window.removeEventListener("pointerup", release);
    window.removeEventListener("pointercancel", release);
    if (!pressed || !el) return;
    pressed = false;
    pressAnim?.stop();
    pressAnim = animate(el, { scale: 1 }, reduce ? { duration: 0 } : gentle);
  }

  function stopPress() {
    window.removeEventListener("pointerup", release);
    window.removeEventListener("pointercancel", release);
    pressAnim?.stop();
  }

  function onpointerdown(e: PointerEvent) {
    if (e.button !== 0 || disabled) return;
    press();
    if (pressed) {
      window.addEventListener("pointerup", release);
      window.addEventListener("pointercancel", release);
    }
  }

  function onkeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.repeat && !disabled) press();
  }

  function onkeyup(e: KeyboardEvent) {
    if (e.key === "Enter") release();
  }

  // A press does not survive entering loading or switching to reduced motion
  $effect(() => {
    if (reduce || cur === "loading") release();
  });

  // ---- corner radius: 6 normally, 999 while shrunk ----
  let radiusFirst = true;
  $effect(() => {
    const target = `${shrunk ? 999 : 6}px`;
    const instant = radiusFirst || reduce;
    radiusFirst = false;
    if (!el) return;
    if (instant) {
      el.style.borderRadius = target;
      return;
    }
    const controls = animate(el, { borderRadius: target }, gentle);
    return () => controls.stop();
  });

  // ---- width (layout): same element grows or shrinks to its new size ----
  let widthAnim: { stop: () => void } | undefined;
  let lastKey = untrack(() => key);
  let pending: { from: number; prev: HTMLElement | undefined; box: { left: number; top: number; width: number; height: number } | undefined } | undefined;

  $effect.pre(() => {
    const k = key;
    if (k === lastKey) return;
    lastKey = k;
    if (!el) return;
    const btn = el;
    const prev = contentEl;
    // capture the leaving node's box and the current visual width before the DOM changes
    const btnRect = btn.getBoundingClientRect();
    const r = prev?.getBoundingClientRect();
    const box = r
      ? { left: r.left - btnRect.left - btn.clientLeft, top: r.top - btnRect.top - btn.clientTop, width: r.width, height: r.height }
      : undefined;
    const from = btnRect.width;
    widthAnim?.stop();
    widthAnim = undefined;
    btn.style.width = "";
    pending = { from, prev, box };
    const mine = pending;
    tick().then(() => {
      if (pending !== mine) return;
      pending = undefined;
      // popLayout: the leaving node holds no layout space
      if (mine.prev && mine.box && mine.prev !== contentEl && mine.prev.isConnected) {
        const s = mine.prev.style;
        s.position = "absolute";
        s.left = `${mine.box.left}px`;
        s.top = `${mine.box.top}px`;
        s.width = `${mine.box.width}px`;
        s.height = `${mine.box.height}px`;
        s.margin = "0";
      }
      if (reduce) return;
      const to = btn.getBoundingClientRect().width;
      if (Math.abs(to - mine.from) < 0.5) return;
      btn.style.width = `${mine.from}px`;
      const controls = animate(btn, { width: [`${mine.from}px`, `${to}px`] }, gentle);
      widthAnim = controls;
      controls.then(() => {
        if (widthAnim === controls) {
          widthAnim = undefined;
          btn.style.width = "";
        }
      });
    });
  });

  // ---- content swap: fade 0.14s (easeInOut) with a 6px vertical slide ----
  const fadeEase = cubicBezier(0.42, 0, 0.58, 1);

  function contentIn(_node: Element) {
    const rm = prefersReducedMotion.current;
    return {
      duration: rm ? 0 : 140,
      easing: fadeEase,
      css: (t: number) => `opacity: ${t}; transform: translateY(${rm ? 0 : (1 - t) * 6}px)`,
    };
  }

  function contentOut(_node: Element) {
    const rm = prefersReducedMotion.current;
    return {
      duration: rm ? 0 : 140,
      easing: fadeEase,
      // t runs 1 -> 0 on exit
      css: (t: number) => `opacity: ${t}; transform: translateY(${rm ? 0 : -(1 - t) * 6}px)`,
    };
  }

  // Check stroke draws from 0 to full length over 0.28s ease-out
  function draw(node: SVGPathElement, skip: boolean) {
    if (skip) return;
    const controls = animate(node, { pathLength: [0, 1] }, { duration: 0.28, ease: "easeOut" });
    return { destroy: () => controls.stop() };
  }
</script>

{#snippet text(v: Snippet | string | undefined)}
  {#if typeof v === "function"}{@render v()}{:else}{v}{/if}
{/snippet}

{#snippet spinner(cls?: string)}
  <svg viewBox="0 0 24 24" fill="none" class={cn("size-4 animate-spin", cls)} aria-hidden="true">
    <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity="0.25" stroke-width="2" />
    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
  </svg>
{/snippet}

{#snippet check()}
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="size-4" aria-hidden="true">
    <path
      d="M5 12.5l4.5 4.5L19 7.5"
      pathLength="1"
      style="stroke-dasharray: {reduce ? '1 1' : '0 1'}; stroke-dashoffset: 0"
      use:draw={reduce}
    />
  </svg>
{/snippet}

<button
  {...rest}
  bind:this={el}
  {type}
  {disabled}
  onclick={handle}
  {onpointerdown}
  {onkeydown}
  {onkeyup}
  onblur={release}
  aria-busy={cur === "loading" ? true : undefined}
  aria-disabled={cur === "loading" ? true : undefined}
  class={cn(
    "relative inline-flex h-10 items-center justify-center overflow-hidden whitespace-nowrap text-sm font-medium outline-offset-2 focus-visible:outline-2 disabled:pointer-events-none disabled:opacity-50",
    shrunk ? "w-10 px-0" : "px-4",
    variant === "primary" && cur !== "error" && spotFill,
    variant === "paper" && "border border-foreground/10 bg-card text-foreground",
    cur === "error" && "bg-destructive text-white",
    className,
  )}
>
  {#key key}
    <span bind:this={contentEl} in:contentIn out:contentOut class="inline-flex items-center gap-2">
      {#if shrunk}
        {@render spinner()}
      {:else if cur === "loading"}
        {@render spinner()}
        {@render text(children)}
      {:else if cur === "success"}
        {@render check()}
        {@render text(successLabel)}
      {:else if cur === "error"}
        {@render text(errorLabel)}
      {:else}
        {@render text(children)}
      {/if}
    </span>
  {/key}
  <span class="sr-only" aria-live="polite">
    {#if cur === "loading"}{loadingLabel}{:else if cur === "success"}{@render text(successLabel)}{:else if cur === "error"}{@render text(errorLabel)}{/if}
  </span>
</button>
