import { CopyButton } from "@/components/copy-button";

export function Command({ value }: { value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-card py-2 pr-2 pl-4">
      <code className="min-w-0 flex-1 overflow-x-auto font-mono text-[13px] whitespace-nowrap">
        <span className="text-subtle select-none">$ </span>
        {value}
      </code>
      <CopyButton value={value} />
    </div>
  );
}
