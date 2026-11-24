<script lang="ts">
  import Pagination from "@/lib/components/Pagination.svelte";

  const PER_PAGE = 24;
  const TOTAL_ITEMS = 286;
  const t = {
    range: (a: number, b: number, n: number) => `${a} to ${b} of ${n} items`,
    home: "Home and living",
    orders: "Order history",
    reviews: "Customer reviews",
  };

  let page = $state(6);
  const pages = Math.ceil(TOTAL_ITEMS / PER_PAGE);
  const from = $derived((page - 1) * PER_PAGE + 1);
  const to = $derived(Math.min(page * PER_PAGE, TOTAL_ITEMS));
</script>

<div class="w-full max-w-2xl space-y-4">
  <section class="rounded-xl border border-border bg-card p-4 text-card-foreground sm:p-5">
    <div class="mb-4 flex items-baseline justify-between gap-3">
      <p class="text-sm font-semibold tracking-tight">{t.home}</p>
      <p class="text-xs text-muted-foreground tabular-nums">{t.range(from, to, TOTAL_ITEMS)}</p>
    </div>
    <Pagination locale="en" total={pages} bind:page />
  </section>

  <div class="grid gap-4 sm:grid-cols-2">
    <section class="rounded-xl border border-border bg-card p-4 text-card-foreground">
      <p class="mb-3 text-sm font-semibold tracking-tight">{t.orders}</p>
      <Pagination locale="en" total={4} defaultPage={1} getHref={(n) => `#orders-page-${n}`} />
    </section>
    <section class="rounded-xl border border-border bg-card p-4 text-card-foreground">
      <p class="mb-3 text-sm font-semibold tracking-tight">{t.reviews}</p>
      <Pagination locale="en" total={38} defaultPage={3} compact />
    </section>
  </div>
</div>
