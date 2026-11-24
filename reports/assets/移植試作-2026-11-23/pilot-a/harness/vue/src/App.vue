<script setup lang="ts">
import { defineAsyncComponent } from "vue";
// ?r=<round>&only=<block>: one project serves every round under rounds/<round>/
const mods = import.meta.glob("../rounds/*/demos/*Demo.vue");
const q = new URLSearchParams(location.search);
const only = q.get("only");
const round = q.get("r") || "p3";
const demos = Object.entries(mods)
  .map(([path, load]) => ({ round: path.split("/rounds/")[1].split("/")[0], name: path.replace(/^.*\/demos\//, "").replace("Demo.vue", ""), comp: defineAsyncComponent(load as never) }))
  .filter((d) => d.round === round)
  .filter((d) => !only || d.name.toLowerCase() === only.replace(/-/g, "").toLowerCase());
</script>
<template>
  <main class="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-16 p-8">
    <section v-for="d in demos" :key="d.name" :data-demo="d.name" class="flex w-full justify-center"><component :is="d.comp" /></section>
  </main>
</template>
