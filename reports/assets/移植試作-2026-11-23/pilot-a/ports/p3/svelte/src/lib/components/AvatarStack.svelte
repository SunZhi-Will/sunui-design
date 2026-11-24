<script lang="ts" module>
  export interface AvatarStackPerson {
    id: string;
    /** Display name; give only the first name plus the initial of the surname, for example "Mina P." */
    name: string;
    /** Avatar image; when missing or failed to load, the initials are shown */
    src?: string;
    /** Second line of the tooltip, for example "Taipei, 2 hours ago" */
    note?: string;
  }

  export interface AvatarStackLabels {
    label: string;
    /** Name for +N; names are the collapsed people, and may be an empty string */
    more: (count: string, names: string) => string;
    /** Name of the clickable +N button */
    showMore: (count: string, names: string) => string;
    /** Separator used to join names */
    separator: string;
  }

  export interface AvatarStackProps {
    people: AvatarStackPerson[];
    /** Actual total count; when larger than the number of people, the difference is added to +N */
    total?: number;
    /** Maximum number of avatars shown, the rest go into +N */
    max?: number;
    size?: "sm" | "md" | "lg";
    /** Accessible name for the whole group of avatars, same as labels.label */
    label?: string;
    /** Fired when +N is clicked; when not provided, +N is plain text */
    onOverflowClick?: () => void;
    /** UI language and number format: en, zh-TW, zh-CN, ja */
    locale?: string;
    /** Override the built-in strings, takes priority over locale */
    labels?: Partial<AvatarStackLabels>;
    /** What people without a photo show: initials on a tint (default) or a stable gradient */
    fallback?: "initials" | "gradient";
    class?: string;
  }

  type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

  function resolveLocale(tag?: string): SunLocale {
    const t = (tag ?? "en").toLowerCase();
    if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
    if (t.startsWith("ja")) return "ja";
    return "en";
  }

  const MESSAGES: Record<SunLocale, AvatarStackLabels> = {
    en: {
      label: "Recent buyers",
      more: (n, names) => (names ? `${n} more, including ${names}` : `${n} more`),
      showMore: (n, names) => (names ? `Show ${n} more, including ${names}` : `Show ${n} more`),
      separator: ", ",
    },
    "zh-TW": {
      label: "最近購買",
      more: (n, names) => (names ? `還有 ${n} 人，包括 ${names}` : `還有 ${n} 人`),
      showMore: (n, names) => (names ? `查看其餘 ${n} 人，包括 ${names}` : `查看其餘 ${n} 人`),
      separator: "、",
    },
    "zh-CN": {
      label: "最近购买",
      more: (n, names) => (names ? `还有 ${n} 人，包括 ${names}` : `还有 ${n} 人`),
      showMore: (n, names) => (names ? `查看其余 ${n} 人，包括 ${names}` : `查看其余 ${n} 人`),
      separator: "、",
    },
    ja: {
      label: "最近の購入者",
      more: (n, names) => (names ? `ほか ${n} 人（${names} など）` : `ほか ${n} 人`),
      showMore: (n, names) => (names ? `ほか ${n} 人を表示（${names} など）` : `ほか ${n} 人を表示`),
      separator: "、",
    },
  };

  const surface = "bg-card shadow-[0_1px_2px_rgb(0_0_0/0.05),0_4px_12px_-6px_rgb(0_0_0/0.06)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]";
  const ink = "text-foreground";
  const inkOutline = "border-foreground/70";

  const springs = {
    snappy: { type: "spring", stiffness: 520, damping: 34 },
    pop: { type: "spring", stiffness: 460, damping: 26 },
  } as const;

  const CONTENT_SHADES = [12, 20, 28] as const;
  function contentTone(key: string) {
    let h = 0;
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
    const mix = CONTENT_SHADES[h % CONTENT_SHADES.length];
    return `background-color: color-mix(in oklch, var(--sunui-spot, var(--primary)) ${mix}%, transparent); color: var(--sunui-spot, var(--primary)); border-color: color-mix(in oklch, var(--sunui-spot, var(--primary)) 30%, transparent);`;
  }

  const GRADIENTS = [
    [40, 0],
    [55, 15],
    [28, 8],
    [65, 22],
    [48, 4],
  ] as const;

  function gradientOf(id: string) {
    let h = 0;
    for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
    const [tint, deep] = GRADIENTS[h % GRADIENTS.length];
    return `linear-gradient(135deg, color-mix(in oklch, var(--sunui-spot, var(--primary)) ${tint}%, white), color-mix(in oklch, var(--sunui-spot, var(--primary)), black ${deep}%))`;
  }

  const sizes = {
    sm: { box: 28, text: "text-[10px]", overlap: -7 },
    md: { box: 36, text: "text-xs", overlap: -9 },
    lg: { box: 44, text: "text-sm", overlap: -11 },
  };

  function initialsOf(name: string) {
    const parts = name.replace(/\./g, "").trim().split(/\s+/);
    return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
  }

  function compact(n: number, locale: string) {
    return new Intl.NumberFormat(locale, n >= 1_000 ? { notation: "compact", maximumFractionDigits: 1 } : {}).format(n);
  }
</script>

