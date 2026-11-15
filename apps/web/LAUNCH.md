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

已完成（2026-11-06）：private repo `SunZhi-Will/sunui-design-pro` 已建立並推送，Vercel 已設 `SUNUI_PRO_REPO`。剩下 token：建好後在 Vercel 加 `SUNUI_PRO_TOKEN`（Secret、Production），再重新部署。

原本的步驟（留作紀錄）：

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
| `SHOPLINE_MERCHANT_ID`、`SHOPLINE_API_KEY`、`SHOPLINE_SIGN_KEY` | 第 4 步 |
| `SHOPLINE_ENV` | 先填 `sandbox`，正式開賣前改成 `live` |
| `RESEND_API_KEY`、`RESEND_WAITLIST_SEGMENT_ID` | 第 5 步 |

部署後驗證：

```bash
npx shadcn@latest view https://<網域>/r/countdown-banner.json
```

```bash
curl -s https://<網域>/r/pro/coupon-claim-card.json
```

第二個應該回 401，`message` 寫著價格與購買連結。

### 4. SHOPLINE Payments（2026-11-14 從 Polar 改過來）

改用作者其他產品（萬寶箱、PostVault、課程平台）已在用的 SHOPLINE 商家帳號，不用再開戶與 KYC。
新台幣收款（買斷：Founding NT$2,490、Pro NT$4,090、Team NT$10,990；訂閱：月 NT$590、年 NT$3,190，約等於網站上的美金價，見 `lib/site.ts` 的 `pricesTwd`），
授權碼由 SunUI 自己發（`lib/orders.ts`，存在 Upstash Redis）。

訂閱是預付期間制（2026-11-15 定案）：不綁卡、不自動扣款。授權碼帶到期日，到期後 `/r/pro/*` 回 403，已經裝進專案的 block 照常可用。
到期前 7 天 `/api/cron/renewals` 寄提醒信，續約就是用同一個 email 再買一期，同一把授權碼往後延。
Vercel 要設 `CRON_SECRET`，否則提醒信不會寄出。退款一期訂閱只會把到期日往回扣一期，不會撤銷整把授權。

- SHOPLINE 後台，設定、開發者管理、Webhook 管理，新增 `https://sunui.synvize.com/api/shopline/webhook`，勾選 `trade.succeeded`、`trade.failed`、`trade.expired`、`trade.refund.succeeded` 與 `dispute.*`。這一列的 Sign Key 填進 `SHOPLINE_SIGN_KEY`。
- 商家 ID 與 API key 和其他產品相同，填進 `SHOPLINE_MERCHANT_ID`、`SHOPLINE_API_KEY`。
- 先用 `SHOPLINE_ENV=sandbox` 走一次測試卡付款，拿完成頁的授權碼實際跑 `npx shadcn add @sunui-pro/coupon-claim-card`，再退款一次確認授權被撤銷。
- 寄授權碼信給買家需要在 Resend 驗證 synvize.com，並設定 `RESEND_FROM`；沒設定前買家只能從完成頁拿授權碼。
- 海外客戶改用 Polar 收美金（2026-11-15 定案），見下一節。

**11/27 前買 Pro 的退差價（2026-11-15 定案）**：創始會員開賣前，定價頁與 Pro 結帳頁都寫著「開賣後可申請退差價」。
有人來信要求時，到 SHOPLINE 後台對那筆訂單做部分退款 NT$1,600（4,090 − 2,490），Polar 訂單退 US$50。
部分退款不會撤銷授權（後台訂單會留一筆「需人工確認」的退款紀錄），客戶繼續用原本的授權碼。

**疑似分享**：同一把授權碼一天內超過 10 個 IP 安裝時，會寄信給 `SUNUI_ADMIN_EMAILS` 並在後台「授權使用」標記；超過 20 個自動擋下。
確定外流時按「重發」換掉那一把。

### 4b. Polar（海外美金收款）

繁中介面預設走 SHOPLINE 新台幣，其他語系預設走 Polar 美金，結帳頁可以切換。Polar 是 merchant of record，各國消費稅由它處理；官方文件列出台灣可以出款（Stripe Connect Express）。

- 在 polar.sh 建立組織並完成出款設定（Stripe Connect Express，台灣在支援名單內）。
- 建立五個「一次性付款」商品，價格照美金定價：Founding US$79、Pro US$129、Team US$349、月訂 US$19、年訂 US$99。月訂與年訂也建成一次性付款，到期日由 SunUI 管理，不用 Polar 的自動續扣。
- Settings → Developers 產生 Organization Access Token（`checkouts:write`），填進 `POLAR_ACCESS_TOKEN`。
- Settings → Webhooks 新增 `https://sunui.synvize.com/api/polar/webhook`，格式選 Raw，勾 `order.paid` 與 `order.refunded`，拿到的 `whsec_…` 填進 `POLAR_WEBHOOK_SECRET`。
- 五個商品 id 以 JSON 填進 `POLAR_PRODUCT_IDS`，`POLAR_ENV` 先填 `sandbox`，測完改 `live`。四項都設好，結帳頁才會出現美金選項；沒設好時一切照舊。
- Sandbox 測一次：英文介面買月訂，完成頁拿到授權碼，再到 Polar 退款，確認到期日往回扣一個月。

### 5. Resend（waitlist）

建帳號、驗證網域寄件、建一個 segment，把 API key 與 segment ID 填進 Vercel。之後在網站送一次自己的 email 確認有進名單。

### 6. 推送

公開 repo 已在 2026-11-06 推送（免費與付費切分已在 11/05 定案，MIT 公開後無法收回）。之後照常推送即可。

## 第 1 週完成標準

- [ ] 正式網址可以用 shadcn CLI 裝免費 block
- [ ] `/api/installs` 看得到自己剛剛那次安裝
- [ ] SHOPLINE sandbox 完成一筆購買，拿 key 裝到 Pro block
- [ ] waitlist 送出後 Resend 看得到
