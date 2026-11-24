#!/bin/bash
# Rebuild the pilot's test projects (one Vite project per platform, every round inside it).
#   bash setup.sh [dest]
# URL: http://localhost:<port>/?r=p2|p3&only=<block>[&l=<locale>]
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
WEB="$(cd "$HERE/../../../../apps/web" && pwd)"
DEST="${1:-$(mktemp -d)}"
mkdir -p "$DEST"
cp "$HERE/harness/locale-plugin.mjs" "$HERE/harness/rounds-plugin.mjs" "$DEST/"
for plat in vue svelte; do
  P="$DEST/$plat"
  rm -rf "$P/src" "$P/rounds"; mkdir -p "$P/rounds"
  cp -R "$HERE/harness/$plat/." "$P/"
  cp "$WEB/public/sunui-theme.css" "$P/src/sunui-theme.css"
  mkdir -p "$P/public"; cp -R "$WEB/public/blocks" "$P/public/" 2>/dev/null || true
  for round in p2 p3; do mkdir -p "$P/rounds/$round"; cp -R "$HERE/ports/$round/$plat/src/." "$P/rounds/$round/"; done
done
# hand-fixed variants (pilot only): Vue loading-button without the path Tab stop, Svelte avatar-stack with velocity 0
V="$DEST/vue/rounds/p3"
sed 's#<motion.path#<motion.path tabindex="-1" pointer-events="none"#' "$V/components/LoadingButton.vue" > "$V/components/LoadingButtonFixed.vue"
sed 's#components/LoadingButton.vue#components/LoadingButtonFixed.vue#' "$V/demos/LoadingButtonDemo.vue" > "$V/demos/LoadingButtonFixedDemo.vue"
S="$DEST/svelte/rounds/p3"
sed 's#first || reduce ? { duration: 0 } : springs.snappy);#first || reduce ? { duration: 0 } : { ...springs.snappy, velocity: 0 });#' "$S/lib/components/AvatarStack.svelte" > "$S/lib/components/AvatarStackFixed.svelte"
sed 's#components/AvatarStack.svelte#components/AvatarStackFixed.svelte#' "$S/demos/AvatarStackDemo.svelte" > "$S/demos/AvatarStackFixedDemo.svelte"
grep -q 'velocity: 0' "$S/lib/components/AvatarStackFixed.svelte" || { echo "svelte fix not applied"; exit 1; }
grep -q 'pointer-events="none"' "$V/components/LoadingButtonFixed.vue" || { echo "vue fix not applied"; exit 1; }
for plat in vue svelte; do [ -d "$DEST/$plat/node_modules" ] || (cd "$DEST/$plat" && npm install --no-audit --no-fund --loglevel=error); done
echo "ready: $DEST"
