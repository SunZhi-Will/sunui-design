<script lang="ts">
  import type { Component } from "svelte";
  // ?r=<round>&only=<block>: one project serves every round under rounds/<round>/
  const mods = import.meta.glob<{ default: Component }>("../rounds/*/demos/*Demo.svelte", { eager: true });
  const q = new URLSearchParams(location.search);
  const only = q.get("only");
  const round = q.get("r") || "p3";
  const demos = Object.entries(mods)
    .map(([path, mod]) => ({ round: path.split("/rounds/")[1].split("/")[0], name: path.replace(/^.*\/demos\//, "").replace("Demo.svelte", ""), Comp: mod.default }))
    .filter((d) => d.round === round)
    .filter((d) => !only || d.name.toLowerCase() === only.replace(/-/g, "").toLowerCase());
</script>

<main class="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-16 p-8">
  {#each demos as d (d.name)}
    <section data-demo={d.name} class="flex w-full justify-center"><d.Comp /></section>
  {/each}
</main>
