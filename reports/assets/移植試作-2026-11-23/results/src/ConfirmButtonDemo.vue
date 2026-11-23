<script setup lang="ts">
import { ref } from "vue";

import ConfirmButton from "@/components/ConfirmButton.vue";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const t = {
  meta: "Presale signup · yesterday · Looks like test data",
  confirm: "Remove signup",
  removed: "Signup removed",
  remove: "Remove",
};

const removed = ref(false);

async function remove() {
  await wait(500);
  removed.value = true;
  return { ok: true, message: t.removed };
}
</script>

<template>
  <div class="flex w-full max-w-md min-w-0 items-start justify-between gap-3 rounded-xl border border-border bg-card p-4 text-card-foreground">
    <div class="min-w-0 flex-1">
      <p :class="`truncate text-sm font-medium ${removed ? 'text-muted-foreground line-through' : ''}`">test+qa@example.com</p>
      <p class="mt-0.5 truncate text-xs text-muted-foreground">{{ t.meta }}</p>
    </div>
    <ConfirmButton variant="ghost" size="xs" locale="en" :confirm-label="t.confirm" :disabled="removed" :action="remove">
      {{ t.remove }}
    </ConfirmButton>
  </div>
</template>
