# 動畫 / 微互動 React UI 元件庫競品景觀（資料截至 2026-11-04）

> 說明：標註「已驗證」者為本次直接抓取官網、GitHub API 或 npm API 取得；標註「自述」者為創辦人或官網單方說法；標註「二手」者來自第三方整理站，可信度較低。GitHub 星數與最後 push 時間皆為 2026-11-04 以 `gh api` 取得。

## Q1. 各競品提供什麼（數量、類別、技術棧、shadcn registry / MCP）

### Takeaway
市場已高度擁擠，主流玩家全部是 React + Tailwind + Motion（framer-motion），差異只在數量、風格與是否支援 shadcn CLI / MCP / AI agent skill。「MCP 與 AI prompt」在 2026 已成標配而非賣點；新進者 bencho.dev 則以「可調參數的單一微互動 + 音效 + 無限畫布」做出差異。

### Cited Findings

**bencho.dev**
- 首頁列出約 158 個 blocks，依互動類型分類：Press、Hover、Drag、Loading、Loop、Type、Swipe、Select、Slide，範例如 Dust delete、Flap board、Genie effect、Dot globe、Liquid toggle（已驗證）：[bencho.dev](https://bencho.dev)
- 四大區塊：Blocks（元件）、Sounds（「145 Interaction Sounds」，以 Web Audio API 合成，無音檔）、Finds（策展他人在 X 上的互動作品，標註原作者並連回 X 貼文）、Bench（「無限畫布」，可擺放 blocks 並就地調參，會記住位置與視角）（已驗證）：[Sounds](https://www.bencho.dev/sounds)、[Finds](https://www.bencho.dev/finds)、[Bench](https://www.bencho.dev/bench)
- 另有 MCP 頁面：「Ask your AI assistant for a block and it pastes the real component」（已驗證）：[bencho.dev/mcp](https://www.bencho.dev/mcp)
- 技術棧：每個 block 為一個資料夾（元件 + 獨立 CSS + props README），依賴 `framer-motion lucide-react`，色彩由 `tokens.css` 提供，dark mode 透過 `data-theme="dark"` 或系統設定；每個 block 有「Copy prompt」按鈕給 AI agent（已驗證）：[GitHub cabralorenzo/bencho README](https://github.com/cabralorenzo/bencho)
- 注意：bencho 使用自家 CSS + tokens，不是 Tailwind，也未見 shadcn registry（推論自 README 安裝方式）：[GitHub cabralorenzo/bencho](https://github.com/cabralorenzo/bencho)

**Magic UI / Magic UI Pro**
- GitHub `magicuidesign/magicui`：23,080 stars，MIT，2026-11-04 仍有 push，自稱「UI Library for Design Engineers…Free. Open Source.」（已驗證）：[GitHub](https://github.com/magicuidesign/magicui)
- Pro：9+ 模板（AI Agent、Dev Tool、Mobile、SaaS、Startup、Portfolio、Changelog、Blog、Codeforge）、50+ landing page sections（已驗證）：[pro.magicui.design](https://pro.magicui.design)

**Aceternity UI / Pro**
- 免費：100+ 元件，含 MCP 存取；付費：200+ premium blocks、15+ templates、5 landing pages、15 interactions；所有付費方案含 MCP、給 Claude Code / Codex 的 AI-ready prompts，支援 Next.js、React、Tailwind、Framer Motion（已驗證）：[ui.aceternity.com/pricing](https://ui.aceternity.com/pricing)
- 免費版未見公開開源 repo（`aceternity/aceternity-ui` 查詢 404）（已驗證，僅代表該路徑不存在）：[GitHub API 查詢結果]

**Motion Primitives / Pro（ibelick）**
- GitHub `ibelick/motion-primitives`：6,895 stars，MIT，最後 push 2026-09-28（已驗證）：[GitHub](https://github.com/ibelick/motion-primitives)
- Pro 站定位「handcrafted motion components, sections, and templates」；價格頁本次抓取被 403 擋下，價格未取得（已驗證定位文字）：[pro.motion-primitives.com](https://pro.motion-primitives.com)

**Cult UI / Pro（nolly-studio）**
- GitHub `nolly-studio/cult-ui`：6,948 stars，MIT，描述「150+ free shadcn/ui components, built with Tailwind CSS and Motion」（已驗證）：[GitHub](https://github.com/nolly-studio/cult-ui)
- Pro 站列出 9 個全端模板（Better Auth Postgres、Directory v2.0、Polar Subscription、Cult SEO v2.0、Logo GPT 等），至少 18 元件、29 blocks（已驗證）：[pro.cult-ui.com](https://pro.cult-ui.com)

**Animata**
- 「157+ animated React components」，免費開源；GitHub `codse/animata` 2,992 stars，MIT，最後 push 2026-11-03（已驗證）：[animata.design](https://animata.design)、[GitHub](https://github.com/codse/animata)

**Animate UI（Skyleen / Elliot Sutton）**
- 定位「Drop-in animated primitives for Radix UI, Base UI and React Aria」，透過 `@animate-ui/cli` 與 shadcn 整合，並提供給 AI coding agents 的 Animate UI skill；另有 Icons 區（已驗證）：[animate-ui.com](https://animate-ui.com)
- GitHub `imskyleen/animate-ui`：4,884 stars，最後 push 2026-11-02，描述含「Motion, and Shadcn CLI」（已驗證）：[GitHub](https://github.com/imskyleen/animate-ui)

**React Bits（David Haz）**
- GitHub `DavidHDev/react-bits`：51,230 stars（本清單最高），描述「The largest open-source library of animated…components…Built for humans and AI agents.」（已驗證）：[GitHub](https://github.com/DavidHDev/react-bits)
- 5 大類：Text Animations、Animations、Components、Backgrounds、Micro Interactions；可選 JS/TS 與 CSS/Tailwind 四種變體，支援 CLI 安裝（已驗證）：[reactbits.dev](https://reactbits.dev)
- React Bits Pro：230 動畫元件、300 page blocks（22 類）、300 app UI blocks（38 類）、15 landing templates、20 項 Agent Kit、Landing Builder (Beta)（已驗證）：[pro.reactbits.dev](https://pro.reactbits.dev)

**Skiper UI（Gxuri）**
- 「106+」元件，for shadcn/ui，單檔交付，Tailwind + Next.js + Motion.dev，有 v0 連結（已驗證）：[skiper-ui.com](https://www.skiper-ui.com)

**Eldora UI（Karthik Mudunuri）**
- 「150+ free and open-source animated components」，另有 Blocks、Templates；React + TS + Tailwind + Motion，定位 shadcn/ui companion（已驗證）：[eldoraui.site](https://www.eldoraui.site)
- GitHub `karthikmudunuri/eldoraui`：1,977 stars，MIT，最後 push 2026-09-26（已驗證）：[GitHub](https://github.com/karthikmudunuri/eldoraui)

**Hover.dev**
- React + Tailwind；10 個 section 類別（Hero、Pricing、Forms 等）、20 個元件類別（Buttons、Cards、Modals 等），未公布總數（已驗證）：[hover.dev/pricing](https://www.hover.dev/pricing)

**Motion+（motion.dev 付費層）**
- 510+ 範例原始碼、110+ 教學、Motion UI 元件（含 50 個 production-ready 動畫 sections）、Motion Studio 視覺編輯器（apply-to-code、edit-with-local-agent）、AI Kit（最佳實踐、文件搜尋、CSS spring 產生、MCP transition editor）、Performance Doctor、私有 Discord 與 GitHub（已驗證）：[motion.dev/plus](https://motion.dev/plus)
- 底層生態：`motiondivision/motion` 34,894 stars；npm `motion` 近 30 日 103,000,320 次下載、`framer-motion` 204,967,532 次（2026-10-05 至 11-03）（已驗證）：[GitHub](https://github.com/motiondivision/motion)、[npm API motion](https://api.npmjs.org/downloads/point/last-month/motion)、[npm API framer-motion](https://api.npmjs.org/downloads/point/last-month/framer-motion)
- 對照：`shadcn-ui/ui` 127,342 stars（已驗證）：[GitHub](https://github.com/shadcn-ui/ui)

### Inferences
- 星數級距：React Bits（5.1 萬）遠超第二梯隊 Magic UI（2.3 萬），再下來是 Cult UI / Motion Primitives（約 7 千）、Animate UI（約 4.9 千）、Animata（約 3 千）、Eldora（約 2 千）。SunUI 若無法做到「最大」，就必須做「最專精」。
- framer-motion + motion 月下載合計超過 3 億次，代表 SunUI 選擇的技術棧本身零教育成本，但也代表毫無技術差異化。
- bencho 與其他家路線最不同：不賣「頁面區塊」，賣「可調參的單點互動手感」+ 音效 + 靈感策展，比較像 Mobbin / Refero 這類「品味型訂閱」，而非元件庫。

### Gaps
- Magic UI 免費元件確切數量、Motion Primitives 免費元件數、Hover.dev 總元件數：本次未取得。
- Aceternity 免費元件是否有公開 repo：未確認。
- 各家 npm 下載量不適用（皆為 copy-paste / registry 分發，非 npm 套件；`@magicui/react` 不存在）。

## Q2. 免費 vs 付費切分、確切價格、授權條款

### Takeaway
價格帶高度收斂在「一次性買斷 US$129 至 US$349」，Aceternity 與 bencho 另提供一年期選項；團隊方案只有 Aceternity（US$1,590 / 10 人）與 Motion+（團隊按年訂閱）明確公布。開源層授權分兩派：MIT（Magic UI、Cult、Animata、Eldora、Motion Primitives）與「MIT + Commons Clause」（React Bits、Animate UI，禁止轉售元件本身）。

### Cited Findings

| 產品 | 免費層 | 付費方案與價格 | 計費型態 |
|---|---|---|---|
| bencho.dev | Free €0：46 blocks、可播放全部音效、Bench 上限 10 個 | Pro €99/年；Forever €129（原價 €149，一次性） | 年訂閱或買斷，歐元計價 |
| Magic UI Pro | 開源元件 MIT | Individual Lifetime US$199 | 一次性，未見團隊方案 |
| Aceternity UI Pro | 100+ 元件 + MCP | 1-Year US$169（原 249）；Lifetime US$199（原 299，標「Most popular」）；Team US$1,590（原 1,990，最多 10 人） | 一次性 |
| React Bits Pro | 開源（MIT+Commons Clause） | Starter US$129；Pro US$249；Ultimate US$349（標「Most popular」） | 一次性，頁面有 Lifetime/Annual 切換但未顯示年費 |
| Skiper UI | 部分元件免費 | Premium US$129；Exclusive US$549（Coming Soon，含 Figma 與完整網站模板） | 一次性 |
| Hover.dev | 基本元件免費 | Pro US$49（劃線原價 US$149） | 一次性 lifetime |
| Motion+ | Motion 本體 MIT | Individual US$399 一次性；Teams（2 人以上）按人按年計費，價格未公開 | 個人買斷，團隊訂閱 |
| Cult UI Pro | 免費 58 元件（Pro 頁說法）/ GitHub 稱 150+ | 價格頁 404；Pro 正轉為開源 | 見下方 |
| Motion Primitives Pro | 開源 MIT | 價格未取得（403） | 未知 |

- bencho 方案原文：Free「Access to 46 Blocks」「Up to 10 blocks on your Bench」；Pro「€99 /year」含全部 blocks、下載全部音效、無限 Bench、完整原始碼、Downloads、MCP access；Forever「€129」「was €149」「Pay once and keep it for life」；頁尾「Prices in euro. Pro renews yearly, cancel anytime」、「14-day refunds」；付款處理商代號為 `dodo`（推測為 Dodo Payments）；Forever 購買成功文案為「One of the first two hundred」，暗示買斷價限前 200 名（已驗證，取自 bencho.dev 前端 JS bundle 的方案定義）：[bencho.dev/pricing](https://www.bencho.dev/pricing)
- bencho 免費 blocks 以 GitHub repo 發布，README 稱「46 blocks and 24 sounds, free and MIT licensed」，但 GitHub API 回傳 license 為 NOASSERTION；第三方整理稱「Bencho 網站本身不在 MIT 範圍內」（README 已驗證；網站排除條款為二手）：[GitHub](https://github.com/cabralorenzo/bencho)、[搜尋摘要整理](https://uithings.com/kits/bencho)
- Magic UI Pro：允許商用、禁止轉售程式碼（「Re-selling of code is NOT allowed」）、永久授權含終身更新；頁面 ROI 計算器寫「Cost: Only $49」與 US$199 售價矛盾（已驗證）：[pro.magicui.design](https://pro.magicui.design)
- Aceternity：1-Year License 「no subscription」、一年後可續；FAQ 答案空白、授權細節在另一頁未取得（已驗證）：[ui.aceternity.com/pricing](https://ui.aceternity.com/pricing)
- React Bits Pro：「One developer, unlimited personal and commercial projects」、Lifetime 含「future updates to your tier」；團隊授權與退款 FAQ 答案未顯示（已驗證）：[pro.reactbits.dev](https://pro.reactbits.dev)
- React Bits 開源授權為「MIT + Commons Clause License Condition v1.0」：可商用，但不得「sell, sublicense, or redistribute the components themselves…as a ported version」（已驗證）：[GitHub LICENSE](https://github.com/DavidHDev/react-bits)
- Animate UI 授權為「MIT + Commons Clause」：可商用，但不得販售或再散布元件原形，不論單獨或打包（已驗證）：[GitHub LICENSE](https://github.com/imskyleen/animate-ui)
- Hover.dev：元件「subject to copyright and may not be redistributed without the written consent of Hover.dev」（已驗證）：[hover.dev/pricing](https://www.hover.dev/pricing)
- Motion+：API 與範例為 MIT，加入網站後即可保留；若產品「effectively resells Motion+ capabilities」需另購 Builder's Licence；14 天內未連結 GitHub 或存取原始碼可全額退款；提供學生與 PPP 折扣（已驗證）：[motion.dev/plus](https://motion.dev/plus)
- Cult UI Pro：頁面宣布「Cult Pro is going open source」，「Existing buyers keep access」（已驗證）：[pro.cult-ui.com](https://pro.cult-ui.com)
- Skiper UI：頁面未載明授權條款，只連到 Privacy Policy 與 Terms of Service（已驗證）：[skiper-ui.com](https://www.skiper-ui.com)

### Inferences
- 「Lifetime US$199」是事實上的錨定價（Magic UI Pro、Aceternity Lifetime 都是 US$199）。SunUI Pro lifetime 若定在 US$99 至 149 區間可打「半價」，若定 US$199 以上則需要明確更多內容或更好授權。
- Cult UI Pro 轉開源是重要訊號：純賣模板 / 區塊的長期收入可能不足以支撐，或開源換流量更划算。
- bencho 用「年訂閱 €99 + 限量買斷 €129」，買斷只比年費貴 30%，明顯是以買斷做早期現金與口碑，之後可能收回買斷選項。
- 授權清晰度普遍偏低：多家 FAQ 空白、授權頁另開、Skiper 無授權說明、Commons Clause 讓「做模板再賣」的 agency 或 template 作者無法使用。這是 SunUI 可以直接差異化的點（一頁寫清楚：可商用、可用於客戶專案、可用於 SaaS、不可轉售原始元件）。

### Gaps
- Motion Primitives Pro 與 Cult UI Pro 的現行價格：頁面 403 / 404，未取得。
- Aceternity、Magic UI 的完整授權頁全文未抓取。
- Motion+ 團隊每席年費未公開。
- bencho「限前 200 名」是否真為銷售限制，僅能從成功頁文案推論。

## Q3. 公開揭露的營收、使用者數、流量與創辦人說法

### Takeaway
唯一有具體營收數字的是 Aceternity（2024 年自述），其餘多數只公布 GitHub 星數或模糊的「trusted by developers」。Cult UI Pro 自曝「416+ buyers」是少見的硬數據。

### Cited Findings
- Aceternity 創辦人 Manu Arora 在 Starter Story 訪談（2024 年 10 月，資料已過時）中自述：Pro 上線兩個月營收破 US$80k；月營收平均 US$60k 至 100k；月支出約 US$5k；某月拆分為 Pro US$40k + 接案服務 US$30k；目標一年內 Pro 達 US$100k MRR；Pro 上線前在 X 累積約 2 萬追蹤者並主要靠 X 行銷（自述、2024 年）：[Starter Story](https://www.starterstory.com/stories/aceternity-ui)
- Cult UI Pro：「416+ buyers」（自述，2026-11 抓取）：[pro.cult-ui.com](https://pro.cult-ui.com)。若以 US$100 至 200 單價粗估，總營收約 US$4 萬至 8 萬（推估，非揭露）。
- Magic UI 於 2025-05-18 在 Product Hunt 上線「Magic UI 2」，獲 606 票、77 則留言、當日第一名（二手整理）：[Product Hunt](https://www.producthunt.com/products/magic-ui)、[hunted.space](https://hunted.space/dashboard/magic-ui/launches/magic-ui-2)
- 未找到 Magic UI Pro 營收或客戶數；創辦人 Dillion Verma 另有消費型 App「45 天 US$300K/月」說法，與 Magic UI 無關，不可混用（二手）：[Superwall Podcast](https://www.buzzsprout.com/2522779/episodes/18958462-dillion-verma-0-to-300k-mo-in-45-days-with-my-ai-app-just-copy-me)
- React Bits Pro 頁只寫「Trusted by developers worldwide」，無數字（已驗證）：[pro.reactbits.dev](https://pro.reactbits.dev)
- Skiper UI 標示 Shadcnblocks.com 為「Diamond user」，無使用者數字（已驗證）：[skiper-ui.com](https://www.skiper-ui.com)
- bencho：作者 Lorenzo Cabra（GitHub `cabralorenzo`，個人站 lorenzocabra.xyz，X `@cabralorenzo`，產品帳號 X `@benchodev`）；GitHub repo 建立於 2026-10-18、77 stars、2026-11-03 仍有 push；README 標示贊助商 Mobbin（已驗證）：[GitHub repo](https://github.com/cabralorenzo/bencho)、[GitHub API user](https://github.com/cabralorenzo)
- bencho 的 Finds 條目日期多為 2026-10 上旬（如 `added: 2026-10-06`），網站有 `visitor_ping` 即時在線人數機制（已驗證，取自前端 bundle）：[bencho.dev](https://www.bencho.dev)
- bencho 已被他人 fork / 鏡像為「47 polished React micro-interaction components, sourced from bencho.dev」等 repo（已驗證存在）：[OliviaR13/react-micro-interactions](https://github.com/OliviaR13/react-micro-interactions)、[Amateur0x1/bencho](https://github.com/Amateur0x1/bencho)

### Inferences
- bencho 是 2026 年 10 月中旬才推出的新產品（repo 建立日 2026-10-18 與 Finds 日期一致），上線不到一個月；被 Mobbin 贊助代表設計圈認可度高，但 77 stars 顯示開發者端 traction 仍小。
- 「開源免費層被 fork 鏡像」對 bencho 是行銷也是威脅；SunUI 開源層同樣會被複製，付費價值要放在「持續更新 + 未開源的高階區塊 + 工具（MCP / Bench 類編輯器）」。
- Aceternity 案例顯示：此類產品的營收天花板與創辦人 X 影響力強相關，且接案服務佔相當比重。

### Gaps
- Magic UI、React Bits、Motion Primitives、Skiper、Animate UI、Eldora、Hover.dev 的營收或銷量：未找到公開資料。
- 流量估算（Similarweb 等）：本次未取得可信數據。
- bencho 的 Product Hunt / HN 發表紀錄、X 上的上線貼文數據：未查到。

## Q4. 定位差異與已知弱點 / 使用者抱怨

### Takeaway
各家風格趨同（深色、發光、漸層、「design engineer」語彙）。主要抱怨集中在：效能偏重、預設不處理 reduced-motion 與無障礙、授權與 FAQ 不清楚。直接的 Reddit 一手抱怨本次未搜到，以下多為部落格與評論站整理。

### Cited Findings
- 定位一覽（已驗證，取自各官網或 repo 描述）：
  - Magic UI：「UI Library for Design Engineers」，開源 + landing 模板：[GitHub](https://github.com/magicuidesign/magicui)
  - Aceternity：大量 premium blocks + templates，強調 MCP 與 AI prompts：[pricing](https://ui.aceternity.com/pricing)
  - React Bits：「largest open-source library」，JS/TS × CSS/Tailwind 四變體，「Built for humans and AI agents」，Pro 走大量 app UI blocks + Landing Builder：[GitHub](https://github.com/DavidHDev/react-bits)、[Pro](https://pro.reactbits.dev)
  - Animate UI：動畫化的無障礙 primitives（Radix / Base UI / React Aria），偏「基礎元件層」：[animate-ui.com](https://animate-ui.com)
  - Motion+：由 Motion 官方出品，賣工具（Studio、AI Kit、Performance Doctor）+ 範例，而非單純元件：[motion.dev/plus](https://motion.dev/plus)
  - Cult UI Pro：全端 SaaS 模板（Auth、Polar 訂閱、Directory）：[pro.cult-ui.com](https://pro.cult-ui.com)
  - bencho：單點微互動 + 可調參 + 音效 + 策展 + 畫布：[bencho.dev](https://bencho.dev)
- 21st.dev 指出 Aceternity 有明顯風格：「dark, high-contrast and heavy on glow」，且部分目錄在付費牆後（二手）：[21st.dev](https://21st.dev/blog/aceternity-ui-alternatives)
- 評論站使用者稱 Aceternity「beautiful but buggy and somewhat heavy on performance」（二手）：[builtatlightspeed](https://www.builtatlightspeed.com/theme/andrey-kudinov-aceternity)
- 2026 比較文估算 Aceternity 與 Magic UI 因依賴 Framer Motion 約增加 125KB，單一元件約 5 至 15KB；並稱 React Bits 提供 prefers-reduced-motion 控制而 Aceternity、Magic UI 預設沒有（二手，未逐一驗證）：[pkgpulse](https://www.pkgpulse.com/guides/react-bits-vs-aceternity-magic-ui-2026)
- Aceternity 相關的 Claude skill 文件建議使用者自行補 ARIA label 與鍵盤支援，暗示元件本身未處理（二手）：[skills.lc](https://www.skills.lc/secondsky/claude-skills/secondsky-claude-skills-plugins-aceternity-ui-skills-aceternity-ui-skill-md)
- Magic UI repo 有優化 particles、MagicCard 效能的 PR（已驗證存在，屬一般維護）：[ecosyste.ms issues](https://issues.ecosyste.ms/hosts/GitHub/repositories/magicuidesign%2Fmagicui/issues)
- 官網品質問題：Magic UI Pro ROI 計算器價格與售價矛盾；Aceternity、React Bits Pro FAQ 答案空白（已驗證）：[pro.magicui.design](https://pro.magicui.design)、[ui.aceternity.com/pricing](https://ui.aceternity.com/pricing)、[pro.reactbits.dev](https://pro.reactbits.dev)
- Motion Primitives 最後 push 為 2026-09-28、Eldora 為 2026-09-26，更新節奏比其他家慢（已驗證）：[Motion Primitives](https://github.com/ibelick/motion-primitives)、[Eldora](https://github.com/karthikmudunuri/eldoraui)

### Inferences
- 「無障礙 + reduced-motion 是一等公民」目前只有 Animate UI（建在無障礙 primitives 上）與 React Bits（據二手）部分處理，landing 區塊類產品普遍沒做好。
- Motion+ US$399 的存在讓 US$99 至 199 的元件庫看起來便宜，但也表示「動畫教學 / 範例」這塊已被官方佔據，SunUI 不宜正面拼範例量。

### Gaps
- r/reactjs、r/nextjs、HN 一手抱怨串：本次搜尋未取得，建議後續以 `site:reddit.com` 再查。
- 各家實際 reduced-motion 支援程度未逐一程式碼審查。

## Q5. 市場缺口（無人服務良好的區塊）

### Takeaway
沒有任何一家專攻「可直接上線的電商 / 活動檔期區塊」、「CJK 排版」或「授權一頁講清楚 + 無障礙品質保證」。SunUI 現有的 countdown-banner 類活動元件方向正好落在空白處。

### Cited Findings
- 各家付費內容集中於 SaaS / AI / Dev Tool / Portfolio landing 模板（Magic UI Pro 9 模板類別、Cult UI 的 Auth / Directory / SEO 模板、React Bits 的 page & app UI blocks），未見以電商檔期（倒數、限時折扣、庫存緊張、優惠券領取、抽獎）為主題的系列（已驗證，依各頁列出類別）：[pro.magicui.design](https://pro.magicui.design)、[pro.cult-ui.com](https://pro.cult-ui.com)、[pro.reactbits.dev](https://pro.reactbits.dev)
- 本次瀏覽的所有官網與 repo 均未提及中文 / 日文 / 韓文排版、直排、標點擠壓或 CJK 字型載入策略（已驗證為「未提及」，非全面審查）：見上列各官網
- 授權問題：Commons Clause（React Bits、Animate UI）、需書面同意才可再散布（Hover.dev）、無授權說明（Skiper）、FAQ 空白（Aceternity、React Bits Pro）（已驗證）：見 Q2 各來源
- 團隊方案稀少：只有 Aceternity（US$1,590 / 10 人）與 Motion+（團隊年訂閱）公開團隊選項（已驗證）：[Aceternity](https://ui.aceternity.com/pricing)、[Motion+](https://motion.dev/plus)
- 音效 + 互動整合只有 bencho 在做（已驗證）：[bencho.dev/sounds](https://www.bencho.dev/sounds)

### Inferences
- 建議 SunUI 定位候選：「電商與行銷活動用的 production-ready 動畫區塊（含倒數、促銷橫幅、價格動畫、加入購物車回饋），預設 reduced-motion 與鍵盤可用，並對繁中 / CJK 文字做過排版測試」。這同時回應三個缺口，且與 SaaS landing 主戰場錯開。
- 定價參考：低於 US$199 錨點的 lifetime（例如 US$99 至 149）+ 明確的小團隊方案（例如 5 人），可同時壓過 Magic UI、Aceternity 的個人價與 Aceternity 偏貴的團隊價。
- 授權一頁化、以白話列出「可 / 不可」，並允許用於客戶專案與 SaaS，是低成本高信任的差異化。
- bencho 證明「可調參 playground + MCP + Copy prompt」會被設計圈接受；SunUI 的 registry 頁可借鏡「每個元件可即時調參並把參數帶入安裝指令」。

### Gaps
- 未驗證是否有小型 / 地區型競品（例如日本、中國的動畫元件庫）已在做 CJK 或電商活動區塊。
- 未取得任何「電商動畫區塊」需求量的量化資料（搜尋量、Reddit 求助串）。
- Shadcnblocks、Tailark、21st.dev 等非純動畫但同價位的區塊市集本次未納入，可能是電商區塊的間接競品。
