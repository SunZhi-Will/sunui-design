<script setup lang="ts">
import { ref } from "vue";

import LoadingButton from "@/components/LoadingButton.vue";

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
const email = ref("");
</script>

<template>
  <div class="w-full max-w-md space-y-6 rounded-lg border bg-background p-6">
    <form class="flex gap-2" @submit.prevent>
      <input
        v-model="email"
        type="email"
        :placeholder="t.email"
        :aria-label="t.email"
        class="h-10 min-w-0 flex-1 rounded-md border bg-transparent px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <LoadingButton :on-click="() => wait(1400)" :success-label="t.subscribed" :loading-label="t.loading">
        {{ t.subscribe }}
      </LoadingButton>
    </form>

    <LoadingButton class="w-full tabular-nums" loading-style="inline" :on-click="() => wait(1800)" :success-label="t.paid" :loading-label="t.loading" :reset-after="0">
      {{ t.pay }}
    </LoadingButton>

    <div class="flex items-center gap-3">
      <span class="rounded-md border border-foreground/10 px-3 py-2 font-mono text-sm tracking-[0.12em]">SUMMER24</span>
      <LoadingButton variant="paper" :on-click="() => wait(1000, true)" :error-label="t.invalid" :loading-label="t.loading">
        {{ t.apply }}
      </LoadingButton>
    </div>
    <p class="text-xs text-muted-foreground">{{ t.hint }}</p>
  </div>
</template>
