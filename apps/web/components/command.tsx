import { CopyButton } from "@/components/copy-button";
import { getI18n } from "@/lib/i18n-server";

export async function Command({ value }: { value: string }) {
  const { m } = await getI18n();
  return (
    <div className="flex items-center gap-3 rounded-lg bg-card py-1.5 pr-1.5 pl-4 shadow-e1 [contain:inline-size]">
      <code className="min-w-0 flex-1 overflow-x-auto font-mono text-[13px] whitespace-nowrap">
        <span className="text-subtle select-none">$ </span>
        {value}
      </code>
      <CopyButton value={value} labels={m.common} />
    </div>
  );
}
