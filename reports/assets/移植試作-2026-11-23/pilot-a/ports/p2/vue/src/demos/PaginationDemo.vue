<script setup lang="ts">
import { computed, ref } from "vue";

import Pagination from "@/components/Pagination.vue";

const PER_PAGE = 24;
const TOTAL_ITEMS = 286;

const page = ref(6);
const pages = Math.ceil(TOTAL_ITEMS / PER_PAGE);
const from = computed(() => (page.value - 1) * PER_PAGE + 1);
const to = computed(() => Math.min(page.value * PER_PAGE, TOTAL_ITEMS));
const range = computed(() => `${from.value} to ${to.value} of ${TOTAL_ITEMS} items`);
const ordersHref = (n: number) => `#orders-page-${n}`;
</script>

<template>
  <div class="w-full max-w-2xl space-y-4">
    <section class="rounded-xl border border-border bg-card p-4 text-card-foreground sm:p-5">
      <div class="mb-4 flex items-baseline justify-between gap-3">
        <p class="text-sm font-semibold tracking-tight">Home and living</p>
        <p class="text-xs text-muted-foreground tabular-nums">{{ range }}</p>
      </div>
      <Pagination locale="en" :total="pages" v-model:page="page" />
    </section>

    <div class="grid gap-4 sm:grid-cols-2">
      <section class="rounded-xl border border-border bg-card p-4 text-card-foreground">
        <p class="mb-3 text-sm font-semibold tracking-tight">Order history</p>
        <Pagination locale="en" :total="4" :default-page="1" :get-href="ordersHref" />
      </section>
      <section class="rounded-xl border border-border bg-card p-4 text-card-foreground">
        <p class="mb-3 text-sm font-semibold tracking-tight">Customer reviews</p>
        <Pagination locale="en" :total="38" :default-page="3" compact />
      </section>
    </div>
  </div>
</template>
