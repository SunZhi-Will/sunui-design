<script lang="ts">
  import AvatarStack, { type AvatarStackPerson } from "@/lib/components/AvatarStack.svelte";

  const buyers: AvatarStackPerson[] = [
    { id: "1", name: "Mina P.", note: "Taipei, 2 hours ago" },
    { id: "2", name: "Leo C.", note: "Osaka, 5 hours ago" },
    { id: "3", name: "Ava L.", note: "Seoul, yesterday" },
    { id: "4", name: "Noah W.", note: "Taichung, yesterday" },
    { id: "5", name: "Sara K.", note: "Singapore, 2 days ago" },
  ];

  const related = [
    { kind: "mug", name: "Stoneware Mug", price: "$24", buyers: 412, from: 1, to: 4 },
    { kind: "tote", name: "Market Tote", price: "$36", buyers: 96, from: 3, to: 5 },
  ];
</script>

<div class="grid w-full max-w-3xl gap-6 text-foreground md:grid-cols-[1.4fr_1fr]">
  <article class="grid gap-5 rounded-xl border border-border bg-card p-4 sm:grid-cols-[9rem_1fr] sm:p-5">
    <div class="rounded-[3px] bg-muted max-sm:aspect-[16/9] sm:aspect-square"></div>
    <div class="flex flex-col">
      <h2 class="text-lg font-semibold tracking-tight">Steel Bottle</h2>
      <p class="mt-1 text-sm text-muted-foreground">Double-wall steel, keeps drinks cold for 24 hours.</p>
      <p class="mt-3 text-xl font-semibold tracking-tight tabular-nums">$32</p>
      <div class="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border pt-4">
        <AvatarStack people={buyers} total={1284} max={4} locale="en" />
        <p class="min-w-[9rem] flex-1 text-xs leading-snug text-muted-foreground">
          <span class="font-medium text-foreground tabular-nums">{new Intl.NumberFormat("en").format(1284)}</span> bought in the last 30 days
        </p>
      </div>
      <button
        type="button"
        class="mt-5 h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none sm:w-fit motion-safe:active:scale-[0.97] transition-[color,background-color,border-color,opacity,scale]"
      >
        Add to cart
      </button>
    </div>
  </article>

  <section aria-labelledby="related-heading" class="space-y-3">
    <h3 id="related-heading" class="text-sm font-semibold">Often bought together</h3>
    <ul class="space-y-3">
      {#each related as r (r.kind)}
        <li class="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
          <div class="size-14 shrink-0 rounded-[3px] bg-muted"></div>
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">{r.name}</p>
            <p class="text-sm tracking-tight tabular-nums">{r.price}</p>
          </div>
          <AvatarStack people={buyers.slice(r.from, r.to)} total={r.buyers} max={2} size="sm" fallback="gradient" locale="en" label={`Buyers of ${r.name}`} />
        </li>
      {/each}
    </ul>
  </section>
</div>
