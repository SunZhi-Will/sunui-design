import { CopyButton } from "@/components/copy-button";
import { getI18n } from "@/lib/i18n-server";

export async function Command({ value }: { value: string }) {
  const { m } = await getI18n();
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-card py-2 pr-2 pl-4 [contain:inline-size]">
      <code className="min-w-0 flex-1 overflow-x-auto font-mono text-[13px] whitespace-nowrap">
        <span className="text-subtle select-none">$ </span>
        {value}
      </code>
      <CopyButton value={value} labels={m.common} />
    </div>
  );
}
