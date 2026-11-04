# 付費 UI Blocks / Sections / Templates 市場（React + Tailwind + shadcn/ui）與獨立 UI Kit 營收案例（截至 2026-11）

> 研究日期：2026-11-04。價格皆為美元，取自 2026-11-04 當天抓取的官方定價頁，除非另有註明。「已驗證」指直接取自一手頁面（附 URL）；「次級來源」指聚合站、媒體轉述或創辦人自報；「推論」為本筆記自行計算或判斷。

## 一、產品線結構（components / blocks / templates / Figma kit）、數量、更新頻率

### Takeaway
2026 年 shadcn 生態的付費產品已演變成「數千個 blocks + 數十個完整 templates + Figma kit + MCP/registry 安裝」的大套組，數量軍備競賽明顯（shadcnblocks 約 2,400 到 2,600 個 blocks，shadcn.io 宣稱 6,231 個）。小型新進者（Launch UI、Tailark）則以少量、高設計品質、含動畫的 sections 切入，這與 SunUI 的定位最接近。

### Cited Findings
- shadcnblocks.com（2026-11-04）：2,241 個 Pro components、2,467+ 個 Pro blocks（站內選單另寫 2,636），21 個 Premium templates、97+ 個預建頁面、39 個 themes、Figma kit 含 579 個 block 設計（FAQ 承認尚未涵蓋全部 blocks）、Admin Kit 200+ 畫面；另售 CMS 加購 Payblocks（Payload）與 Sanityblocks（Sanity），各含 70+ blocks。（[shadcnblocks 定價頁](https://www.shadcnblocks.com/pricing)）
- shadcnblocks 有每月 blocks 更新的 changelog（例如 2024-10、2024-12、2025-02 到 2025-05、2026-04 皆有「New blocks」條目），並已支援 shadcn registry 安裝。（[changelog 2026-04](https://www.shadcnblocks.com/changelog/new-blocks-apr-2026)、[registry 功能公告](https://www.shadcnblocks.com/changelog/new-feature-shadcn-registry)）
- shadcnblocks 據報收購了 Kibo UI（次級來源，未見官方公告）。（[EveryDev](https://www.everydev.ai/developers/shadcnblocks)）
- shadcn.io（2026-11-04）：6,231 個 blocks（56 類）、14 個 premium templates、175 個 components、1,103 個 examples、70 個 charts、35 個 React hooks、500 份 DESIGN.md 品牌檔；動畫類 Pro 項目：35 個 buttons、97 個 text effects、100 個 backgrounds、100 個 shaders（FAQ 另寫合計 284 個，與分項不一致）；附 MCP server（22 個工具、38 種 AI client 設定指南）；支援 React、Vue、Svelte、Solid 四框架與 Base UI、Radix、Aria、Ark 四種底層。（[shadcn.io 定價頁](https://www.shadcn.io/pricing)）
- shadcn.io 單一 block 頁面顯示 Pro 解鎖「每個 Pro button 與 text effect 的程式碼及一行安裝，加上 AI 編輯器用 MCP」；同頁計數為 26 buttons、87 text effects、90 backgrounds、81 shaders（與定價頁數字不同，顯示持續增加中）。（[shadcn.io pricing-with-guarantee block](https://www.shadcn.io/view/pricing/with-guarantee)）
- shadcn studio（shadcnstudio.com，2026-11-04）：1,000+ blocks、100+ pages、25+ templates、1,000+ components、250+ illustrations；宣稱每月釋出新 components/blocks/templates；免費層含 57 個 blocks。（[shadcn studio 定價頁](https://shadcnstudio.com/pricing)）
- Shadcn UI Kit（shadcnuikit.com）：16 個 admin dashboards、17 個 web apps、6 個網站 templates、550+ blocks、560+ components、70+ examples、30+ illustrations，付費層含 Figma。（[Shadcn UI Kit 定價頁](https://shadcnuikit.com/pricing)）
- Untitled UI React：5,000+ components 與 sections、250+ 頁面範例、2,000+ icons/logos、Figma 同步；免費層有「數百個」MIT 授權開源元件。（[Untitled UI React](https://www.untitledui.com/react)）
- Launch UI：免費層 1 個網站 template、9 個 blocks/sections、4 個自訂動畫；Pro 7 個 templates、74 個 blocks/sections、23 個 illustrations、15 個自訂動畫。首頁宣稱「Used by 73.9k+ companies and builders」。（[Launch UI 定價](https://www.launchuicomponents.com/pricing)、[Launch UI 首頁](https://www.launchuicomponents.com/)）
- Tailark：未公布 block 數量，Essentials 寫「數百個 premium blocks」與「數百個 premium illustrations」，Complete 增加 landing、product、pricing、customer、blog、brand、legal 等完整頁面類型。（[Tailark 定價頁](https://tailark.com/pricing)）
- Origin UI 已被 Cal.com 母公司收購並改名為 coss ui，以 Base UI 從頭重寫；舊 Origin 元件保留為 legacy snapshot、維護有限，新 particles 將逐步取代原集合。（[coss ui docs](https://coss.com/ui/docs)、[coss roadmap](https://coss.com/ui/docs/roadmap)）
- coss repo 據 DeepWiki 摘要為雙授權：舊 Origin app 為 MIT，新 UI app 為 AGPLv3（次級來源，需核對 repo LICENSE）。（[DeepWiki coss](https://deepwiki.com/cosscom/coss)）
- 21st.dev 是社群元件市集 + AI 生成（21st AI credits）+ MCP 安裝，模板可由作者個別販售。（[21st.dev 定價頁](https://21st.dev/pricing)）
- Cruip：分 Classic（既有模板庫）與 Modern（新模板）兩個 bundle，舊 Unlimited Access 已併入 Classic Bundle；「Lite」版免費，完整版付費。（[Cruip unlimited access](https://cruip.com/unlimited-access/)、[Starterindex Cruip](https://starterindex.com/boilerplate/cruip)）
- Flowbite Pro 內容：完整 Flowbite Blocks、完整 Figma 設計系統、數個 dashboard 版型與程式碼片段（銷售頁說明，未取得數量）。（[Flowbite Gumroad 頁](https://zoltanszogyenyi.gumroad.com/l/flowbite)）

### Inferences
- 推論：數量競爭已被大玩家壟斷（2,000 到 6,000 blocks），個人開發者無法在「量」上勝出。SunUI 應以「動畫微互動 + 垂直場景（commerce/SaaS/campaign）的完成度」作為差異，類似 Launch UI（74 blocks 賣 $99）與 Tailark 的「少而精」路線。
- 推論：shadcn.io 已把「animated buttons / text effects / backgrounds / shaders」做成 Pro 賣點且附 MCP，是 SunUI 動畫微互動定位最直接的競品，需在品質、可存取性（reduced motion）、商業場景整合上明確區隔。
- 推論：registry 安裝與 MCP/AI 編輯器整合在 2026 已成標配（shadcnblocks、shadcn.io、21st.dev 都有），SunUI 透過 shadcn registry 散佈屬於基本門檻，不是差異化。

### Gaps
- HyperUI、Park UI、Catalyst、Preline Pro、Flowbite Pro 的 2026 年產品數量與更新頻率未能取得（Preline 定價頁 404、Flowbite 定價頁抓取為空、Tailwind Plus 頁面只回傳登入頁）。據一般認知 HyperUI 與 Park UI 為免費開源、Catalyst 內含於 Tailwind Plus，但本次未以一手頁面驗證。
- Tailwind Plus 目前 UI blocks 與 templates 的確切數量未能取得。

## 二、精確價格、方案、折扣、PPP 與授權條款

### Takeaway
市場主流是「一次付費、終身存取 + 終身更新」，個人方案集中在 $79 到 $349，團隊方案 $199 到 $999，企業方案 $499 到 $8,999。唯一明顯走訂閱的是 shadcn.io（$49/月或 $389/年，終身 $899）與 21st.dev（$6 到 $8/月起），訂閱多與 AI/MCP 功能綁定。幾乎所有賣家都用「劃線原價 + 限時折扣」行銷，PPP 在本次抓取的頁面上都未見明列。

### Cited Findings
**Tailwind Plus（前 Tailwind UI）**
- 改名為 Tailwind Plus 後仍維持一次付費、終身存取，官方部落格表示新客價格不變。（[Tailwind 官方部落格：Tailwind UI is now Tailwind Plus](https://tailwindcss.com/blog/tailwind-plus)）
- 個人授權 $299、團隊授權（最多 25 人）$979，皆為一次付費加當地稅（次級來源：官方定價頁鏡像與搜尋摘要；本次直接抓取官方頁只得到登入頁，未能一手驗證）。（[tailwindcss.com/plus](https://tailwindcss.com/plus)、[tailwindui.com/pricing](https://tailwindui.com/pricing)）
- 有個第三方計算器寫 Personal $249、Teams $849 月費，與官方說法矛盾，判定不可信。（[toolradar](https://toolradar.com/tools/tailwindcss/calculator)）

**shadcnblocks.com（2026-11-04 抓取）**
- Pro $149（單人、終身存取與更新、全部 Pro components 與 blocks）；Premium $299（加 21 個 templates、Figma Kit、Admin Kit）；Elite $399（加 97+ 預建頁面與 Page Builder）。全部一次付費，無訂閱；可補差價升級。頁面有 Team 分頁但未顯示團隊價格。
- CMS 加購 Payblocks、Sanityblocks 各 $379 一次付費。
- 授權：可用於公司與客戶的無限個終端產品，禁止轉售元件或做競品。
- 折扣政策：每年 1 到 2 次大型促銷，折扣 15% 到 30%；平日不做灌水折扣，也不接受個別折扣要求。數位商品原則上不退款。
- 來源：[shadcnblocks 定價頁](https://www.shadcnblocks.com/pricing)

**shadcn.io（2026-11-04 抓取，唯一明確提供訂閱的大型 blocks 站）**
- Individual：$49/月、$389/年（約 $32/月）、終身 $899；僅限個人與開源使用、不可共享。
- Team（最多 5 席、含商用）：$99/月、$789/年、終身 $1,899。
- Organization（組織內無限席）：$199/月、$1,589/年、終身 $3,899。
- 年繳比月繳便宜 33%；無退款保證；取消後已下載內容可繼續用於既有產品，但失去新下載、更新與 MCP。
- 來源：[shadcn.io 定價頁](https://www.shadcn.io/pricing)

**shadcn studio（2026-11-04 抓取）**
- Community 免費；Basic $99（劃線 $219，單人，專案數有限）；Pro $199（劃線 $359，單人，無限專案，標示 Best Value）；Team $449（劃線 $719，15 席）；Enterprise $849（劃線 $1,299，無限席）。全為一次付費、終身、無限專案。
- 另有「Flat」方案標示「接下來 500 位用戶 30% off」「即將漲價」，頁面 ROI 段落提到「單一 $249 授權」，可能就是此方案（頁面未明說）。
- 授權允許客戶專案、SaaS、內部工具；禁止轉售原始檔做競品。頁面未提 PPP。
- 來源：[shadcn studio 定價頁](https://shadcnstudio.com/pricing)

**Tailark（2026-11-04 抓取）**
- Free $0；Essentials $199（劃線 $249）；Complete $249（劃線 $299）；Team $449（劃線 $499，10 位成員）。全為一次付費；頁面有「Save $50」倒數計時。授權條款答案未顯示於抓取內容。
- 來源：[Tailark 定價頁](https://tailark.com/pricing)

**Launch UI（2026-11-04 抓取）**
- Free（開源）；Pro $99 一次付費加稅；Pro Team $499 一次付費（全部 templates、components、sections，供整個團隊）。終身存取、免費更新。
- 來源：[Launch UI 定價](https://www.launchuicomponents.com/pricing)

**Untitled UI React（2026-11-04 抓取）**
- Free $0；PRO SOLO $349（劃線 $499，1 人）；PRO STUDIO $999（劃線 $1,299，最多 8 人）；PRO BUSINESS $2,499（劃線 $2,999，最多 20 人）；PRO ENTERPRISE $8,999（劃線 $9,999，組織內無限，含私有 GitHub repo、Storybook、SSO/SCIM、Enterprise EULA、4 小時 onboarding、audit log）。
- 文案主打「一次付費、終身免費更新、沒有煩人的訂閱」，可用於無限專案；開源元件為 MIT。
- 來源：[Untitled UI React](https://www.untitledui.com/react)
- 另一目錄站列 Untitled UI 2.0（Figma）$349 一次付費、Mobile 另售 $149（次級來源）。（[Tiny Startups Untitled UI](https://www.tinystartups.com/tools/untitled-ui)）

**Shadcn UI Kit（shadcnuikit.com，2026-11-04 抓取）**
- Starter 免費；Pro $79（劃線 $129，1 人）；Team $199（劃線 $299，10 人）；Enterprise $499（劃線 $799，無限）。一次付費、終身免費更新。
- 限時最高 39% off，頁面稱學生與非營利同享；以 Paddle 收款，價格含 VAT。
- 授權：可商用與用於付費 SaaS、無限專案；客戶專案限單一客戶，轉售給多客戶需實質修改；禁止做網站建置器或模板市集；付費內容不可用於公開開源專案；升級補差價。頁面未提 PPP。
- 來源：[Shadcn UI Kit 定價頁](https://shadcnuikit.com/pricing)

**21st.dev（2026-11-04 抓取）**
- Free（Hobby）$0：每天 2 次免費複製。Builder：年繳 $6/月或季繳 $8/月，無限安裝與 MCP 取用。Builder + AI：500 credits $15/月（年繳）到 2,000 credits $60/月；加購 100 credits $5。Team 每席年繳 $7.50/月或含 AI $18.75/月。
- 作者販售的 templates 需個別購買。
- 來源：[21st.dev 定價頁](https://21st.dev/pricing)

**Cruip**
- 一次付費、無續費、終身存取；Lite 版免費。（[Cruip unlimited access](https://cruip.com/unlimited-access/)）

**ShipFast（boilerplate 參照）**
- 列價 $199 Starter / $249 All-In / $299 Bundle（次級來源，第三方比較文章）。（[AdminLTE shadcn SaaS starter kits 2026](https://adminlte.io/blog/shadcn-ui-saas-starter-kits/)）

**金流平台費用（影響淨收）**
- Lemon Squeezy 5% + $0.50 每筆；Gumroad 直接／個人頁銷售 10% + $0.50；Lemon Squeezy 於 2024 年被 Paddle 收購（次級來源）。（[Pocketsflow 指南](https://www.pocketsflow.com/blog/how-to-sell-ui-kits)、[Dodo Payments MoR 比較](https://dodopayments.com/blogs/best-merchant-of-record-indie-hackers)）

### Inferences
- 推論：shadcn 生態「單人 Pro 一次付費」價格帶的中位數約 $149 到 $199（Launch UI $99、Shadcn UI Kit $79、shadcnblocks $149、shadcn studio $199、Tailark $199 到 $249、Tailwind Plus $299、Untitled UI $349）。SunUI 作為新品牌、內容量遠少於大站，Pro 終身價合理落在 $79 到 $149，搭配上市早鳥價（例如 $59 到 $99）較符合市場。
- 推論：團隊方案普遍為個人價的 2.5 到 5 倍（Launch UI 約 5 倍、shadcn studio 約 2.3 倍、Tailwind Plus 約 3.3 倍）。SunUI 可設 Team 約個人價 3 倍。
- 推論：「劃線原價 + 倒數計時」幾乎是業界標配，但 shadcnblocks 明確反其道而行（不灌水、一年 1 到 2 次促銷），作為誠信品牌策略也可行。
- 推論：本次所有定價頁都未明列 PPP；若 SunUI 提供 PPP（Lemon Squeezy/Paddle 皆可設地區折扣或代碼），在亞洲市場可能是小差異化，但無數據證明其轉換效果。

### Gaps
- Flowbite Pro、Preline Pro、Catalyst 單獨售價 2026 年版本未能一手取得（頁面 404 或空白），搜尋結果只有不可靠的仿冒頁面。
- 各家 PPP 政策未見公開；Tailwind Plus 的 PPP 或學生折扣未能驗證。
- Magic UI Pro 定價頁 404，未納入。

## 三、公開營收資料（Tailwind、shadcnblocks、Cruip、Flowbite、Untitled UI、Marc Lou / ShipFast）與免費轉付費轉換率

### Takeaway
最可靠的數據來自 Tailwind Labs 與 shadcnblocks。Tailwind 的營收從 2023 初高峰約每天 $30k 掉到 2025-11 約每天 $6k（約 -80%），並於 2026-01-06 裁掉 75% 工程人員；shadcnblocks 則在 2025-09 月營收約 A$87,503（約 US$58k），呈現「舊龍頭衰退、shadcn 原生新賣家成長」的對比。Cruip、Flowbite、Untitled UI 皆無可信的公開營收。

### Cited Findings
**Tailwind Labs / Tailwind Plus**
- Adam Wathan 於 2026-01-07 在 GitHub PR 留言：工程團隊 75% 的人「昨天」（2026-01-06）失去工作；營收下滑接近 80%；文件流量自 2023 年初下降約 40%；同時 Tailwind「成長得比以往任何時候都快」；文件是使用者認識商業產品的主要管道。他因此拒絕一個新增 LLM 友善文件（llms.txt 類）的 PR，理由是要先想辦法讓公司活下去。（[GitHub tailwindcss.com PR #2388](https://github.com/tailwindlabs/tailwindcss.com/pull/2388)）
- 裁員實際人數為 3 人（4 名工程師中的 3 名）。（[DevClass 2026-01-08](https://www.devclass.com/ai-ml/2026/01/08/tailwind-labs-lays-off-75-percent-of-its-engineers-thanks-to-brutal-impact-of-ai/4079571)、[Socket](https://socket.dev/blog/tailwind-css-announces-layoffs)）
- 據 Wathan 的 podcast（節目標題「The Tailwind business ain't what it used to be」），書籍與 Tailwind Plus 在 2023 年 1 到 3 月高峰時約每天 $30k，到 2025-11 約每天 $6k 且仍在下滑；贊助收入約每年 $700k（2025 年底），企業贊助每月 $1k 到 $5k、個人每年 $120；npm 下載約每月 7,500 萬（次級來源：Substack 轉述 podcast）。（[Dan Cleary Substack](https://danjcleary.substack.com/p/ai-is-both-propelling-and-undermining)）
- 定價實驗：Tailwind Plus 由 $299 調到 $399，轉換率下降抵消漲價，營收持平；調回原價後營收仍持平（次級來源，同上）。
- Wathan 認為訂閱制大概也不會帶來更多總營收，因為客戶會一次拿走全部內容後一個月就退訂（次級來源，作者轉述而非原文引述）。（[Dan Cleary Substack](https://danjcleary.substack.com/p/ai-is-both-propelling-and-undermining)）
- Wathan 後續表示公司「仍是一門還行的生意（即使趨勢向下），只是不再是很好的生意」；Google AI 團隊宣布成為 Tailwind 贊助商（次級來源，搜尋彙整）。（[Leanware](https://leanware.co/insights/tailwind-ai-crisis)、[Search Engine Roundtable](https://www.seroundtable.com/tailwind-css-google-drop-40725.html)）
- Tailwind UI 早期（2020 年）約 5 個月內營收約 $2M（次級來源，聚合站轉述 Wathan 當年公開數字）。（[IndieMakerList](https://indiemakerlist.com/revenue/tailwind-plus/)、[OperatorBook](https://www.operatorbook.dev/stories/tailwind-css-revenue)）
- 有網站宣稱「2026-01 時 ARR $700K」，無出處，判定不可信（可能與贊助金額混淆）。（[StartupFounderStories](https://startupfounderstories.com/stories/adam-wathan-tailwind-css-open-source-business)）

**shadcnblocks.com（Rob Austin）**
- 2025-09 月營收 A$87,503（約 US$58k），該月 signups 超過 10,000，團隊擴編（次級來源：Tiny Startups 電子報轉述創辦人自報；原文本次抓取 404）。（[Tiny Startups TWITS #81](https://tinystartups.beehiiv.com/p/twits-81)）
- Rob 在 Product Hunt 留言：約 13,000 免費用戶、2,000+ 付費用戶（未標日期）。（[Product Hunt shadcnblocks 2](https://www.producthunt.com/p/shadcnblocks-2/shadcnblocks-2)）
- EveryDev 稱 2026 年初有 1,600+ Pro 客戶、11,000 免費用戶，2025 到 2026 月月成長；此數字與 Product Hunt 數據矛盾，原因不明。（[EveryDev](https://www.everydev.ai/developers/shadcnblocks)）

**Marc Lou / ShipFast**
- 2025 年全年總營收 $1,032,000（橫跨多產品）；2026-01 約 $94,799，其中 ShipFast 約 $17,200；2026-02 約 $81,683（皆為次級來源，聚合站轉述自報數字，可信度中低）。（[IndieAI 2026-02 收入拆解](https://indieai.pages.dev/blog/marc-lou-81683-february-2026-income-breakdown)、[IndieAI 2026 top indie developers](https://indieai.pages.dev/blog/top-5-successful-indie-developers-2026)）
- ShipFast 上市約 4 個月營收 $528K（Starter Story 舊報導）。（[Starter Story 鏡像](https://starterstory.herokuapp.com/marc-lou-shipfast)）
- 不同來源對 ShipFast 月營收說法不一（約 $50K/月 到約 $100K/月），且 ShipFast 累計 $1.3M+ 的說法未經驗證。（同上搜尋彙整）
- Marc Lou 創辦的 TrustMRR 是 2026 年主要的「已驗證營收」資料庫，但本次未找到 UI kit 類產品的 TrustMRR 條目。（[ToolCenter TrustMRR review](https://www.toolcenter.ai/en/articles/trustmrr-review-2026)）

**Cruip、Flowbite、Untitled UI**
- Cruip：未找到公開營收；Indie Hackers 頁面只記錄 2020 年轉向 Tailwind 與早期靠 Indie Hackers、Product Hunt 曝光、20,000 用戶里程碑。（[Indie Hackers Cruip](https://www.indiehackers.com/product/cruip)、[Cruip 20,000 users](https://www.indiehackers.com/product/cruip/20-000-users--LgqA2QAnqhdBJhRQe7p)）
- Flowbite：未找到營收或 Pro 客戶數；2023-02 公開的 2022 年回顧只有開源指標（每週約 94k 下載、200 萬+ npm 專案使用、Discord 2,000+ 人）。（[State of Flowbite 2022](https://dev.to/themesberg/state-of-flowbite-learn-more-about-our-results-from-2022-and-what-we-plan-to-build-this-year-dca)）
- Untitled UI：官網宣稱 380,000+ 設計師使用；唯一營收數字為 Prospeo 模型估算年營收 $171,110，與其定價及用戶規模明顯不符，判定不可信。（[Untitled UI React](https://www.untitledui.com/react)、[Prospeo](https://prospeo.io/c/untitled-ui-revenue)）

**轉換率**
- 未找到任何賣家公開的「免費轉付費轉換率」一手數據。

### Inferences
- 推論：Tailwind 每天 $30k 約等於年化 $11M，每天 $6k 約等於年化 $2.2M，加上贊助約 $0.7M；也就是說即便「崩跌」後，Tailwind Labs 仍有數百萬美元等級的年營收，但其成本結構（多人團隊）撐不住。
- 推論：shadcnblocks 2025-09 月營收約 US$58k，年化約 $700k，以 $149 到 $399 客單價推算，每月約 200 到 400 筆訂單。
- 推論：以 Product Hunt 數字（2,000 付費 / 13,000 免費）估算，免費註冊轉付費約 13% 到 15%；以 EveryDev 數字（1,600 / 11,000）約 14.5%。這是「已註冊用戶」對付費的比例，不是「訪客」轉換率，且兩組數字來源可信度有限，僅能當上限參考。
- 推論：Tailwind 的 $299 vs $399 實驗暗示此類一次性產品的價格彈性接近 1（漲價 33% 被轉換率下降完全抵消），定價調整對總營收影響小於流量與曝光。

### Gaps
- shadcnblocks 2026 年的營收數字未找到（最新為 2025-09）；建議直接查 Rob Austin 的 X（@ausrobdev）。
- Tailwind Plus 2026-01 之後的營收是否回升，未找到任何報導。
- shadcn studio、Tailark、Launch UI、Shadcn UI Kit、21st.dev 皆無公開營收。

## 四、哪種定價模式對獨立開發者最有效（一次付費 vs 訂閱），以及 AI 生成 UI（v0、Lovable）對付費 kit 需求的影響

### Takeaway
證據一面倒支持「一次付費終身存取」作為 UI kit 的主流與實際有效模式（Tailwind、shadcnblocks、Untitled UI、Launch UI、Tailark 全部採用；Wathan 認為訂閱不會更賺）。AI 的衝擊有實證：Tailwind 的營收下滑約 80% 被廣泛歸因於 AI 讓開發者不再造訪文件（漏斗入口），而非直接被 v0/Lovable 取代；但同期 shadcn 原生的 blocks 商店仍在成長，且紛紛加入 MCP 讓 AI 編輯器直接取用付費 blocks。

### Cited Findings
- Tailwind Plus 維持一次付費終身存取（官方）。（[Tailwind 官方部落格](https://tailwindcss.com/blog/tailwind-plus)）
- Wathan 認為訂閱制大概不會產生更多總營收，因客戶會一次下載全部後一個月退訂（次級來源轉述）。（[Dan Cleary Substack](https://danjcleary.substack.com/p/ai-is-both-propelling-and-undermining)）
- Untitled UI 明確以「沒有煩人的訂閱」作為銷售訴求。（[Untitled UI React](https://www.untitledui.com/react)）
- shadcn.io 同時提供月費、年費與終身（$899，約 18 個月月費），訂閱停止後失去更新與 MCP，顯示訂閱價值綁定在「持續新增 + AI 工具」。（[shadcn.io 定價頁](https://www.shadcn.io/pricing)）
- 21st.dev 以低價訂閱（$6 到 $8/月）加 AI credits 收費，平台本身不處理作者金流、沒有內建分潤或 payout，作者需掛外部 Gumroad、Lemon Squeezy 或 Stripe 連結；會員費用是支持 21st.dev 本身，不是作者收入。（[21st.dev 說明：Monetization](https://help.21st.dev/publishing/monetization)、[21st.dev 定價頁](https://21st.dev/pricing)）
- AI 影響：Wathan 表示文件流量自 2023 年初下降約 40%，營收下降接近 80%，且文件是商業產品的主要曝光管道。（[GitHub PR #2388](https://github.com/tailwindlabs/tailwindcss.com/pull/2388)）
- 媒體將此歸因於 LLM 與 Google AI 摘要減少文件點擊，並將其視為「開源 + 文件導流」商業模式的結構性問題。（[Search Engine Roundtable](https://www.seroundtable.com/tailwind-css-google-drop-40725.html)、[Socket](https://socket.dev/blog/tailwind-css-announces-layoffs)、[Neowin](https://www.neowin.net/news/tailwind-lays-off-75-employees-as-ai-kills-majority-of-its-revenue/)）
- 有評論者認為 AI 並未取代開發者，而是切斷了人類造訪網站的流量。（[paddo.dev](https://paddo.dev/blog/tailwind-dead-internet/)）
- 對比：shadcnblocks 在 2025 年仍有強勁月成長，2025-09 月營收約 US$58k（次級來源）。（[EveryDev](https://www.everydev.ai/developers/shadcnblocks)、[Tiny Startups](https://tinystartups.beehiiv.com/p/twits-81)）

### Inferences
- 推論：對 SunUI 這種「open-core 免費 + Pro 終身」策略，市場證據支持一次付費；若之後要加經常性收入，較可行的是像 shadcn.io 一樣把「AI/MCP 存取或持續新增內容」包成可選訂閱，而非把 blocks 本身改訂閱。
- 推論：AI 衝擊的主要機制是「漏斗入口消失」（搜尋與文件流量），不是「產品被取代」。SunUI 透過 shadcn registry 與 MCP 讓 AI 編輯器能安裝其免費元件，等於把 AI 變成新的導流管道；Pro 的價值需放在 AI 不易一次生成好的東西（細緻動畫時序、可存取性、跨 section 一致的設計系統、商業轉換最佳化文案結構）。
- 推論：21st.dev 不分潤，因此對 SunUI 只適合作為曝光渠道（放免費元件 + 外部購買連結），不能當收入來源。

### Gaps
- 未找到 v0、Lovable 對付費 UI kit 需求的量化研究或調查；目前只有 Tailwind 單一案例的歸因。
- 未找到同一產品「一次付費 vs 訂閱」的 A/B 營收對照公開數據（Wathan 的說法為推估）。

## 五、新 UI kit 上市後 3 / 6 / 12 個月的典型營收軌跡

### Takeaway
沒有找到 shadcn 時代新 UI kit 的可靠「3/6/12 個月」營收曲線。現有資料呈現極端兩端：有既有受眾的創作者（Tailwind UI 2020 年 5 個月約 $2M、ShipFast 4 個月約 $528K），以及沒有分發管道的新手（Next.js templates 數月 $0）。分發與既有受眾才是決定性因素。

### Cited Findings
- Tailwind UI 2020 年上市約 5 個月營收約 $2M（次級來源；當時 Tailwind CSS 已有龐大用戶）。（[IndieMakerList](https://indiemakerlist.com/revenue/tailwind-plus/)）
- ShipFast 約 4 個月營收 $528K（次級來源；Marc Lou 上市前已有大量 X 追蹤者）。（[Starter Story 鏡像](https://starterstory.herokuapp.com/marc-lou-shipfast)）
- 反例：一位開發者在 Gumroad 上架 5 個 Next.js templates，數月後約 92 次瀏覽、10 次免費下載、$0 付費銷售，作者歸因於缺乏分發而非產品本身。（[Indie Hackers：Next.js templates, months of work, $0 in revenue](https://www.indiehackers.com/post/next-js-templates-months-of-work-0-in-revenue-here-is-what-i-got-wrong-25d7012907)）
- shadcnblocks 至 2025-09 達月營收約 US$58k，並且到 2026 年初仍被描述為月月成長（次級來源；未取得上市後逐月曲線）。（[Tiny Startups](https://tinystartups.beehiiv.com/p/twits-81)、[EveryDev](https://www.everydev.ai/developers/shadcnblocks)）
- 有 UI kit 銷售指南以 $79 個人與 $229 團隊授權示範「一個月 30 筆、$3,270」，但明確是假設情境，非實際數據。（[Pocketsflow](https://www.pocketsflow.com/blog/how-to-sell-ui-kits)）
- 某 Tailwind CSS 模板商店在 Microns 上掛牌時 ARR 僅 $1,562（不同業者，顯示長尾小賣家規模）。（[Microns Premium CSS Templates Store](https://www.microns.io/startup-listings/premium-css-templates-store)）

### Inferences
- 推論（估算，非事實）：以 SunUI 為無既有大量受眾的個人開發者、Pro 定價約 $99、靠 shadcn registry、X/Threads、Product Hunt、Reddit 分發的情境：
  - 上市首月：多數營收集中在發表週，合理區間約 $0 到 $3,000（10 到 30 筆）；若 Product Hunt 或 X 爆紅可能到 $5k 到 $10k。
  - 3 個月累計：約 $1k 到 $8k。
  - 6 個月累計：約 $3k 到 $20k。
  - 12 個月累計：約 $5k 到 $50k；要達到 shadcnblocks 等級（年化約 $700k）需要 1 到 2 年以上持續每月更新與內容行銷。
  - 這些區間是根據上述兩端案例與市場價格帶推估，沒有直接來源，報告撰寫時應明確標示為估算。
- 推論：一次付費模式的營收曲線通常呈「上市尖峰 + 促銷尖峰 + 新內容發布尖峰」，因此固定的更新節奏（shadcnblocks 每月 changelog、shadcn studio 每月釋出）同時是行銷節奏。
- 推論：以已註冊用戶約 13% 到 15% 付費的上限參考（shadcnblocks），SunUI 若 12 個月累積 3,000 個免費註冊，樂觀情況約 300 到 450 位付費者；以 $99 計約 $30k 到 $45k。實際轉換很可能更低，因為新品牌信任度不足。

### Gaps
- 未找到任何 shadcn 原生 UI kit 公開的逐月上市後營收曲線（shadcnblocks、Launch UI、Tailark、shadcn studio 都沒有）。
- 未找到訪客對付費（visitor-to-paid）轉換率的公開數據。
