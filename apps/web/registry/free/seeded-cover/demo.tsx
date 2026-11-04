import { SeededCover } from "./seeded-cover";

type Product = { id: string; name: string; by: string; price: number; image?: boolean; label?: string };

const products: Product[] = [
  { id: "p-mountains", name: "山河未歸", by: "Ink & Lantern Press", price: 18 },
  { id: "p-field", name: "Field Notes on Slow Living", by: "Hearth Books", price: 24, label: "Sample" },
  { id: "p-mug", name: "Stoneware Mug, Sand", by: "Kiln Studio", price: 18, image: true },
  { id: "p-tea", name: "茶事手帖", by: "春日文庫", price: 22 },
  { id: "p-course", name: "Pricing for Small Shops", by: "Online course, 12 lessons", price: 49 },
  { id: "p-tote", name: "Canvas Tote, Natural", by: "Daily Goods", price: 24, image: true },
];

export default function SeededCoverDemo() {
  return (
    <section aria-labelledby="shelf-heading" className="w-full max-w-3xl space-y-4">
      <div>
        <h2 id="shelf-heading" className="text-xl font-semibold tracking-tight">
          New on the shelf
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Books, goods and courses added this week.</p>
      </div>
      <ul className="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3">
        {products.map((p) => (
          <li key={p.id} className="min-w-0">
            {p.image ? (
              // 有實拍圖的商品：這裡用中性留白代替
              <div className="flex aspect-[2/3] w-full items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
                <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
                  <path d="m3.5 16 5-5 4 4 3-3 5 5" />
                </svg>
              </div>
            ) : (
              <SeededCover seed={p.id} title={p.name} subtitle={p.by} label={p.label} />
            )}
            <p className="mt-2 truncate text-sm font-medium">{p.name}</p>
            <p className="flex items-baseline justify-between gap-2 text-xs text-muted-foreground">
              <span className="truncate">{p.by}</span>
              <span className="shrink-0 font-medium text-foreground tabular-nums">${p.price}</span>
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