<script lang="ts">
  import { animate, cubicBezier } from "motion";
  import { prefersReducedMotion } from "svelte/motion";
  import { onMount } from "svelte";

  import { cn } from "@/lib/utils";

  let {
    people,
    total,
    max = 4,
    size = "md",
    label,
    onOverflowClick,
    locale = "en-US",
    labels,
    fallback = "initials",
    class: className,
  }: AvatarStackProps = $props();

  const reduce = $derived(prefersReducedMotion.current);
  const t = $derived({ ...MESSAGES[resolveLocale(locale)], ...(label !== undefined ? { label } : null), ...labels });
  const s = $derived(sizes[size]);
  const visible = $derived(people.slice(0, Math.max(0, max)));
  const hidden = $derived(people.slice(visible.length));
  const count = $derived(Math.max(total ?? people.length, people.length));
  const extra = $derived(count - visible.length);
  const extraText = $derived(`+${compact(extra, locale)}`);
  const hiddenNames = $derived(hidden.map((h) => h.name).join(t.separator));
  const extraLabel = $derived(t.more(String(extra), hiddenNames));
  const disc = $derived(
    cn("flex items-center justify-center rounded-full border font-medium tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", surface, ink, inkOutline, s.text),
  );

  let activeKey = $state<string | null>(null);
  let failed = $state<Record<string, boolean>>({});

  // Avatars present at mount do not animate; only later additions slide in
  let ready = false;
  onMount(() => {
    ready = true;
  });

  function enter(node: HTMLElement) {
    if (!ready) return;
    if (reduce) {
      animate(node, { opacity: [0, 1] }, { duration: 0 });
      return;
    }
    animate(node, { opacity: 0, scale: 0.6, x: -8 }, { duration: 0 });
    animate(node, { opacity: 1, scale: 1, x: 0 }, springs.pop);
  }

  const fadeEase = cubicBezier(0.42, 0, 0.58, 1);
  function leave(_node: Element) {
    return { duration: reduce ? 0 : 150, easing: fadeEase, css: (tt: number) => `opacity: ${tt}` };
  }

  function liftY(node: HTMLElement, active: boolean) {
    let first = true;
    let ctl: { stop: () => void } | undefined;
    const run = (a: boolean) => {
      ctl?.stop();
      const y = a && !reduce ? -3 : 0;
      ctl = animate(node, { y }, first || reduce ? { duration: 0 } : springs.snappy);
      first = false;
    };
    run(active);
    return {
      update: run,
      destroy: () => ctl?.stop(),
    };
  }

  function onerr(id: string) {
    failed[id] = true;
  }
</script>

{#snippet lift(key: string, title: string, note: string | undefined, body: import("svelte").Snippet)}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="relative"
    style:z-index={activeKey === key ? 50 : undefined}
    use:liftY={activeKey === key}
    onpointerenter={() => (activeKey = key)}
    onpointerleave={() => {
      if (activeKey === key) activeKey = null;
    }}
    onfocusin={() => (activeKey = key)}
    onfocusout={() => {
      if (activeKey === key) activeKey = null;
    }}
  >
    {@render body()}
    {#if activeKey === key}
      <span
        aria-hidden="true"
        class="pointer-events-none absolute bottom-full left-1/2 mb-2 w-max max-w-52 -translate-x-1/2 rounded-[3px] bg-foreground px-2 py-1 text-xs text-background"
      >
        <span class="block truncate font-medium">{title}</span>
        {#if note}<span class="block truncate opacity-70">{note}</span>{/if}
      </span>
    {/if}
  </div>
{/snippet}

<ul aria-label={`${t.label} (${count})`} class={cn("flex items-center", className)}>
  {#each visible as p, i (p.id)}
    {@const useGradient = fallback === "gradient" && !p.src}
    <li
      class="relative"
      style="margin-left: {i === 0 ? 0 : s.overlap}px; z-index: {visible.length - i + 1};"
      use:enter
      out:leave
    >
      {#snippet face()}
        <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
        <span
          role="img"
          tabindex="0"
          aria-label={p.note ? `${p.name}, ${p.note}` : p.name}
          class={cn(disc, "overflow-hidden", useGradient && "border-2 border-card")}
          style="width: {s.box}px; height: {s.box}px; {p.src ? '' : fallback === 'gradient' ? `background-image: ${gradientOf(p.id)};` : contentTone(p.id)}"
        >
          {#if p.src && !failed[p.id]}
            <img src={p.src} alt="" onerror={() => onerr(p.id)} class="size-full object-cover" />
          {:else if !(fallback === "gradient" && !p.src)}
            <span aria-hidden="true">{initialsOf(p.name)}</span>
          {/if}
        </span>
      {/snippet}
      {@render lift(p.id, p.name, p.note, face)}
    </li>
  {/each}
  {#if extra > 0}
    <li class="relative" style="margin-left: {s.overlap}px; z-index: 1;">
      {#snippet ov()}
        {#if onOverflowClick}
          <button
            type="button"
            onclick={() => onOverflowClick?.()}
            aria-label={t.showMore(String(extra), hiddenNames)}
            class={cn(disc, "px-1.5 hover:bg-muted dark:hover:bg-foreground/10 motion-safe:active:scale-[0.97] transition-[color,background-color,border-color,opacity,scale]")}
            style="min-width: {s.box}px; height: {s.box}px;"
          >
            {extraText}
          </button>
        {:else}
          <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
          <span role="img" tabindex="0" aria-label={extraLabel} class={cn(disc, "px-1.5")} style="min-width: {s.box}px; height: {s.box}px;">
            {extraText}
          </span>
        {/if}
      {/snippet}
      {@render lift("overflow", hiddenNames || t.more(compact(extra, locale), ""), undefined, ov)}
    </li>
  {/if}
</ul>
