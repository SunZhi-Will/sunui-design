<script lang="ts" module>
  import type { HTMLButtonAttributes } from "svelte/elements";
  import type { Snippet } from "svelte";

  export type LoadingButtonState = "idle" | "loading" | "success" | "error";

  export interface LoadingButtonProps extends Omit<HTMLButtonAttributes, "onclick" | "children" | "class"> {
    children: Snippet | string;
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
  }

  /** Brand accent: follows the theme's --primary by default; buyers set --sunui-spot to use their own brand colour. Used only for selection, offers and current progress */
  const spotFill = "bg-[color:var(--sunui-spot,var(--primary))] text-[color:var(--sunui-spot-foreground,var(--primary-foreground))]";

  const springs = {
    snappy: { type: "spring", stiffness: 520, damping: 34 },
    gentle: { type: "spring", stiffness: 240, damping: 30 },
  } as const;
</script>

<script lang="ts">
  import { onDestroy, tick, untrack } from "svelte";
  import { prefersReducedMotion } from "svelte/motion";
  import { animate, cubicBezier } from "motion";
  import type { AnimationPlaybackControls } from "motion";
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

  const reduce = $derived(prefersReducedMotion.current);
  let inner = $state<LoadingButtonState>("idle");
  const cur = $derived<LoadingButtonState>(stateProp ?? inner);
  let alive = true;
  let timer: number | undefined;

  onDestroy(() => {
    alive = false;
    window.clearTimeout(timer);
    widthAnim?.stop();
    scaleAnim?.stop();
  });

  $effect(() => {
    if (stateProp !== undefined || resetAfter <= 0 || (cur !== "success" && cur !== "error")) return;
    timer = window.setTimeout(() => alive && (inner = "idle"), resetAfter);
    return () => window.clearTimeout(timer);
  });

  const handle = async () => {
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
  };

  const shrunk = $derived(loadingStyle === "shrink" && cur === "loading");
  const contentKey = $derived(shrunk ? "spin" : cur);

  // ---- layout animation (width), rebuilt by hand ----
  let btn: HTMLButtonElement | undefined = $state();
  let content: HTMLElement | undefined = $state();
  let widthAnim: AnimationPlaybackControls | undefined;
  let scaleAnim: AnimationPlaybackControls | undefined;
  let firstRun = true;

  $effect.pre(() => {
    contentKey; // track
    const isReduce = untrack(() => reduce);
    if (firstRun || !btn) {
      firstRun = false;
      return;
    }
    const el = btn;
    const old = content;
    const from = el.offsetWidth;
    const bRect = el.getBoundingClientRect();
    const oRect = old?.getBoundingClientRect();
    widthAnim?.stop();
    widthAnim = undefined;
    el.style.width = "";
    tick().then(() => {
      // take every leaving node out of flow, pinned where it was
      el.querySelectorAll<HTMLElement>("[data-lb-content]").forEach((n) => {
        if (n === content || n.dataset.pinned) return;
        n.dataset.pinned = "1";
        if (n === old && oRect) {
          Object.assign(n.style, {
            position: "absolute",
            left: `${oRect.left - bRect.left - el.clientLeft}px`,
            top: `${oRect.top - bRect.top - el.clientTop}px`,
            width: `${oRect.width}px`,
            height: `${oRect.height}px`,
          });
        } else {
          n.style.position = "absolute";
        }
      });
      if (isReduce) return;
      const to = el.offsetWidth;
      if (Math.abs(to - from) < 0.5) return;
      el.style.width = `${from}px`;
      const ctl = animate(el, { width: [`${from}px`, `${to}px`] }, springs.gentle);
      widthAnim = ctl;
      ctl.then(() => {
        if (widthAnim === ctl) {
          el.style.width = "";
          widthAnim = undefined;
        }
      });
    });
  });

  // ---- crossfade with a small vertical slide ----
  const ease = cubicBezier(0, 0, 0.58, 1);
  function slideIn(_node: Element) {
    const r = prefersReducedMotion.current;
    return {
      duration: r ? 0 : 140,
      easing: ease,
      css: (t: number, u: number) => `opacity:${t};transform:translateY(${r ? 0 : u * 6}px)`,
    };
  }
  function slideOut(_node: Element) {
    const r = prefersReducedMotion.current;
    return {
      duration: r ? 0 : 140,
      easing: ease,
      css: (t: number, u: number) => `opacity:${t};transform:translateY(${r ? 0 : -u * 6}px)`,
    };
  }

  // ---- press feedback (whileTap, with the element's own gentle spring) ----
  let pressed = false;
  function down() {
    if (reduce || cur === "loading") return;
    pressed = true;
    scaleAnim?.stop();
    scaleAnim = animate(btn!, { scale: 0.97 }, springs.gentle);
  }
  function up() {
    if (!pressed) return;
    pressed = false;
    scaleAnim?.stop();
    scaleAnim = animate(btn!, { scale: 1 }, springs.gentle);
  }

  // ---- check path draw ----
  function draw(node: SVGPathElement) {
    if (prefersReducedMotion.current) return;
    const ctl = animate(node, { strokeDashoffset: [1, 0] }, { duration: 0.28, ease: "easeOut" });
    return { destroy: () => ctl.stop() };
  }
</script>

{#snippet lab(v: Snippet | string)}
  {#if typeof v === "string"}{v}{:else}{@render v()}{/if}
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
      stroke-dasharray="1"
      style="stroke-dashoffset: {reduce ? 0 : 1}"
      use:draw
    />
  </svg>
{/snippet}

<button
  {...rest}
  bind:this={btn}
  {type}
  onclick={handle}
  onpointerdown={down}
  onpointerup={up}
  onpointercancel={up}
  onpointerleave={up}
  {disabled}
  aria-busy={cur === "loading" ? true : undefined}
  aria-disabled={cur === "loading" ? true : undefined}
  style:border-radius="{shrunk ? 999 : 6}px"
  class={cn(
    "relative inline-flex h-10 items-center justify-center overflow-hidden whitespace-nowrap text-sm font-medium outline-offset-2 focus-visible:outline-2 disabled:pointer-events-none disabled:opacity-50",
    shrunk ? "w-10 px-0" : "px-4",
    variant === "primary" && cur !== "error" && spotFill,
    variant === "paper" && "border border-foreground/10 bg-card text-foreground",
    cur === "error" && "bg-destructive text-white",
    className,
  )}
>
  {#key contentKey}
    <span
      bind:this={content}
      data-lb-content
      in:slideIn
      out:slideOut
      class="inline-flex items-center gap-2"
    >
      {#if shrunk}
        {@render spinner()}
      {:else if cur === "loading"}
        {@render spinner()}
        {@render lab(children)}
      {:else if cur === "success"}
        {@render check()}
        {@render lab(successLabel)}
      {:else if cur === "error"}
        {@render lab(errorLabel)}
      {:else}
        {@render lab(children)}
      {/if}
    </span>
  {/key}
  <span class="sr-only" aria-live="polite">
    {#if cur === "loading"}{loadingLabel}{:else if cur === "success"}{@render lab(successLabel)}{:else if cur === "error"}{@render lab(errorLabel)}{/if}
  </span>
</button>
