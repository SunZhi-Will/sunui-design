<script setup lang="ts">
import { computed, ref } from "vue";

import RangeSlider from "@/components/RangeSlider.vue";

const t = {
  filter: "Filter",
  price: "Price",
  rating: "Minimum rating",
  results: (n: number) => `${n} products`,
  low: "Lowest price",
  high: "Highest price",
  currency: (n: number) => `$${n}`,
  stars: (n: number) => `${n.toFixed(1)} ★`,
};

const price = ref<[number, number]>([20, 120]);
const rating = ref(4);
const count = computed(() => Math.max(0, Math.round((price.value[1] - price.value[0]) * 1.4 - (rating.value - 3) * 30)));
</script>

<template>
  <div class="w-full max-w-sm rounded-lg border bg-background p-6">
    <div class="mb-6 flex items-baseline justify-between">
      <span class="text-base font-semibold tracking-tight">{{ t.filter }}</span>
      <span class="text-sm tabular-nums text-muted-foreground">{{ t.results(count) }}</span>
    </div>
    <div class="space-y-8">
      <RangeSlider v-model="price" :label="t.price" :min="0" :max="200" :step="5" :min-gap="10" :format="t.currency" :thumb-labels="[t.low, t.high]" name="price" />
      <RangeSlider v-model="rating" :label="t.rating" :min="1" :max="5" :step="0.5" :ticks="8" :format="t.stars" :thumb-labels="t.rating" />
    </div>
  </div>
</template>
