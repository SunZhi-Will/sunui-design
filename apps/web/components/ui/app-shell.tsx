// Internal import path for the catalog. Blocks write `@/components/ui/app-shell`; the shadcn CLI rewrites it to the buyer's path.
// In this repo it forwards to the registry source, so there is only one copy of the code.
export * from "@/registry/free/app-shell/app-shell";
