<script lang="ts">
  import LoadingButton from "../lib/components/LoadingButton.svelte";

  const t = {
    subscribe: "Subscribe",
    subscribed: "Subscribed",
    email: "Email for restock news",
    pay: "Pay $68.00",
    paid: "Paid",
    apply: "Apply code",
    invalid: "Code expired",
    loading: "Working",
    hint: "This code fails on purpose so you can see the error state.",
  };

  const wait = (ms: number, fail = false) => new Promise<void>((resolve, reject) => setTimeout(fail ? reject : resolve, ms));

  let email = $state("");
</script>

<div class="w-full max-w-md space-y-6 rounded-lg border bg-background p-6">
  <form class="flex gap-2" onsubmit={(e) => e.preventDefault()}>
    <input
      type="email"
      bind:value={email}
      placeholder={t.email}
      aria-label={t.email}
      class="h-10 min-w-0 flex-1 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
    />
    <LoadingButton onclick={() => wait(1400)} successLabel={t.subscribed} loadingLabel={t.loading}>{t.subscribe}</LoadingButton>
  </form>

  <LoadingButton class="w-full tabular-nums" loadingStyle="inline" onclick={() => wait(1800)} successLabel={t.paid} loadingLabel={t.loading} resetAfter={0}>{t.pay}</LoadingButton>

  <div class="flex items-center gap-3">
    <span class="rounded-md border border-foreground/10 px-3 py-2 font-mono text-sm tracking-[0.12em]">SUMMER24</span>
    <LoadingButton variant="paper" onclick={() => wait(1000, true)} errorLabel={t.invalid} loadingLabel={t.loading}>{t.apply}</LoadingButton>
  </div>
  <p class="text-xs text-muted-foreground">{t.hint}</p>
</div>
