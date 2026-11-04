# AI 時代下 React 元件庫市場趨勢：shadcn registry 生態、AI 生成 UI、AI agent 消費元件（截至 2026-11-04）

標記說明：【已驗證】表示本次研究直接讀取該 URL 或 API 取得；【二手】表示來自新聞或第三方整理，未取得一手原文；【推估】為研究者推論。所有 npm／GitHub 數字於 2026-11-04 透過公開 API 擷取。

## 一、shadcn/ui registry 的演進（schema、namespace、directory、私有 registry 認證、MCP、view/search、採用數）

### Takeaway
shadcn 已從「複製貼上元件」轉型為一套通用的程式碼散佈協定：namespace registry、官方索引（2026-11 共 539 個 registry）、私有 registry（header／env var／GitHub token）、MCP server 與 agent skills 一應俱全，2025-08 到 2026-10 幾乎每月都有 registry 或 agent 相關更新。對 SunUI 而言，「成為一個高品質、可被 agent 發現與安裝的 @sunui registry」已是基本門票，而非差異化。

### Cited Findings
- 官方 changelog 時間軸【已驗證】：2025-02 Tailwind v4 與更新版 registry schema；2025-04 MCP 初版；2025-07 Universal Registry Items；2025-08 shadcn CLI 3.0 與 MCP Server；2025-09 Registry Index；2025-10 Registry Directory；2025-12 `npx shadcn create`；2026-01 Base UI 文件；2026-03 shadcn/cli v4；2026-04 shadcn preset、shadcn apply；2026-05 shadcn eject、Registry Include and Validate；2026-06 GitHub Registries、Components for Chat Interfaces；2026-07 Base UI 成為預設、React Aria 支援、Dynamic Search、@shadcn/helpers；2026-08 Private GitHub Registries、Human in the Loop；2026-09 `cn` 獨立套件；2026-10 Trace、Code Block 與 AI Elements（21 個 agentic UI pattern）。[shadcn changelog](https://ui.shadcn.com/docs/changelog)
- 2026-08 Private GitHub Registries：CLI 可用 GitHub CLI 憑證或 `GH_TOKEN`／`GITHUB_TOKEN` 從私有 GitHub repo 安裝，`add`、`list`、`search`、`view`、`registry validate` 均支援。【已驗證】[shadcn changelog](https://ui.shadcn.com/docs/changelog)
- `components.json` 的 `registries` 欄位：以 `@namespace` 為鍵，值可為含 `{name}`（必要）與 `{style}`（選用）的 URL 範本字串，或物件 `{ url, headers, params }`；`${VAR}` 會從 `process.env` 展開於 URL、headers、params，官方建議把 token 放 `.env.local`，CLI 不會記錄環境變數值。範例：`"@private": { "url": "https://api.company.com/registry/{name}.json", "headers": { "Authorization": "Bearer ${REGISTRY_TOKEN}" } }`。【已驗證】[shadcn Namespaced Registries](https://ui.shadcn.com/docs/registry/namespace)
- 跨 registry 解析流程：解析 namespace，組 URL，套 header，以 registry-item schema 驗證，遞迴解析 `registryDependencies`（各自從其 registry 取得），拓撲排序，依目標路徑去重（後解析者勝出），並深度合併 `tailwind`、`cssVars`、`css`、`envVars`。安裝語法 `npx shadcn@latest add @acme/header @lib/auth-utils @ai/chatbot-rules`。【已驗證】[shadcn Namespaced Registries](https://ui.shadcn.com/docs/registry/namespace)
- Registry Index：執行 `shadcn add` 或 `shadcn search` 時 CLI 會查官方索引並自動把 registry 寫入 `components.json`；完整清單在 `https://ui.shadcn.com/r/registries.json`。收錄方式：在 shadcn-ui/ui repo 的 `apps/v4/registry/directory.json` 新增條目，跑 `pnpm validate:registries`，開 PR；條件為開源、公開、符合 schema、扁平結構（`registry.json` 與 item 在根目錄）、`files` 不含 `content`。合併後立即上線，之後由 Registry Health 持續監控。使用 `owner/repo/item` 位址的 GitHub registry 不需登錄索引。【已驗證】[shadcn Registry Index](https://ui.shadcn.com/docs/registry/registry-index)
- 索引規模（2026-11-04 擷取 registries.json）：共 539 個 registry；健康狀態 healthy 441、degraded 43、unavailable 44、observing 11。每筆資料含 `health`（reliability、correctness、installability、hygiene 分項分數與 7 日／30 日可用率）與 `ranking`（score、itemCount）。【已驗證】[registries.json](https://ui.shadcn.com/r/registries.json)
- 索引中知名 registry（已確認存在）：@magicui、@aceternity、@animate-ui、@motion-primitives、@kibo-ui、@reui、@coss、@clerk、@supabase、@ai-elements、@shadcnblocks、@tailark、@react-bits、@smoothui、@cult-ui、@elevenlabs-ui、@hextaui、@efferd、@assistant-ui、@better-auth-ui、@auth0、@algolia、@creative-tim、@8bitcn。品項數最多者：@registrydirectory 22,994、@coolicons 19,860、@keyline 13,536、@hugeicons-animated-vue 6,122、@shadcn-exchange 5,456、@shadcnblocks 4,921、@shadcn-ui-blocks 4,022、@react-bits 1,274。描述含 "motion" 的有 88 個、含 "anim" 的 94 個、含 "block" 的 124 個。【已驗證】[registries.json](https://ui.shadcn.com/r/registries.json)
- shadcn MCP server：讓 AI 助手以自然語言瀏覽、搜尋、安裝 shadcn 官方、第三方與私有 registry 的元件、blocks、templates；`npx shadcn@latest mcp init --client claude` 一鍵設定，支援 Claude Code（`.mcp.json`）、Cursor（`.cursor/mcp.json`）、VS Code（`.vscode/mcp.json`）、Codex（`~/.codex/config.toml` 手動設定）。私有 registry 沿用 `components.json` 的 headers 設定。【已驗證】[shadcn MCP](https://ui.shadcn.com/docs/mcp)
- shadcn/cli v4（2026-03）定位為「built for you and your coding agents」：`init --preset <code>`（打包色彩、主題、圖示庫、字型、圓角）、`add --dry-run`／`--diff`／`--view`（檢視 registry payload 與本地差異）、`info`、`docs <component>`、`init --template`（Next.js、Vite、TanStack Start、React Router、Astro、Laravel）、`init --base radix|base`；新 registry 類型 `registry:base`（一次散佈整套設計系統）與 `registry:font`，`registry:build`、`registry:mcp` 棄用；官方 agent skill `pnpm dlx skills add shadcn/ui`，目標是減少 agent 犯錯並讓輸出符合設計系統。【已驗證】[shadcn CLI v4 changelog](https://ui.shadcn.com/docs/changelog/2026-03-cli-v4)

### Inferences
- 【推估】Registry Health 分數與 ranking 已出現，代表官方索引未來可能依品質排序搜尋與 MCP 結果；registry 的可用率、schema 正確性、可安裝性會直接影響被 agent 推薦的機率，等同「registry SEO」。
- 【推估】2026-07 起 Base UI 為預設、並支援 React Aria 與 Radix；SunUI 若只支援 Radix，未來在 `init --base base` 的新專案中可能相容性較差，應規劃 primitive 中立或多 base 版本。
- 【推估】shadcn 官方自己推出 AI Elements、Trace、Chat 元件，代表「AI 介面元件」這塊官方會直接佔據，第三方在通用 AI chat UI 上空間縮小。
- 【推估】私有 registry 認證機制（Bearer header、env var、GitHub token）已足以實作 Pro 版授權發放，SunUI Pro 可用「每位使用者一組 token 的 @sunui-pro namespace」而不必自建 CLI。

### Gaps
- registry.json／registry-item.json 的最新完整欄位清單（例如 `meta`、`docs`、`categories` 在 2026 是否新增欄位）本次未逐欄讀取 schema 檔。
- 2026-06 GitHub Registries、2026-07 Dynamic Search、2026-05 Registry Include and Validate 的詳細內容，changelog 首頁只列標題，未讀到單篇內文。
- registries.json 中 `firstObservedAt` 最早為 2026-08，這是 Registry Health 開始監控的時間，不是 registry 建立時間，因此無法用它還原 registry 數量的成長曲線；2025-09 上線時的數量未找到可靠資料。
- 每個 registry 的實際安裝量（例如 @magicui 被 add 幾次）官方沒有公開。

## 二、v0、Lovable、Bolt、Cursor、Claude Code 等工具如何使用元件庫；能否安裝第三方 registry；21st.dev Magic MCP 模式

### Takeaway
v0 以 shadcn/ui 為預設並支援「Open in v0」與自訂 registry，但 Open in v0 只吃公開、非 namespace、無 header 認證的 registry item；Cursor、Claude Code、VS Code、Codex 則透過 shadcn MCP 與 CLI 可完整安裝第三方與私有 registry。Lovable、Bolt 目前沒有找到官方「匯入 registry URL」的機制，主要靠 Knowledge／context 欄位與 shadcn + Tailwind 預設。21st.dev 已從元件市集轉為「Magic MCP 生成元件」模式。

### Cited Findings
- Open in v0 端點格式：`https://v0.dev/chat/api/open?url=[registry item JSON URL]`；限制：不支援 `cssVars`、`css`、`envVars`、namespaced registries，以及 header 中的 Bearer token／API key；唯一認證方式是 `token` query 參數，伺服器驗證失敗應回 401。【已驗證】[shadcn Open in v0](https://ui.shadcn.com/docs/registry/open-in-v0)
- `components.json` 範例直接示範 `"@v0": "https://v0.dev/chat/b/{name}"`，即 v0 生成結果本身也可作為 registry 安裝來源。【已驗證】[shadcn Namespaced Registries](https://ui.shadcn.com/docs/registry/namespace)
- v0 文件：自訂 shadcn registry 可把元件、blocks、design tokens 提供給 v0，讓它生成符合自家設計系統的原型；建議以 Vercel Registry Starter Template 起步；但 v0 主要依預設 shadcn 實作訓練，若大幅改寫底層元件可能出現非預期生成結果。【二手，版本化鏡像頁】[v0 Design systems](https://237.v0.build/docs/design-systems)
- shadcn MCP 支援 Claude Code、Cursor、VS Code、Codex，可搜尋並安裝任何符合 shadcn 規格的第三方或私有 registry。【已驗證】[shadcn MCP](https://ui.shadcn.com/docs/mcp)
- Bolt、Lovable、v0、Replit 等 AI 原型工具被描述為「深度針對 shadcn + Tailwind 組合最佳化」，品牌與風格規範主要透過專案設定中的 Knowledge 欄位提供。【二手】[Anna Arteeva Substack](https://annaarteeva.substack.com/p/design-systems-lovable-bolt-v0-and)
- 21st.dev Magic（現稱 21st AI，前身 Magic Chat）：agent 透過 MCP 呼叫 `generate` 工具，回傳一個可觀看生成過程的 URL（非 inline 程式碼）；`code` 模式產出 React/shadcn 元件與 live sandbox，`sketch` 模式產出 HTML/Tailwind 草稿並可套用社群主題配色；支援 Cursor、Claude Code、Windsurf 與任何 MCP client；CLI 為 `npx @21st-dev/cli@latest`；免費層有每日額度，用完後出現付費牆。【已驗證】[21st.dev Magic](https://21st.dev/magic)
- @21st 不在 shadcn 官方 registry 索引中（2026-11-04 查詢）。【已驗證】[registries.json](https://ui.shadcn.com/r/registries.json)

### Inferences
- 【推估】主要散佈管道分兩類：IDE agent（Claude Code、Cursor、Codex）走 MCP + namespace registry，可完整支援 Pro 私有授權；瀏覽器端生成器（v0）走 Open in v0，只能吃公開 item，因此 Open in v0 適合當作免費版的行銷入口，不適合發放 Pro。
- 【推估】v0「依預設 shadcn 訓練」意味著 SunUI 元件若遵循 shadcn 慣例（cn、cssVars、data-slot、Radix/Base UI 組合模式），在 AI 工具中被正確修改的機率較高；偏離慣例的 API 會降低 AI 相容性。
- 【推估】21st.dev 從「市集」轉向「按次生成付費」，顯示元件交易價值正從「程式碼本身」轉移到「生成與品味」；SunUI 可思考是否提供自家 MCP 或 registry 讓 agent 以 SunUI 元件為素材組裝，而非與生成器正面競爭。

### Gaps
- v0 官方（v0.app）目前文件中自訂 registry 的最新用法與限制，只找到鏡像頁，未讀到正式頁。
- Lovable、Bolt 是否支援直接輸入 shadcn registry URL 或 MCP，本次未找到官方文件，需向官方確認。
- 21st.dev 的定價方案細節、創作者分潤、使用量數據頁面未提供。

## 三、AI 是否降低付費 UI kit 需求，或反而提高對高品質、獨特、互動密集元件的需求

### Takeaway
最強的負面證據是 Tailwind Labs：使用量創新高但營收跌約 80%、文件流量跌約 40%，2026-01 裁掉四分之三工程師，2026-09 被 Shopify 收購並停止 Tailwind Plus 新註冊。「以文件流量導購的一次性買斷 UI kit」模式已被 AI 實質破壞。正面證據多為間接訊號（動畫元件 registry 數量多、motion 下載暴增），缺乏可靠營收數據。

### Cited Findings
- 2026-01-06 Adam Wathan 在 GitHub 關閉一個讓文件更適合 LLM 讀取的 PR 時揭露裁員；工程團隊 75%（3 人）被裁，原因是「AI 對業務的殘酷衝擊」；文件流量兩年內下降約 40%，營收下降近 80%，而 Tailwind 使用量「成長得比以往都快」；若無改變約六個月後將無法支付薪資。他拒絕該 PR，理由是會讓業務「更不可持續」。【已驗證，二手報導引述原話】[DevClass 2026-01-08](https://www.devclass.com/2026/01/08/tailwind-labs-lays-off-75-percent-of-its-engineers-thanks-to-brutal-impact-of-ai/)
- Tailwind Plus 為一次性買斷、含未來更新的元件包，新營收只能靠新客；而 AI 回答問題或直接安裝 Tailwind 時開發者不會進入網站，付費方案曝光不到。【已驗證】[DevClass](https://www.devclass.com/2026/01/08/tailwind-labs-lays-off-75-percent-of-its-engineers-thanks-to-brutal-impact-of-ai/)
- 裁員消息後 24 小時內 Vercel、Google AI Studio、Supabase、Lovable、Gumroad 等宣布贊助。【二手】[OfficeChai](https://officechai.com/ai/google-vercel-lovable-others-come-forward-to-sponsor-tailwind-after-company-reveals-75-ai-related-layoffs)、[DevClass](https://www.devclass.com/2026/01/08/tailwind-labs-lays-off-75-percent-of-its-engineers-thanks-to-brutal-impact-of-ai/)
- 2026-09-09 Tailwind Labs 宣布加入 Shopify，金額未揭露；Tailwind CSS 維持 MIT 授權；Wathan 稱每週安裝超過 1.1 億次。【已驗證】[BetaKit](https://betakit.com/tailwind-finds-stable-long-term-home-with-shopify-acquisition/)
- 多家媒體報導收購後 Tailwind Labs 停止 Tailwind Plus 與 ui.sh 的新註冊，既有客戶保留存取。【二手；BetaKit 原文未提及此點，需以 Tailwind 官方部落格確認】[GCN](https://gcn.com/?p=22147)、[CMSWire](https://www.cmswire.com/digital-experience/shopify-acquires-tailwind-labs-to-secure-css-framework/)
- 有分析指出 Wathan 的文章未使用「acquisition」一詞，且 Shopify 自有管道未發布消息，「收購」一詞主要來自媒體。【二手，單一來源】（見上述搜尋結果彙整，來源為 [witscode](https://witscode.com/blogs/shopify-acquires-tailwind-labs-what-was-announced)）
- 社群評論：AI 可生成客製程式碼後，299 美元的 UI kit 價值下降（評論者意見，非 Wathan）。【二手】[DevClass](https://www.devclass.com/2026/01/08/tailwind-labs-lays-off-75-percent-of-its-engineers-thanks-to-brutal-impact-of-ai/)
- 動畫型付費產品仍在販售：Aceternity UI Pro 一次性 199 美元；Magic UI Pro 為一次性授權含終身更新並有團隊方案（單一聯盟行銷來源稱團隊 499 美元）；均未公開營收。【二手】[Aceternity Pro](https://ui.aceternity.com/pro)、[aitoolsatlas Magic UI pricing](https://aitoolsatlas.ai/tools/magic-ui/pricing)
- 官方 registry 索引中，描述含 motion 的 88 個、含 anim 的 94 個，另有 @lucide-animated、@heroicons-animated、@hugeicons-animated、@motion-primitives、@animate-ui、@remotionui 等動畫專門 registry，顯示動畫元件是 registry 生態最擁擠的類別之一。【已驗證】[registries.json](https://ui.shadcn.com/r/registries.json)

### Inferences
- 【推估】Tailwind 案例的核心失靈點不是「UI kit 沒人要」，而是「透過文件流量導購 + 一次性買斷」的漏斗被 AI 繞過。SunUI 的 Pro 若同樣依賴「訪客逛 docs 後購買」，會面臨同樣風險；應讓付費價值出現在 agent 工作流內（私有 registry、MCP、更新與 diff 服務），並偏向訂閱或團隊授權而非純買斷。
- 【推估】AI 擅長生成靜態排版與常見 shadcn 版型，對多階段手勢、物理動畫、捲動編排、效能調校、無障礙與 reduced-motion 處理較弱；這是「LLM 難以一次生成正確」的區塊，但目前沒有量化證據支撐此需求，屬假說。
- 【推估】動畫 registry 已非常擁擠（約 90 個以上），僅靠「有動畫」不足以差異化；需以品質分數、設計一致性、可組合的 section 系統與實測效能做區隔。
- 【推估】Tailwind 拒絕 llms.txt PR 是防守性策略，但從結果看未能挽回營收；對新進者而言，對 AI 封閉的成本可能高於開放。

### Gaps
- 找不到 Magic UI、Aceternity、shadcnblocks、Tailark 等付費動畫／section 產品的可靠營收或用戶數。
- 找不到「AI 提高對互動密集元件需求」的量化研究或調查；目前只有間接訊號。
- Tailwind 官方部落格關於 Shopify 交易與 Tailwind Plus 停售的原文未直接讀取。

## 四、使用量數據：shadcn/ui stars 與 CLI 週下載、motion／framer-motion 下載、Tailwind v4 採用率、React 19／Next.js 16

### Takeaway
所有指標一年內大幅成長，shadcn CLI 週下載從約 45 萬增至約 1,725 萬（約 39 倍），motion 從約 237 萬增至約 3,364 萬；Tailwind v4 已佔 tailwindcss 週下載約 74%，React 19 約 75%，Next.js 16 約 74%。SunUI 應直接以 Tailwind v4、React 19、Next.js 16、motion（而非 framer-motion 名稱）為基準。

### Cited Findings
- shadcn-ui/ui GitHub：127,342 stars、12,006 forks（2026-11-04）。【已驗證】[GitHub API](https://api.github.com/repos/shadcn-ui/ui)
- `shadcn` npm 週下載：2026-10-28 至 2026-11-03 為 17,253,807；去年同期（2025-10-28 至 2025-11-03）為 446,614。【已驗證】[npm API 本期](https://api.npmjs.org/downloads/point/last-week/shadcn)、[npm API 去年](https://api.npmjs.org/downloads/point/2025-10-28:2025-11-03/shadcn)
- `motion` 週下載 33,635,289（去年同期 2,369,190）；`framer-motion` 週下載 66,734,291（去年同期 11,642,569）。【已驗證】[npm API motion](https://api.npmjs.org/downloads/point/last-week/motion)、[npm API framer-motion](https://api.npmjs.org/downloads/point/last-week/framer-motion)
- `tailwindcss` 週下載 169,086,282（去年同期 27,779,485）；依版本分布，4.x 佔約 73.5%，3.x 約 26.2%。【已驗證】[npm API](https://api.npmjs.org/downloads/point/last-week/tailwindcss)、[npm versions API](https://api.npmjs.org/versions/tailwindcss/last-week)
- Wathan 2026-09 稱 Tailwind 每週安裝超過 1.1 億次，2026-01 報導稱約每月 7,500 萬下載。【二手】[BetaKit](https://betakit.com/tailwind-finds-stable-long-term-home-with-shopify-acquisition/)、[Neowin](https://www.neowin.net/news/tailwind-lays-off-75-employees-as-ai-kills-majority-of-its-revenue/)
- `react` 上週下載版本分布：19.x 約 75.5%、18.x 約 21.2%、17.x 約 1.6%。`next` 上週版本分布：16.x 約 74.2%、15.x 約 19.1%、14.x 約 5.3%。【已驗證】[npm versions API react](https://api.npmjs.org/versions/react/last-week)、[npm versions API next](https://api.npmjs.org/versions/next/last-week)
- shadcn 於 2024-10 支援 React 19，2025-02 支援 Tailwind v4。【已驗證】[shadcn changelog](https://ui.shadcn.com/docs/changelog)

### Inferences
- 【推估】下載量的數十倍成長很可能大量來自 AI agent 與 CI 的自動安裝（每次 agent 開新專案都會 `npx shadcn` 與安裝 motion），而非人類開發者數量等比成長；這同時代表「agent 是主要安裝者」，與 Tailwind「使用量上升、流量下降」的現象一致。
- 【推估】Tailwind 各來源數字（npm API 約 1.69 億／週 vs Wathan 1.1 億／週 vs 早先每月 7,500 萬）口徑與時間點不同，引用時應註明時間與來源。
- 【推估】framer-motion 下載仍為 motion 的約兩倍，多為舊依賴；新元件應 import `motion/react`，但 peer dependency 可考慮相容兩者。

### Gaps
- Next.js 16 與 React 19.x 對元件庫的具體技術影響（例如 React Compiler、Cache Components、View Transitions API 支援）本次未讀取官方發佈文。
- npm 下載數無法區分人類與 agent／CI，前述「agent 為主要安裝者」為推論。
- shadcn stars 的歷史成長曲線未擷取。

## 五、生態系對「AI-ready 元件」的建議（llms.txt、MCP、agent 文件、registry metadata）

### Takeaway
業界逐漸收斂成四層：llms.txt（精簡索引）+ llms-full.txt（全文）、MCP server（查文件／安裝）、agent skills（教 agent 如何正確使用 CLI 與元件）、以及符合 schema 的 registry metadata（讓 `shadcn search/view/docs` 與 MCP 可解析）。shadcn 官方本身已提供 MCP、skills、`docs`／`info`／`view` 指令，第三方 registry 最低限度要做好 schema 正確性與可安裝性。

### Cited Findings
- shadcn/cli v4 新增 `docs <component>` 與 `info`，明確目的是給 coding agent 正確使用元件所需的上下文；官方 skill `pnpm dlx skills add shadcn/ui` 教 agent 何時用 CLI、用哪些 flag，以減少錯誤並符合設計系統；`--diff` 讓 agent 可檢查 registry 更新並與本地修改合併。【已驗證】[shadcn CLI v4](https://ui.shadcn.com/docs/changelog/2026-03-cli-v4)
- Registry Health 以 reliability、correctness、installability、hygiene 四項評分每個索引中的 registry，並記錄 7 日／30 日可用率與 ranking。【已驗證】[registries.json](https://ui.shadcn.com/r/registries.json)
- 收錄條件要求 registry 為扁平結構、`files` 不含 `content`，並通過 `pnpm validate:registries`；CLI 另有 `registry validate` 指令。【已驗證】[shadcn Registry Index](https://ui.shadcn.com/docs/registry/registry-index)、[shadcn changelog](https://ui.shadcn.com/docs/changelog)
- Ant Design 同時提供 MCP server（元件文件、範例、changelog 查詢工具）與 llms.txt／llms-full.txt。【二手搜尋摘要】[Ant Design MCP](https://ant.design/docs/react/mcp)
- Starwind UI 提供 llms.txt、llms-full.txt、自動生成的 `ai-manifest.json`，以及 `@starwind-ui/mcp`。【二手搜尋摘要】[Starwind AI docs](https://starwind.pages.dev/docs/getting-started/ai/)
- SVAR 團隊認為 llms.txt 對大型、文件繁多的 UI 元件不實用，改做專屬 MCP server 依主題查詢文件。【二手搜尋摘要】[ITNEXT](https://itnext.io/how-we-built-mcp-server-for-our-react-gantt-component-854f895a856f)
- 21st.dev 以 `/llms.txt` 與 `/mcp.md` 對 agent 提供文件入口。【已驗證】[21st.dev Magic](https://21st.dev/magic)

### Inferences
- 【推估】SunUI 的 AI-ready 最小可行組合：(1) 登錄 shadcn 官方索引的 @sunui namespace，維持高 Registry Health 分數；(2) 每個 registry item 的 `description`、`categories`、`docs`、`registryDependencies` 寫給 agent 看（何時用、props、可存取性、reduced-motion 行為）；(3) llms.txt + llms-full.txt；(4) 一個 SunUI agent skill（例如「如何組合 SunUI section 成 landing page」）；(5) Pro 用 Bearer token 的 @sunui-pro 私有 namespace，並在 MCP 下自然可用。
- 【推估】由於 shadcn MCP 已能搜尋與安裝任何 registry，SunUI 自建 MCP 的邊際價值主要在「組裝與設計建議」（例如依品牌產生整頁 section 組合），而不是單純安裝。
- 【推估】Tailwind 的教訓顯示，把文件開放給 AI 會降低網站流量；因此付費轉換點應設計在 agent 端（例如 CLI 安裝 Pro item 時回 401 並附升級說明，shadcn CLI 與 Open in v0 對 401 都會顯示訊息），而非依賴網站瀏覽。

### Gaps
- shadcn 官方是否對第三方 registry 發布「AI-ready」或 agent 文件撰寫指南，本次未找到專門文件。
- 未找到 llms.txt 對元件庫採用率或轉換率影響的量化數據。
- registry-item schema 中專供 agent 使用的欄位（若有）本次未逐欄確認。
