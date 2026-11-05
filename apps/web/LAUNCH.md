# 上線清單（第 1 週：2026-11-06 至 11-12）

> 依 `reports/商業模式深度分析-2026-11-06.md` 第 6 節。程式端已經準備好的部分標「已完成」，其餘需要你本人操作（付款、身分驗證、帳號權限），照順序做即可。

## 程式端（已完成）

- 免費 registry 匿名安裝計數：`middleware.ts` + `lib/installs.ts`，只記 block 名稱、日期、來源類型（瀏覽器或 CLI / agent），不存 IP。未設定 Redis 時什麼都不做。
- 讀排行：`GET /api/installs?days=7`，帶 `Authorization: Bearer $SUNUI_STATS_TOKEN`。
- 部署時自動拉 Pro：`scripts/fetch-pro.mjs`（`prebuild` 執行），需要 `SUNUI_PRO_REPO` 與 `SUNUI_PRO_TOKEN`。
- Pro route 的原始碼會打包進 serverless function（`next.config.ts` 的 `outputFileTracingIncludes`）。
- 免費與動效凍結規則寫進 `AGENTS.md`。

## 你要做的（依序）

### 1. 網域

2026-11-06 決定用 **`sunui.synvize.com`**（synvize.com 的 DNS 在 Cloudflare）。registry URL 會寫進使用者的 `components.json`，公開後就不要再換；之後若改用獨立網域，舊網址要永久 308 轉址。

1. Vercel 專案 → Settings → Domains → 加 `sunui.synvize.com`。
2. Cloudflare → synvize.com → DNS → 新增 `CNAME`，名稱 `sunui`，目標 `cname.vercel-dns.com`，**Proxy 設為 DNS only（灰色雲）**。開橘色雲會讓 Vercel 簽不到憑證，也會被 Cloudflare 快取擋住 Pro 的授權回應。
3. Vercel 環境變數 `NEXT_PUBLIC_SITE_URL=https://sunui.synvize.com`，然後 **Redeploy**（`NEXT_PUBLIC_` 開頭的變數是建置時寫進去的，改完不重新建置不會生效）。
4. Settings → Deployment Protection：Production 網域不受保護；若打開還是被導到 Vercel 登入頁，把保護改成只套用在 Preview。

### 2. Pro 私有 repo

Pro 目前只在本機（`registry/pro` 沒有 remote），Vercel 拿不到。在 GitHub 建一個 **private** repo（例如 `sunui-design-pro`），然後：

```bash
git -C apps/web/registry/pro remote add origin https://github.com/SunZhi-Will/sunui-design-pro.git
```

```bash
git -C apps/web/registry/pro push -u origin master
```

再到 GitHub 產生 fine-grained token：只勾這個 repo、權限 Contents: Read-only。

### 3. Vercel

- Import `SunZhi-Will/sunui-design`，**Root Directory 設 `apps/web`**（不要用 repo 根目錄，根目錄的 `vercel-build` 是舊 npm 套件用的）。
- 綁網域。
- Marketplace 加一個 Upstash Redis（免費額度夠用），它會自動注入 `KV_REST_API_URL` / `KV_REST_API_TOKEN`。
- 環境變數：

| 變數 | 值 |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://<網域>` |
| `SUNUI_PRO_REPO` | `SunZhi-Will/sunui-design-pro` |
| `SUNUI_PRO_TOKEN` | 上一步的 token |
| `SUNUI_STATS_TOKEN` | 自己產生：`openssl rand -hex 24` |
| `POLAR_ORGANIZATION_ID` | 第 4 步拿到後再填 |
| `POLAR_API_URL` | 先填 `https://sandbox-api.polar.sh`，正式開賣前改回 `https://api.polar.sh` |
| `RESEND_API_KEY`、`RESEND_WAITLIST_SEGMENT_ID` | 第 5 步 |

部署後驗證：

```bash
npx shadcn@latest view https://<網域>/r/countdown-banner.json
```

```bash
curl -s https://<網域>/r/pro/coupon-claim-card.json
```

第二個應該回 401，`message` 寫著價格與購買連結。

### 4. Polar（最重要，最可能卡關）

- 以台灣個人身分註冊，走完 Stripe Connect Express KYC。不能用 Wise、Payoneer 虛擬帳戶。
- 建三個產品：Founding US$79、Pro US$129、Team US$349，每個都加 License Key benefit（Team activation 上限 5）。
- 把三個結帳連結填進 `NEXT_PUBLIC_CHECKOUT_FOUNDING_URL`、`_PRO_URL`、`_TEAM_URL`。
- 先在 sandbox 用測試卡買一次，拿到的 key 實際跑一次 `npx shadcn add @sunui-pro/coupon-claim-card`。
- 同時申請 Dodo Payments 當備援。

### 5. Resend（waitlist）

建帳號、驗證網域寄件、建一個 segment，把 API key 與 segment ID 填進 Vercel。之後在網站送一次自己的 email 確認有進名單。

### 6. 推送

公開 repo 已在 2026-11-06 推送（免費與付費切分已在 11/05 定案，MIT 公開後無法收回）。之後照常推送即可。

## 第 1 週完成標準

- [ ] 正式網址可以用 shadcn CLI 裝免費 block
- [ ] `/api/installs` 看得到自己剛剛那次安裝
- [ ] Polar sandbox 完成一筆購買，拿 key 裝到 Pro block
- [ ] waitlist 送出後 Resend 看得到
