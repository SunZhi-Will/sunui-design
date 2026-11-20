import { cn } from "@/lib/utils";

/** 一格的內容：true 打勾、false 不包含、字串直接顯示；{ text, good } 是這一列裡比較好的值，用字重強調 */
export type CompareCell = boolean | string | { text: string; good: true };

export type CompareColumn = {
  name: string;
  price: string;
  per?: string;
  /** 推薦的方案整欄稍微提亮 */
  highlight?: boolean;
};

export type CompareRow = { label: string; cells: CompareCell[] };

/**
 * 價格頁的方案比較表：五個方案並排，同一項在同一列，差異橫著看就懂。
 * 卡片只能各看各的，切換鈕又把訂閱和買斷分在兩個畫面，所以這張表不分模式、全部列出。
 * 手機上表格可以左右捲動，第一欄固定。
 */
export function PlanCompare({
  title,
  feature,
  columns,
  rows,
  yes,
  no,
  allPlans,
}: {
  title: string;
  feature: string;
  columns: CompareColumn[];
  rows: CompareRow[];
  /** 打勾與不包含的無障礙文字 */
  yes: string;
  no: string;
  /** 每個方案都一樣的項目，不放進表格，在表格下方一行列出，表格只留有差異的列 */
  allPlans?: { label: string; items: string[] };
}) {
  return (
    <section aria-labelledby="compare-title" className="mx-auto mt-20 max-w-6xl">
      <h2 id="compare-title" className="text-center text-2xl font-semibold tracking-tight">
        {title}
      </h2>
      <div className="mt-8 overflow-x-auto rounded-2xl bg-card shadow-e1">
        <table className="w-full min-w-[760px] table-fixed border-collapse text-sm">
          {/* 五個方案等寬，不讓某一欄的長字把別欄擠扁 */}
          <colgroup>
            <col className="w-[22%]" />
            {columns.map((column) => (
              <col key={column.name} />
            ))}
          </colgroup>
          <thead>
            <tr>
              <th
                scope="col"
                className="sticky left-0 z-10 bg-card px-5 py-4 text-left align-bottom text-xs font-medium text-subtle"
              >
                {feature}
              </th>
              {columns.map((column) => (
                <th
                  key={column.name}
                  scope="col"
                  className={cn("px-4 py-4 text-left align-bottom", column.highlight && "bg-accent-soft/50")}
                >
                  <span className="block font-medium">{column.name}</span>
                  <span className="mt-1 block text-xs font-normal whitespace-nowrap text-subtle tabular-nums">
                    <span className="font-medium text-[var(--tone)]">{column.price}</span>
                    {column.per && <> {column.per}</>}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-line">
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-card px-5 py-3.5 text-left font-normal text-pretty text-subtle"
                >
                  {row.label}
                </th>
                {row.cells.map((cell, i) => (
                  <td
                    key={columns[i]?.name ?? i}
                    className={cn("px-4 py-3.5 align-middle text-pretty", columns[i]?.highlight && "bg-accent-soft/50")}
                  >
                    <Cell value={cell} yes={yes} no={no} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {allPlans && allPlans.items.length > 0 && (
        <p className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-subtle">
          <span className="font-medium text-fg">{allPlans.label}</span>
          {allPlans.items.map((item) => (
            <span key={item} className="inline-flex items-center gap-1.5">
              <CheckMark small />
              {item}
            </span>
          ))}
        </p>
      )}
    </section>
  );
}

function Cell({ value, yes, no }: { value: CompareCell; yes: string; no: string }) {
  if (value === true) {
    return (
      <>
        <CheckMark />
        <span className="sr-only">{yes}</span>
      </>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex h-5 items-center text-subtle/40">
        <span aria-hidden="true" className="block h-px w-3 bg-current" />
        <span className="sr-only">{no}</span>
      </span>
    );
  }
  if (typeof value === "object") {
    // 這一列裡比較好的值（永久、不限、5 人）：用字重和墨色拉開，不另外上色
    return <span className="font-medium text-fg">{value.text}</span>;
  }
  return <span className="text-subtle">{value}</span>;
}

/** 打勾：細線勾，用價格的色調（和卡片上的金額同色），不加底色 */
function CheckMark({ small }: { small?: boolean }) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      className={cn("inline-block shrink-0 text-[var(--tone)]", small ? "size-3.5" : "size-4")}
    >
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
