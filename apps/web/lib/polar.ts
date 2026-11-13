// /admin 讀 Polar 的訂單、授權與 metrics。只讀，快取 5 分鐘。
// 需要 POLAR_ACCESS_TOKEN（organization access token，scope：orders:read、license_keys:read、metrics:read）。
// 欄位依 Polar OpenAPI 2026-10。

export type PolarResult<T> = { ok: true; data: T } | { ok: false; error: string };

export type PolarOrder = {
  id: string;
  created_at: string;
  status: "draft" | "pending" | "paid" | "refunded" | "partially_refunded" | "void";
  paid: boolean;
  net_amount: number;
  tax_amount: number;
  total_amount: number;
  refunded_amount: number;
  refunded_tax_amount: number;
  currency: string;
  billing_address: { country?: string | null } | null;
  customer: { email: string | null };
  product: { id: string; name: string } | null;
};

export type PolarLicenseKey = {
  id: string;
  created_at: string;
  display_key: string;
  status: "granted" | "revoked" | "disabled";
  benefit_id: string;
  customer: { email: string | null };
  limit_activations: number | null;
  validations: number;
  last_validated_at: string | null;
};

type Page<T> = { items: T[]; pagination: { total_count: number; max_page: number } };

export type Plan = "founding" | "pro" | "team" | "other";

/** 依 Polar 產品名稱判斷方案（產品名稱需含 Founding / Team / Pro）。 */
export function planOf(productName: string | undefined | null): Plan {
  const name = (productName ?? "").toLowerCase();
  if (name.includes("founding")) return "founding";
  if (name.includes("team")) return "team";
  if (name.includes("pro")) return "pro";
  return "other";
}

export function polarConfigured() {
  return Boolean(process.env.POLAR_ACCESS_TOKEN && process.env.POLAR_ORGANIZATION_ID);
}

async function polarGet<T>(path: string, params: Record<string, string | number | string[]>): Promise<PolarResult<T>> {
  const token = process.env.POLAR_ACCESS_TOKEN;
  const organizationId = process.env.POLAR_ORGANIZATION_ID;
  if (!token || !organizationId) return { ok: false, error: "未設定 POLAR_ACCESS_TOKEN 或 POLAR_ORGANIZATION_ID" };

  const base = (process.env.POLAR_API_URL ?? "https://api.polar.sh").replace(/\/$/, "");
  const url = new URL(`${base}${path}`);
  url.searchParams.set("organization_id", organizationId);
  for (const [key, value] of Object.entries(params)) {
    for (const v of Array.isArray(value) ? value : [value]) url.searchParams.append(key, String(v));
  }
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      next: { revalidate: 300 },
    });
    if (!response.ok) return { ok: false, error: `Polar ${path} 回應 ${response.status}` };
    return { ok: true, data: (await response.json()) as T };
  } catch {
    return { ok: false, error: `無法連線 Polar（${path}）` };
  }
}

async function allPages<T>(path: string, params: Record<string, string | number | string[]>, maxPages: number) {
  const items: T[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const result = await polarGet<Page<T>>(path, { ...params, page, limit: 100 });
    if (!result.ok) return result;
    items.push(...result.data.items);
    if (page >= result.data.pagination.max_page) break;
  }
  return { ok: true as const, data: items };
}

/** 最多讀 500 筆訂單，新的在前。 */
export function listOrders() {
  return allPages<PolarOrder>("/v1/orders/", { sorting: "-created_at" }, 5);
}

/** 最多讀 1,000 把 license key。 */
export function listLicenseKeys() {
  return allPages<PolarLicenseKey>("/v1/license-keys/", {}, 10);
}

export type MetricsTotals = Partial<Record<"orders" | "revenue" | "net_revenue" | "checkouts" | "succeeded_checkouts" | "checkouts_conversion", number>>;

export async function getMetrics(days: number, now = new Date()) {
  const end = now.toISOString().slice(0, 10);
  const start = new Date(now.getTime() - (days - 1) * 86_400_000).toISOString().slice(0, 10);
  return polarGet<{ totals: MetricsTotals }>("/v1/metrics/", {
    start_date: start,
    end_date: end,
    interval: "day",
    timezone: "UTC",
    metrics: ["orders", "revenue", "net_revenue", "checkouts", "succeeded_checkouts", "checkouts_conversion"],
  });
}

/** 有效（已付款、未全額退款）的訂單。 */
export function isCounted(order: PolarOrder) {
  return order.status === "paid" || order.status === "partially_refunded";
}
