# SunUI Pro 金流平台與授權交付技術研究（台灣個人開發者，查證日 2026-11-04）

> 標記說明：【已查證】表示本次研究直接讀過該網址內容；【二手】表示來自比較部落格或競品網站（多數由競爭對手撰寫，有利益衝突）；【未查證】表示來自研究者既有知識，本次未取得來源，報告撰寫者應視為待確認。
> 本文件不是稅務或法律建議。凡標示「需會計師確認」之處，請由台灣執業會計師或記帳士確認。

## Q1. Merchant of Record（MoR）平台比較：費率、MoR 性質、台灣個人能否註冊與收款、授權金鑰、GitHub 自動化、折扣與 API

### Takeaway
以「台灣個人、無公司、一次性授權 US$69 至 299、需要授權金鑰」這組條件來看，Polar.sh 是目前最契合的主選：官方文件已確認台灣在其 Stripe Connect Express 出款國清單內、個人可出款、內建 license key API 與 GitHub repo 存取 benefit；代價是 2026-05-27 新費率後的 Starter 方案為 5% + 50¢，非美國卡再加 1.5%。Creem 與 Dodo Payments 的官方國家清單也包含台灣，費率較低，可作備案；Stripe Managed Payments 與一般 Stripe 目前對台灣賣家不可用或無法確認。

### Cited Findings

**Polar.sh**
- 【已查證，2026-11-04】費率：Starter 免月費，5% + 50¢；Pro US$20/月，3.8% + 40¢；Growth US$100/月，3.6% + 35¢；Scale US$400/月，3.4% + 30¢；2026-05-27 之前建立的組織為 Early Member，4% + 40¢ 外加訂閱 0.5%。來源：[Polar Fees](https://polar.sh/docs/merchant-of-record/fees)
- 【已查證】非美國卡加收 1.5%；爭議款每件 US$15（不論結果）；退款時原交易手續費不退。來源：[Polar Fees](https://polar.sh/docs/merchant-of-record/fees)
- 【已查證】出款費（Stripe 轉嫁、Polar 不加價）：有出款的月份每月 US$2；每筆出款 0.25% + US$0.25；跨境換匯 0.25%（歐盟）至 1%（其他國家）。來源：[Polar Fees](https://polar.sh/docs/merchant-of-record/fees)
- 【已查證】Polar 以 Stripe Connect Express 對清單內國家的居民或企業出款，清單中明列「Taiwan」；個人是否可用取決於 Stripe Connect Express 在該地區是否支援 individual 業務類型，頁面提供自我檢查步驟。來源：[Polar Supported Countries](https://polar.sh/docs/merchant-of-record/supported-countries)
- 【二手，搜尋摘要轉述 Polar FAQ/Payout 文件】即使 Stripe 單獨開戶在該國為邀請制，清單內國家的個人或公司仍可透過 Polar 收款；個人帳戶可用個人銀行帳戶，Wise、Payoneer 等虛擬帳戶無法通過 Stripe Connect 驗證；出款批次於發起後 24 小時處理，通常 4 至 7 個工作天到帳。來源：[Polar Payout Accounts](https://polar.sh/docs/features/finance/accounts)、[Polar Payouts](https://polar.sh/docs/features/finance/payouts)
- 【二手】Polar 官方 X 帳號 2025-04 表示，因為使用 Stripe Connect Express 出款，只能支援清單內國家的賣家。來源：[Polar on X](https://x.com/polar_sh/status/1915379610809782428)
- 【已查證】License key 功能：可自訂前綴（例如 `MYAPP_` + UUID4）；一次性購買可設定購買後 N 天/月/年到期；可要求先 activate 才能 validate，用以限制裝置、IP 或實例數；可設定每把 key 的使用額度並在 validate 時 `increment_usage`；商家可透過 `POST /v1/license-keys/{id}/rotate` 輪替，客戶也可在 customer portal 自行輪替，舊 key 立即失效。來源：[Polar License Keys](https://polar.sh/docs/features/benefits/license-keys)
- 【已查證】驗證端點：`POST https://api.polar.sh/v1/customer-portal/license-keys/validate`（參數 `key`、`organization_id`，選填 `activation_id`、`conditions`、`increment_usage`）與 `.../activate`；文件範例不需商家 token，可由公開端呼叫。文件未記載 rate limit。來源：[Polar License Keys](https://polar.sh/docs/features/benefits/license-keys)
- 【未查證】Polar 另有「GitHub Repository Access」benefit，購買後自動邀請買家 GitHub 帳號進入私有 repo，退款或訂閱結束時移除；亦支援折扣碼、Checkout API 與 webhooks。本次未讀到該頁，需至 polar.sh/docs/features/benefits 確認。

**Lemon Squeezy 與 Stripe Managed Payments**
- 【已查證，2026-01-28 官方文章】Lemon Squeezy 已是 Stripe 的一部分；團隊專注打造 Stripe Managed Payments，坦承造成「slower support responses and less frequent product updates」；目標是讓 Lemon Squeezy 用戶容易遷移到 Stripe Managed Payments，但未給時程；當時 Managed Payments 為邀請制、支援 35+ 國家商家，不支援國家被導向 Stripe Atlas 成立美國公司。來源：[Lemon Squeezy 2026 Update](https://www.lemonsqueezy.com/blog/2026-update)
- 【二手】Lemon Squeezy 費率 5% + 50¢，國際卡 +1.5%、訂閱 +0.5%；出款美國免費、其他地區 1%（2026-10 查價）。來源：[DEV Community, Ten $100 sales on 7 MoRs (Oct 2026)](https://dev.to/panchei/ten-100-sales-on-7-merchants-of-record-what-actually-reaches-your-bank-oct-2026-53e6)
- 【二手】台灣個人可申請 Lemon Squeezy、不需公司，透過 Stripe 出款；國際出款費由 3% + US$2.50 降為 1%。來源：[Shareuhack 台灣獨立開發者金流指南（2026-04-08）](https://www.shareuhack.com/en/posts/taiwan-indie-dev-global-payments-guide-2026)
- 【二手】Stripe Managed Payments 於 2026-04 正式 GA；只能搭配 Stripe Checkout 與 Payment Links；不含 Lemon Squeezy 的商店、數位交付、聯盟行銷功能；遷移工具尚未文件化。來源：[TurboStarter](https://www.turbostarter.dev/blog/lemon-squeezy-vs-stripe)、[Framekit](https://framekit.ai/blog/lemon-squeezy-vs-stripe-2026)
- 【二手，引用 Stripe 支援頁】Managed Payments 每筆成功交易收 3.5%，疊加於一般 Stripe 處理費之上；另有 Billing +0.7%、國際卡 +1.5%、換匯 +1%、爭議 US$15；有部落格估算美國卡總成本約 6.4% + 30¢。來源：[Stripe Support: Managed Payments pricing](https://support.stripe.com/questions/managed-payments-pricing)、[Dodo Payments blog](https://dodopayments.com/blogs/stripe-managed-payments-fees-explained)
- 【二手】一份 2026-09-27 的整理稱 Stripe 文件列出 37 個賣家所在地，包括美、加、多數歐洲、澳洲、香港、日本、新加坡，未包含台灣。來源：[aliteq](https://aliteq.com/stripe-managed-payments-fees-2026)
- 【未查證】Lemon Squeezy 有 License API（`/v1/licenses/activate`、`/validate`、`/deactivate`，公開端點不需 API key）與折扣碼功能。

**一般 Stripe（非 MoR）**
- 【二手】台灣個人可「申請」，但對台灣本地帳戶出款受限、合規不清；文章認為最可靠路線是 Stripe Atlas（US$500 一次，之後每年至少 US$325）或 Wyoming LLC（約 US$179 成立、約 US$221/年）搭配 Mercury 銀行；外資持有的美國 LLC 每年須申報 IRS Form 5472，未申報罰款起點 US$25,000。來源：[Shareuhack（2026-04-08）](https://www.shareuhack.com/en/posts/taiwan-indie-dev-global-payments-guide-2026)
- 【未查證】Stripe 全球可用國家頁面目前未將台灣列為可直接開戶國家，需至 [stripe.com/global](https://stripe.com/global) 確認。一般 Stripe 不是 MoR，全球 VAT/GST/銷售稅須自行處理（Stripe Tax 只算稅不代繳）。

**Paddle**
- 【二手】費率 5% + 50¢，無國際卡附加費；出款 SEPA/ACH 免費，國際 SWIFT 電匯有報導約 US$15。來源：[DEV Community（2026-10）](https://dev.to/panchei/ten-100-sales-on-7-merchants-of-record-what-actually-reaches-your-bank-oct-2026-53e6)、[agentaos](https://agentaos.ai/merchant-of-record-fees)
- 【二手】台灣公司可直接申請但需台灣商業登記文件；無公司個人資格「視情況」需問 Paddle 客服；出款方式為電匯或 Payoneer；兩位台灣開發者實測出款可到台灣，但 Paddle 官方亞洲支援清單未明列台灣；審核約 3 天。來源：[Shareuhack（2026-04-08）](https://www.shareuhack.com/en/posts/taiwan-indie-dev-global-payments-guide-2026)
- 【未查證】Paddle 審核對「模板、UI kit、數位下載」類商品歷來較嚴格，且無內建 license key（需自建或接 Keygen）。

**Gumroad**
- 【二手】直接銷售 10% + 50¢，另加卡片處理費；US$1,000 營收約淨得 US$863。來源：[DEV Community（2026-10）](https://dev.to/panchei/ten-100-sales-on-7-merchants-of-record-what-actually-reaches-your-bank-oct-2026-53e6)
- 【二手】2026-03 起標準最低出款門檻由 US$10 提高到 US$100，完成身分驗證後回到 US$10。來源：[Roo newsletter: Gumroad Fees 2026](https://roo.beehiiv.com/p/gumroad-fees-2026)
- 【未查證】Gumroad 內建 license key 與驗證 API（`/v2/licenses/verify`）、PPP（購買力平價）定價開關、折扣碼；出款可至 PayPal 或銀行。台灣出款方式本次未查證。

**Creem**
- 【二手】費率 3.9% + 40¢（多數比較中最低）；出款費 7 或 1%（取高者）。來源：[DEV Community（2026-10）](https://dev.to/panchei/ten-100-sales-on-7-merchants-of-record-what-actually-reaches-your-bank-oct-2026-53e6)
- 【二手，搜尋摘要轉述官方頁】Creem 官方支援國家頁稱可對 86 國出款，台灣在列；本地銀行轉帳出款費 7 EUR/USD 或 1%（取高者）；未說明個人是否可用。來源：[Creem Supported Countries](https://docs.creem.io/merchant-of-record/supported-countries)
- 【二手，競品來源】Dodo 的比較頁稱 Creem 沒有原生 license key 管理；此說法來自競爭對手，需以 Creem 文件確認。來源：[Dodo vs Creem](https://dodopayments.com/compare/dodopayments-vs-creem)

**Dodo Payments**
- 【二手】費率 4% + 40¢，國際卡 +1.5%、訂閱 +0.5%；出款低於 US$1,000 收 US$5。來源：[DEV Community（2026-10）](https://dev.to/panchei/ten-100-sales-on-7-merchants-of-record-what-actually-reaches-your-bank-oct-2026-53e6)
- 【已查證】Dodo 官方 accepted countries 清單第 154 項為「Taiwan」；帳戶類型包含 Individual，個人資格以其政府核發證件所屬國是否在清單內判斷；頁面未載明出款方式與幣別。來源：[Dodo Accepted Countries](https://docs.dodopayments.com/miscellaneous/accepted-countries-and-territories.md)
- 【二手，自家行銷】Dodo 宣稱內建 license key 產生、啟用追蹤與裝置數限制。來源：[Dodo vs Creem](https://dodopayments.com/compare/dodopayments-vs-creem)

### Inferences
- 以 US$149 單價、非美國卡為例粗估單筆平台費（不含出款與換匯）：Polar Starter 5% + 1.5% + 50¢ 約 US$10.19（6.8%）；Polar Pro 3.8% + 1.5% + 40¢ 約 US$8.30，月費 US$20 需月銷約 10 套以上才划算；Paddle 5% + 50¢ 約 US$7.95；Dodo 4% + 1.5% + 40¢ 約 US$8.60；Creem 3.9% + 40¢ 約 US$6.21；Gumroad 10% + 50¢ 加卡費約 US$15 以上。高單價一次性授權下，各 MoR 間差距每筆約 US$2 至 4，平台穩定度、台灣出款可行性與 license/GitHub 功能比費率更重要。
- Polar 是唯一同時具備「官方文件明列台灣出款」「內建 license key 公開驗證 API」「GitHub repo 存取 benefit（待確認）」三者的選項，最契合 shadcn registry 授權端點的架構。
- Lemon Squeezy 已進入維護狀態、未來遷移目標 Stripe Managed Payments 又不支援台灣賣家，對新產品屬高風險選擇，不建議作為主力。
- Polar 出款走 Stripe Connect Express，台灣個人收美元後換成新台幣入帳時有最高 1% 換匯成本；若要保留美元，需確認 Stripe 對台灣是否支援外幣帳戶出款（未查證）。

### Gaps
- Polar 台灣個人帳戶實際能否以 individual 類型通過 Stripe Connect Express KYC，官方只給自我檢查步驟，未找到台灣開發者實測紀錄。
- Creem 是否接受無公司個人、Creem 是否有 license key、Dodo 台灣出款方式與幣別，均未取得官方文件。
- Paddle 對台灣無公司個人的最新政策、對 UI kit 類商品的審核態度，無官方來源。
- Gumroad 對台灣的出款管道（PayPal 或銀行）與 PPP 功能細節本次未查證。
- 所有 MoR 是否都把台灣列為「買家可購買」且由 MoR 代收代繳台灣跨境電子勞務營業稅，未逐一查證。

## Q2. 台灣稅務與在地金流：所得稅、營業稅與統一發票、行號或公司、綠界與藍新

### Takeaway
最需要注意的一點：SunUI Pro 是在台灣境內開發與提供，依財政部「勞務提供地」原則，收入很可能被認定為「中華民國來源所得」，應併入當年度綜合所得稅申報，而不是適用海外所得 100 萬 / 750 萬元的最低稅負制門檻；網路上常見「海外收入 750 萬以下免稅」說法不適用於此情境（需會計師確認）。營業稅方面，自 2025-01-01 起銷售勞務起徵點為每月 5 萬元、銷售貨物 10 萬元，超過後應辦營業登記；向國外 MoR 銷售可能適用外銷零稅率，但個人未登記時不能適用，須由會計師判斷。

### Cited Findings
- 【已查證】財政部：同一申報戶全年海外所得合計達新臺幣 100 萬元，且基本所得額合計超過 750 萬元，才需申報繳納基本稅額；未達 100 萬元免予計入。海外所得同樣分十類，包含執行業務所得、營利所得，可減除成本及必要費用。來源：[財政部全球資訊網](https://www.mof.gov.tw/singlehtml/384fb3077bb349ea973e7fc6f13b6974?cntId=8294024de8c5456383632aa1dba03e7b)、[臺北國稅局海外所得專區](https://www.ntbt.gov.tw/singlehtml/556ab3590b554db5b4be085935e0233b?cntId=9b2b34f08e31483eb30c00872b76c8aa)
- 【二手，律所整理財政部 2009 年認定原則】勞務報酬來源以「勞務提供地」為判斷基準；完全在境外提供者非我國來源所得，若需境內個人或營利事業參與協助才能完成則可能屬境內來源。標準化單機軟體、電子書若在境外產製、僅網路傳輸至境內，對外國營利事業而言非我國來源收入。來源：[理律法律事務所 Newsletter](https://www.leeandli.com/TW/Newsletters/4174.htm)、[理律 Newsletter 5327](https://www.leeandli.com/TW/Newsletters/5327.htm)
- 【二手】反向推論：個人在中華民國境內提供勞務之報酬屬中華民國來源所得，境內居住者應依綜合所得稅規定申報；判斷標準是勞務提供地而非匯款來源。來源：[財政部稅務入口網 外僑稅務問答](https://www.etax.nat.gov.tw/etwmain/tax-info/understanding/tax-q-and-a/national/individual-income-tax/alien-tax-question/taxation-scope/OQ0DQxJ)
- 【二手】外國事業在境內無固定營業場所，經網路銷售電子勞務給境內自然人時，該外國事業為營業稅納稅義務人（即 MoR 對台灣買家應自行處理台灣營業稅）。來源：[理律 Newsletter](https://www.leeandli.com/TW/Newsletters/1630.htm)
- 【二手，新聞報導財政部公告】自 2025-01-01 起（2025 年第一季查定案件開始），營業稅起徵點銷售貨物由 8 萬元調高為 10 萬元、銷售勞務由 4 萬元調高為 5 萬元；網路賣家與實體店家相同；同時銷售貨物與勞務者以兩者占各自起徵點百分比加總，達 100% 即應課徵；網路賣家每月銷售額改按當月實際銷售額計算。來源：[工商時報 2024-10-06](https://www.ctee.com.tw/news/20241006700318-430104)、[INSIDE](https://www.inside.com.tw/article/18799-E-commerce-tax)
- 【二手】財政部函釋曾認為國內營業人間出售境外註冊專利權屬境內銷售勞務，無零稅率適用，學者對此有質疑；顯示「外銷零稅率」適用常有爭議。來源：[理律 Newsletter 5327](https://www.leeandli.com/TW/Newsletters/5327.htm)
- 【二手】一般台灣獨立開發者指南未處理境內/海外所得分類，只建議諮詢台灣稅務顧問。來源：[Shareuhack（2026-04-08）](https://www.shareuhack.com/en/posts/taiwan-indie-dev-global-payments-guide-2026)
- 【未查證】綠界 ECPay、藍新 NewebPay 皆提供個人會員收款（信用卡、ATM、超商代碼），手續費約信用卡 2.75% 上下；個人賣家不開統一發票，但達營業規模後須以營業人身分開立電子發票，綠界與藍新也提供電子發票加值服務。本次未讀到官方費率頁，需至 ecpay.com.tw、newebpay.com 確認最新費率與個人會員收款上限。

### Inferences
- SunUI Pro 由謝上智在台灣開發，交付形式是授權金鑰與程式碼下載，較接近「銷售勞務／電子勞務」而非貨物，起徵點可能適用每月 5 萬元（約 US$1,600 營收，即每月約 10 套 US$149），需會計師確認分類。
- 透過 MoR 銷售時，法律上買家是 MoR（外國公司），開發者是把產品「賣給 MoR」或收取「權利金／分潤」；所得類別可能是執行業務所得、權利金或其他所得，影響可扣除費用比例，需會計師確認。
- 營收規模建議（推論，需會計師確認）：每月持續低於起徵點時以個人身分申報綜所稅即可；持續超過每月 5 萬元時考慮設立行號（小規模營業人可能由國稅局查定課徵 1% 營業稅、免開發票，或使用一般稅額但外銷可能零稅率）；年營收達數百萬以上、或需要 Paddle 等要求商業登記的平台、或要接企業採購時，再評估有限公司（營所稅 20%，盈餘分配另課股利所得）。
- 在地 TWD 金流（綠界、藍新）只在台灣買家比例明顯時才值得加；它們不是 MoR，境內銷售須自行處理統一發票，對個人而言會把營業稅問題變成立即的義務，因此初期建議台灣買家也走 MoR 刷卡。

### Gaps
- 未找到財政部針對「台灣居民個人經國外 MoR 銷售自製軟體授權」的直接函釋，所得來源與類別判斷屬推論。
- 未取得外銷零稅率（加值型及非加值型營業稅法第 7 條）對「銷售給國外 MoR 的電子勞務」的官方適用說明。
- PTT、Threads 上台灣開發者實際報稅經驗本次未搜尋到可引用來源。
- 綠界、藍新最新費率與個人會員限制未查證。

## Q3. 授權交付架構：shadcn 私有 registry 認證、既有付費 registry 做法、授權驗證 API、濫用防範、GitHub 邀請自動化

### Takeaway
shadcn CLI 原生支援在 `components.json` 的 `registries` 以命名空間設定 URL 樣板加 `headers` 或 `params`，值可用 `${LICENSE_KEY}` 從 `.env.local` 讀取；伺服器以 401/403/429 回應並可附 `message` 給 CLI 顯示。建議架構：`@sunui-pro` 命名空間指向自家 Next.js registry 端點，端點以 Authorization header 取得 key，呼叫 Polar validate API（加快取）判斷授權，再依 key 做限流與用量記錄。

### Cited Findings
- 【已查證】每個私有 registry 在 `"registries"` 下為一個命名空間，可為字串 URL，或含 `url`、`headers`、`params` 的物件；URL 含 `{name}` 佔位符；headers 範例包含 `"Authorization": "Bearer ${REGISTRY_TOKEN}"`、`X-API-Key`、`X-License-Key`；params 會附加為 query string（如 `?token=`）；值用 `${VAR}` 語法，文件以 `.env.local` 示範。來源：[shadcn Registry Authentication](https://ui.shadcn.com/docs/registry/authentication)
- 【已查證】同一 `components.json` 可混用公開與認證命名空間，例如 `@public`、`@internal`（Bearer）、`@premium`（license key header）；每個 registry 有獨立的認證脈絡。來源：[shadcn Registry Authentication](https://ui.shadcn.com/docs/registry/authentication)
- 【已查證】伺服器端建議：憑證缺失或無效回 401，有效但無權限回 403，未知元件回 404；CLI 會處理 401、403、429，並顯示 JSON body 中的自訂 `message`。安全建議包括只用 HTTPS、不提交 token、加 rate limit（範例 express-rate-limit，15 分鐘 100 次/IP）、定期輪替 token（範例 30 天到期）、記錄使用者、元件、IP、User-Agent。測試方式：`REGISTRY_TOKEN=xxx npx shadcn@latest add @private/button`。來源：[shadcn Registry Authentication](https://ui.shadcn.com/docs/registry/authentication)
- 【二手，官方部落格與文件】shadcnblocks：Pro 區塊透過 `@shadcnblocks` 命名空間 registry，URL 樣板加 Authorization Bearer header 讀取環境變數；key 由使用者後台產生，前綴為 `sk_live_`，可能過期或被撤銷。來源：[Shadcnblocks Blog](https://www.shadcnblocks.com/blog/shadcn-private-registry-access-namespaced-registries)、[Shadcnblocks CLI docs](https://docs.shadcnblocks.com/blocks/shadcn-cli)
- 【二手】Shadcn Studio：免費項目不需憑證；付費項目需在 `.env` 設定 `EMAIL` 與 `LICENSE_KEY`（email 加 key 雙因子）。來源：[Shadcn Studio Docs](https://shadcnstudio.com/docs/getting-started/how-to-use-shadcn-cli)
- 【二手】21st.dev 與 shadcndesign 的文章說明以伺服器端授權檢查保護付費內容。來源：[21st.dev blog](https://21st.dev/blog/publish-shadcn-registry)、[shadcndesign blog](https://www.shadcndesign.com/blog/shadcn-ui-registry-explained)
- 【已查證】Polar license key 支援 activation 上限、usage 額度與 `increment_usage`、key 輪替（舊 key 立即失效），validate 端點可公開呼叫。來源：[Polar License Keys](https://polar.sh/docs/features/benefits/license-keys)
- 【未查證】Keygen（keygen.sh）提供獨立授權服務，含 machine activation、entitlements、policy；有雲端付費方案與可自架的 Community Edition。Lemon Squeezy 與 Gumroad 亦有 license 驗證 API（見 Q1）。

### Inferences
- 建議 registry 端點流程（推論）：
  1. `components.json` 設定 `"@sunui-pro": { "url": "https://sunui.design/r/pro/{name}.json", "headers": { "Authorization": "Bearer ${SUNUI_LICENSE_KEY}" } }`。
  2. 端點收到 key 後，先查 Edge KV/Redis 快取（例如 10 至 60 分鐘），未命中再呼叫 Polar `validate`，快取 `status`、方案（Personal/Team）、到期與 `customer_id`。
  3. 以 key 為單位限流（例如每小時 N 次），並記錄不同 IP/ASN 數量；短時間內大量不同 IP 使用同一把 key 時回 429 或標記人工審查。
  4. 對 Team 授權用 Polar activation 模擬「席位」：每位開發者以 `label`（例如 GitHub 帳號或機器名）activate，達上限回 403 並附 `message` 指引升級。
  5. 撤銷（退款、濫用）時在 Polar 撤銷或輪替 key，端點快取需能被 webhook 主動清除。
- 防止分享：程式碼一旦下載即無法收回，技術手段只能提高成本；合理組合是「key 綁定 email 或帳號 + 用量與 IP 異常偵測 + 可輪替 + 授權條款約束 + 每個 key 的回應可加上不可見識別（例如在檔案註解寫入授權 ID）以追溯外洩來源」。
- GitHub 私有 repo 交付：若 Polar GitHub benefit 已確認可用，可直接使用；否則以 Polar webhook（order.created、order.refunded）觸發 GitHub REST API `PUT /repos/{owner}/{repo}/collaborators/{username}`（需在 checkout 收集 GitHub username），退款時 `DELETE`。注意個人帳號 repo 的 collaborator 權限較粗，建議改用 GitHub Organization 並給 read 權限（未查證細節）。

### Gaps
- Aceternity Pro、Magic UI Pro、Tailark、21st.dev 的付費授權細節本次未找到官方說明。
- Polar license validate 端點的 rate limit 未記載，大量 CLI 請求直打 Polar 是否會被限流不明，因此建議自建快取。
- shadcn CLI 載入 `.env.local` 的確切機制（是否也讀 `.env`）官方頁未說明。

## Q4. 法律：UI kit 商業授權條款參考（Tailwind Plus）、席位、終端產品限制、禁止再散布、與 MIT 免費層並存

### Takeaway
Tailwind Plus 的核心邏輯是「可無限做終端產品（含客戶案與販售給終端使用者的產品），但不得把元件重新包裝成讓別人拿來建站的產品（主題、UI kit、page builder、網站建構器）」，SunUI Pro 可沿用此結構並加上 Personal（1 人）與 Team（N 席）兩級；免費層維持 MIT，付費層使用獨立的專有授權，兩者在不同套件或不同 registry 命名空間中明確分開。

### Cited Findings
- 【二手，搜尋摘要轉述官方授權頁與 FAQ】Tailwind Labs 授予持續、非專屬授權，涵蓋 Components、Templates、Libraries；可為無限客戶製作無限 End Products，包括銷售給終端使用者的產品。來源：[Tailwind Plus License](https://tailwindcss.com/plus/license)
- 【二手】限制：終端產品必須由你的公司或其客戶單獨擁有，員工或外包不得用公司授權做自己的網站或副業；不得把 Tailwind Plus 存取權當作其他購買的贈品；不得把團隊帳號賣給非公司成員。來源：[Tailwind Plus License](https://tailwindcss.com/plus/license)
- 【二手】FAQ 明言不得用來製作主題、UI kit、page builder 等「重新包裝並再散布元件或模板供他人建站」的衍生產品；也排除讓終端使用者用其元件自行建站的「website builder」專案；為單一客戶開發的客製網站則允許。來源：[Tailwind Plus License](https://tailwindcss.com/plus/license)
- 【二手】網路上流傳的舊 Tailwind UI 授權副本（如 25 人上限、未提及 Libraries）已過時，不應作為現行條款。來源：[GitHub 舊授權副本](https://github.com/top-gg/docs/pull/103/files)、[Notion 舊 Standard License](https://boiling-clove-40c.notion.site/Tailwind-UI-License-644418bb34ad4fa29aac9b82e956a867)
- 【已查證】本次直接抓取 tailwindcss.com/plus/license 只得到登入頁，未能逐字讀取條款全文。來源：[Tailwind Plus License](https://tailwindcss.com/plus/license)

### Inferences
- SunUI Pro 授權草案要點（推論，正式條款建議請律師審閱）：
  - Personal：1 位開發者、無限專案、可商用與接案、終身更新（或「終身存取 + N 年更新」，需定價策略配合）。
  - Team：N 席（例如 5 或 10 人），席位對應 registry activation 上限。
  - 允許：SaaS、客戶網站、內部工具、販售給終端使用者的應用程式。
  - 禁止：再散布原始碼、上傳到公開 repo、製作競爭性 UI kit/模板/主題/page builder/AI 元件生成器的訓練或輸出資料集、分享 license key、轉售。
  - 開源專案：可參考常見做法，允許在開源專案中使用「編譯後產物」但不得公開 Pro 原始元件檔案，或要求另行聯繫。
- MIT 並存：免費元件（現有 `@sunui-design/react` 與公開 registry）保持 MIT；Pro 元件放在獨立私有 repo 與 `@sunui-pro` 命名空間，每個檔案頂端加授權標頭；避免 Pro 程式碼混入 MIT 套件，以免授權界線模糊。
- 條款可在 checkout 頁以連結呈現並由 MoR 收集同意紀錄。

### Gaps
- 未能取得 Tailwind Plus 條款全文逐字核對（頁面需登入或抓取失敗）。
- 未比較 shadcnblocks、Aceternity Pro、Magic UI Pro 的授權條款（席位數、開源使用規則）。
- 退款政策與數位商品在歐盟 14 天撤回權的處理（MoR 通常有預設規則）未查證。
