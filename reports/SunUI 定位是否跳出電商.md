# SunUI 該換主詞，不該換戰場

> 研究日期 2026-11-13。本報告綜合 `research_notes/SunUI 定位是否跳出電商/` 的五份筆記。證據強度標記：【實測】是研究者當天從頁面或 API 讀到的數字；【自述】是廠商或創辦人自己報的數字；【估計】是研究者自己的分類或算術。沒有任何一筆資料來自真實客戶訪談或 SunUI 自己的銷售紀錄。Pro 區塊只引用名稱與標籤，沒有引用原始碼。

「元件庫不應該局限在電商」這句話對了一半，而且對的那一半很重要。**對的部分**：把「電商」當成整個產品的主詞是錯的，因為免費型錄有大約 80% 的項目不需要電商情境就能用，能安裝 React 元件的商店全球只有大約 5.5 到 6 萬家（不到 Next.js 網站的 3%），研究也沒找到任何一家以產業垂直為主標而做起來的 UI 元件庫。**不對的部分**：如果這句話的意思是把 Pro 的投入轉向通用 SaaS 落地頁與後台區塊，那是走進目前被 AI 侵蝕最深的市場（Tailwind Labs 營收下跌約 80%，ShipFast 月營收從約 12.6 萬美元掉到約 2 千美元），而且那裡至少有八家庫在賣幾乎相同的東西。同時，有動效、檔期等級的電商頁在每一家動效庫裡都是空白，這個空白是真的，只是需求沒被證明。所以建議是換主詞，不換戰場：對外第一句話改以「紙感與動效手感、組好的場景」為主軸，電商與檔期降為旗艦合輯（不是定義），Pro 的檔期交付與農曆新年套件照原計畫走。離 Founding 開賣只剩 14 天，11-27 之前只做兩件便宜的事（加非電商合輯、在購買流程記錄用途），定位句的四語改寫放在 11-27 到 2027-01-12 之間，Pro 投入方向的調整等 2027-01 的實際銷售資料。要先說清楚的限制：以下多數發現是供給面計數、廠商自述或研究者估計，沒有台灣與中國資料、沒有分類銷售資料、沒有 Google Trends，「電商買家會付錢」和「非電商買家會付錢」目前同樣沒有實證。

## 電商定位從第一天就是假說，三個理由都來自供給面

現行定位在至少八個地方重複：`AGENTS.md` 第一句、`DESIGN.md` 的「紙感電商」、首頁四語的標題與導言（繁中是「有紙感的 React 電商區塊」「少一點閃爍，多一點下單」）、FAQ、定價頁、六個全部是電商情境的合輯、`llms.txt`、給 agent 的設計規則，以及 MCP server 的自我介紹（[AGENTS.md](../AGENTS.md)、[DESIGN.md](../apps/web/DESIGN.md)、[messages.ts](../apps/web/lib/messages.ts)、[llms.txt route](../apps/web/app/llms.txt/route.ts)、[guidelines.ts](../apps/web/lib/agent/guidelines.ts)）。但這個定位的出身很清楚。2026-11-04 的主規劃書把它從「可以直接上線的動態互動元件與區塊」收窄成電商檔期時，自己寫下：研究**沒有找到任何電商動畫區塊需求量的量化資料**，定位是基於「供給空白」的假說，需要用 Founding 預售驗證（[SunUI 商業化深度規劃](<SunUI 商業化深度規劃.md>)）。

之後選電商的理由換了三次，三次都不是需求證據。11-04 是「90 個動效 registry 沒有一家專攻電商檔期」，11-06 是「檔期有行事曆，可以用季節包解決買斷沒有回購」（[商業模式深度分析](<商業模式深度分析-2026-11-06.md>)），11-07 是「八家競品 0 家做電商」，而那八家的樣本來自一則 X 推文（[八家 UI 元件庫競品分析](<八家 UI 元件庫競品分析-2026-11-07.md>)）。付費意願最高的買家「Ray」（headless 電商接案工作室老闆）是模擬人物，報告自己標明是模擬不是訪談（[TA 模擬 11-06](<TA 模擬-2026-11-06.md>)）。截至這些報告撰寫時，GitHub 4 星、waitlist 0、沒有任何一筆付款。

重要的是，內部報告早就記下了作者現在提出的懷疑。第一輪 TA 模擬裡，英文市場的 indie hacker 認為「commerce and campaign」太窄會直接跳過，並建議加一個「SaaS billing」情境入口（[TA 模擬 11-05](<TA 模擬-2026-11-05.md>)）；第二輪的結論第一點是「網站在講兩個不同的產品」，首頁型錄 313 張卡裡 67% 是動效變體；商業模式分析把 Indie SaaS 客群評為「規模大」，把免費層形容為「已經變成另一個產品」。SaaS billing 入口被建議了兩次，至今六個合輯裡沒有它。repo 裡也已經寫好退場條件：**2027-01-11 Founding 未達 50 筆，檔期定位退回「通用轉換區塊」**，複審點排在 2027-01-27 到 02-02。所以作者的主張不是外來的新想法，而是內部文件預留的分支被提前拿出來談。

## 能裝 React 元件的商店約 5.5 到 6 萬家，不到 Next.js 網站的 3%

電商很大，但能執行 `npx shadcn add` 的電商很小。Store Leads 的爬蟲資料（2026-11-06 更新）偵測到 **116,755 家**使用 Next.js 的商店，年增 45.7%，但最近一季只增 0.5%（[Store Leads Next.js](https://storeleads.app/reports/technology/Next.js)）。其中 ikas、Easy Order、order smart 等約 5.2 萬家是代管平台自己用 Next.js 渲染，商家碰不到程式碼。研究者把 Shopify headless（25,852）、Custom Cart（22,779）、Magento（8,079）與少數企業平台加起來，估計開發者真正能改程式碼的商店約 **5.5 到 6 萬家**【估計】。對照同一來源的 3,245,947 家 Shopify 商店（[Store Leads Shopify](https://storeleads.app/reports/shopify)），超過 99% 的 Shopify 商家在 Liquid 佈景上；Shopify Hydrogen 只有 5,353 家（[Store Leads Hydrogen](https://storeleads.app/reports/technology/Shopify%20Hydrogen)），比 2025 年才推出的 Horizon 佈景（170,878 家）小約 30 倍。

方向也不利。Shopify 2026 年的開發者公告被代理商解讀為「加碼 Liquid」（[Domaine](https://domaineworldwide.com/insights/commerce-insights/shopify-dotdev-2026-announcements/)），Horizon 與 SHOPLINE OS 3.0 都把 AI 產生區段放進佈景編輯器（[Inside Retail](https://insideretail.com.au/digital/shopifys-ai-revolution-build-stores-faster-and-smarter-202505)、[SHOPLINE Help](https://help.shopline.com/hc/zh-cn/articles/58503421684377)）。代管平台上的檔期頁預算流向無程式碼工具：單一個 PageFly 被第三方追蹤到約 8.3 萬家 Shopify 商店在用【第三方估計，未驗證】（[ShopThemeDetector](https://shopthemedetector.com/shopify-statistics/2026)），比所有 Hydrogen 商店加上所有 Next.js Shopify 商店（約 3.1 萬）還多。東南亞的平台 GMV 有 98.8% 在 Shopee、Lazada、TikTok Shop 手上（[Momentum Works](https://thelowdown.momentum.asia/new-report-southeast-asias-platform-ecommerce-reaches-us157-6b-in-2025-with-top-platforms-expanding-share-to-98-8/)），那些檔期頁是賣場裝修，不是 React 專案。

相較之下，通用 Next.js 世界大一到兩個數量級。Wappalyzer 系的估計是約 250 萬個 Next.js 網站【二手來源】（[eSparkInfo](https://www.esparkinfo.com/software-development/front-end/statistics)），`next` 一週 npm 下載 9,136 萬次，`@shopify/hydrogen` 是 13.3 萬次，約 0.15%（[npm next](https://api.npmjs.org/downloads/point/last-week/next)、[npm hydrogen](https://api.npmjs.org/downloads/point/last-week/@shopify/hydrogen)）。把兩組爬蟲數字相除，可改碼的商店約佔 Next.js 網站的 2.3%【估計，分子分母來自不同爬蟲，只能當量級】。SunUI 已經建好的分發管道（shadcn registry、MCP、llms.txt）面對的是 shadcn/ui 12.8 萬星的通用 React 開發者（[shadcn-ui/ui](https://github.com/shadcn-ui/ui)），不是 Hydrogen 2,176 星的電商專門社群。

這組數字有兩個必須說明的缺口。第一，**台灣、日本、中國、東南亞沒有可用的 React 商店計數**，Store Leads 的國別前九名裡沒有這些市場，台灣平台市佔沒有經稽核的數字，中國資料完全沒取得。第二，真正的買家不是商家，而是接到檔期 brief 的接案公司與內部開發者，而**沒有任何來源統計過有多少接案公司手寫 React 檔期頁**。日本的 LP 製作訂單中位數是 40 萬日圓（n=166，2022 到 2023 年的案子）（[Web担当者Forum](https://webtan.impress.co.jp/n/2024/07/05/47298)），證明有人為落地頁付錢，但沒說其中多少是 React。也就是說，「電商前端市場小」的結論對商家成立，對接案客群則是未知。

## 競品全部橫向，電商只以模組存活，但動態檔期頁沒有人做

研究檢視的十七家庫幾乎全部橫向定位：對象是「design engineers」、indie hacker、創辦人與接案者，預設頁型是 SaaS 與 AI 新創的落地頁，個人終身授權落在 150 到 350 美元（Magic UI Pro 199、Aceternity 199、React Bits Pro 129 到 349、shadcnblocks 149 到 399）（[Magic UI Pro](https://pro.magicui.design/)、[Aceternity brand facts](https://ui.aceternity.com/brand-facts)、[React Bits Pro](https://pro.reactbits.dev/about)、[shadcnblocks pricing](https://www.shadcnblocks.com/pricing)）。React Bits Pro 用買家類型（indie hacker、創辦人、接案公司、AI coding agent）切行銷，不用產業切（[React Bits Pro agencies](https://pro.reactbits.dev/best-for/agencies)）。

對「電商垂直」不利的證據有三條。純電商的 shadcn registry 都很小而且停滯：stackzero-labs/ui 266 星，2025-09 之後沒有提交；Commercn 81 星、約 12 個區塊（[stackzero-labs/ui](https://github.com/stackzero-labs/ui)、[Commercn](https://github.com/Logging-Studio/Commercn)）。成功的路徑一律是先橫向再加垂直包：Tailwind UI 2020 年推出，18 個月後才加 Ecommerce 套件；shadcnblocks 2023 年成立，2026-01 才加電商區塊（[Tailwind UI Ecommerce](https://tailwindcss.com/blog/tailwind-ui-ecommerce)、[shadcnblocks ecommerce](https://www.shadcnblocks.com/blog/new-ecommerce-blocks)）。而「窄起步」成功的案例，窄的都是技法或風格（Aceternity 與 Magic UI 的動效、Tremor 的圖表），不是產業。研究者明說：**沒找到任何一家從純電商起步後成功擴張的庫，也沒找到任何以產業垂直為主標且公布營收的 UI 庫**。

對「電商垂直」有利的證據也有三條，而且同樣實在。第一，那些死掉的純電商 registry 賣的是靜態功能 UI（商品卡、購物車、結帳表單），這類東西已經被 shadcnblocks 的約 300 個電商區塊與 Tailwind Plus 商品化；它們和「有動效的檔期場景」是不同產品，所以是弱反證。第二，動效庫的 Pro 內容完全沒有電商：Magic UI Pro 的九個模板是 AI Agent、Dev Tool、SaaS、Portfolio 等，React Bits Pro 的 600 個區塊與 15 個模板沒有提到電商。連大型型錄裡，檔期相關的類別也稀少（shadcnblocks 的 Promo Banner 11 個、Deals 5 個）（[shadcnblocks blocks](https://www.shadcnblocks.com/blocks)）。第三，Promethean Research 的資料（經 GoDaddy 轉述，樣本與日期未說明）指出同時以服務與產業專精的接案公司成長快 40%（[GoDaddy research](https://www.godaddy.com/resources/ca/research/what-we-learned-from-talking-to-hundreds-of-web-designers-amp-developers)），原則上支持利基。

這個空白有兩種讀法，現有證據分不出來。讀法 A：動效庫不做電商，只是因為創辦人與受眾都是 SaaS 圈的人，所以動態電商沒有直接對手。讀法 B：做商店的人用佈景、頁面編輯器或接案公司自己的套件，根本不逛 React 區塊庫，所以沒人做是因為沒人買。shadcnblocks、ReUI、Tailwind 持續投資電商區塊，說明至少有一些 React 開發者需求，但沒有任何一家公布電商類別的銷售佔比。另外，風格型的窄定位也不是保證：neobrutalism-components 約 3,700 星、沒有營收揭露，並被競品部落格指為 2025 年中起不再維護【競品行銷說法，需保留】（[RetroUI blog](https://retroui.shadcn.io/blogs/neobrutalism-dev-alternative)）。風格比較像是通用產品上的簽名（Aceternity 的做法），單靠風格撐不起整個產品。

## 付費需求集中在 SaaS 落地頁與後台，而那正是 AI 侵蝕最深的地方

所有讀得到的訊號都指向同一件事：這個市場的錢在 SaaS 落地頁、應用 UI 與後台模板，電商是三個標準套件裡最小的一個。shadcnblocks 2,866 個區塊裡，Feature 334、Hero 292 兩類就佔約 22%，電商類兩位研究者各自統計為約 11% 與約 13%【估計，分類邊界不同】；Tailwind Plus 的非官方型錄把電商算成約 17%【非官方】（[shadcnblocks blocks](https://www.shadcnblocks.com/blocks)、[Tailwind Plus catalog](https://claudskills.com/skills/tailwindplus/SKILL.md)）。ThemeForest HTML 類的長銷榜是 Metronic（12 萬份）、Canvas、Porto、Fuse，研究者依自己的產品知識判斷七個上榜模板有五個是後台、沒有一個是純商店（[ThemeForest](https://themeforest.net/category/site-templates)）。GitHub 上「shadcn dashboard」加「shadcn admin」共 5,308 個 repo，是「shadcn ecommerce」554 個的約 9.6 倍；全 GitHub 符合「black friday landing page」的只有 168 個（[GitHub: shadcn dashboard](https://github.com/search?q=shadcn+dashboard+in%3Aname%2Cdescription&type=repositories)、[GitHub: shadcn ecommerce](https://github.com/search?q=shadcn+ecommerce+in%3Aname%2Cdescription&type=repositories)、[GitHub: black friday landing page](https://github.com/search?q=black+friday+landing+page+in%3Aname%2Cdescription&type=repositories)）。唯一帶頁型標籤的營收揭露是 Aceternity：2024-10 自述月收約 6 到 10 萬美元，約一半來自接案服務，客戶是早期新創與開發者，自稱做的是落地頁生意（[Starter Story](https://www.starterstory.com/stories/aceternity-ui)）。

這些都要打折看。它們是**供給面計數與排行榜，不是買家搜尋或分類銷售**。型錄組成反映的是賣家相信什麼好賣，是落後指標。沒有任何市集或庫公布分類營收，Google Trends 沒取得，開發者調查裡沒找到「你在做哪種網站」的分布。Aceternity 的數字是兩年前的自述。

更關鍵的是另一面：市場最大的那一塊，剛好是 AI 打得最重的那一塊。Tailwind Labs 在 2026-01 表示營收下跌近 80%、文件流量下跌約 40%，裁掉四位工程師中的三位，而框架使用量創新高；Adam Wathan 給的機制是「文件是人們發現付費產品的地方」，agent 讀了免費層，人就不再看到升級提示（[DevClass](https://www.devclass.com/ai-ml/2026/01/08/tailwind-labs-lays-off-75-percent-of-its-engineers-thanks-to-brutal-impact-of-ai/4079571)）。ShipFast 的創辦人自述月營收從 2024 年約 12.6 萬美元、2025 年 2.5 萬美元掉到 2026 年約 2 千美元（[aiidelist](https://aiidelist.com/blog/shipfast-revenue-collapse-marc-lou-2026)）。兩個案例的共同點是內容通用、一次買斷、靠人類瀏覽頁面被發現。歸因有爭議：多位評論者認為買斷制本身才是弱點，AI 只是壓力測試（[Dries Buytaert](https://dri.es/ai-is-a-business-model-stress-test)）。也有反例顯示通用區塊還在賣：shadcnblocks 的定價頁自述 5,420 位 Pro 客戶，另一個目錄則寫 2026 年初約 1,600 位，兩個數字都未經驗證（[shadcnblocks pricing](https://www.shadcnblocks.com/pricing)、[EveryDev](https://www.everydev.ai/developers/shadcnblocks)）。

「電商」這個標籤本身並不提供保護。營收跌掉 80% 的 Tailwind Plus 就含有電商套件。關於什麼能抵抗 AI，證據幾乎全是評論文章：AI 產出會收斂到一種可辨識的中位數外觀（漸層、卡片格、shadcn 預設），而模型在整頁的節奏與一致性上比單一元件弱（[UX Collective](https://uxdesign.cc/ai-design-isnt-ugly-it-s-fluent-and-thats-the-problem-131b2f4eb78c)、[braindetox](https://braindetox.kr/en/posts/ai_generated_ui_coherence_2026.html)）。由此推得的判斷是：可防禦的價值等於「產出離中位數有多遠」，偏好獨特的美術方向、複雜動效與組好的整段場景，而不是類別覆蓋率。垂直只有在帶著模型會做錯的領域邏輯時才有幫助，購物車、規格、倒數、庫存的行為帶得比較多，一張「電商 hero」幾乎不帶。這個推論方向對 SunUI 有利（紙感、黑白灰、Pro 賣場景），但沒有任何營收資料證明它成立，模型能力也在移動。SunUI 自己的 agent 實測已經看到同一個問題：使用者說「Black Friday hero」時，agent 會用免費的 gradient-backdrop 加 countdown-banner 自己組，不會轉成 Pro（[TA 模擬 11-06](<TA 模擬-2026-11-06.md>)）。而 llms.txt 這類 agent 入口只是基本配備，Ahrefs 的伺服器紀錄研究顯示 97% 的 llms.txt 檔在 2026-05 沒有收到任何請求（[Ahrefs](https://ahrefs.com/blog/llmstxt-study/)）。

## 免費層 80% 已不限電商，Pro 層 63% 仍綁電商與檔期

型錄的實際組成和文案講的不是同一件事。以下三分類是研究者依名稱與描述做的判斷，repo 沒有對應欄位，邊界項目換人分會差正負 5 個左右，沒有安裝量資料可以佐證哪一類真的被裝。

| 層 | 總數 | 電商專用 | 檔期與行銷 | 通用 |
|---|---|---|---|---|
| 免費 | 104 | 21（20%） | 23（22%） | 60（58%） |
| Pro | 90 | 35（39%） | 46（51%） | 9（10%） |

資料來源：[registry.json](../apps/web/registry.json) 與 Pro registry 清單的腳本計數加研究者分類【估計】。

免費層的 23 個行銷項目裡，描述明寫商店或折扣的只有 countdown-banner、announcement-strip、spine-shelf 三個，其餘 20 個任何產業的形象頁都能用。也就是**免費層約 83 個項目（80%）不需要電商情境**。60 個通用項目中還有約 13 個只是「描述寫成電商」（animated-number 寫成價格、avatar-stack 寫成最近買家、range-slider 寫成價格區間等），改描述與示範資料就能中性化。五個系列裡，只有 paper 的設計文件以電商定義自己；product（安靜的工具介面）、story（墨與燈）、motion 三份設計文件完全不提電商，授權文案更直接寫「用在 SaaS 產品、網站、內部工具」（[DESIGN-product.md](../apps/web/DESIGN-product.md)、[DESIGN-story.md](../apps/web/DESIGN-story.md)、[messages.ts](../apps/web/lib/messages.ts)）。站上是用其中一個系列的一句話代表整個產品。所以對免費層來說，「元件庫不該只限電商」是對現況的描述，不是新方向。

Pro 層相反。帶 commerce 或 campaign 標籤的有 72 個（80%），四個整頁模板（campaign-landing、black-friday-weekend、checkout-flow、lunar-new-year）全部是電商或檔期，35 個電商專用加上約 22 個綁特賣或節慶的場景，合計約 **57 個（63%）是電商或檔期專屬**。付費價值確實壓在電商上。但 Pro 也已經自己在往外走：46 個行銷場景裡約 24 個是產業中性的（pricing-cards、plan-comparison、launch-stage-hero、day-night-hero、self-building-page、glass-cube-hero 等），showcase 系列從 0 長到 20，還出現了 ask-ai-halo、storage-meter、scrub-stat-card 這類明顯非電商的題材，以及五個像素遊戲營運場景。agent 對「SaaS pricing page」與「產品運作示範」的查詢已經能回出合理答案。

這裡有一個比定位更值得注意的訊號：規則和實作一直在分岔。11-05 的目標是 11-27 時 Pro 30 個、免費凍結 58 個，今天是 Pro 90、免費 104；11-07 建議「11-27 前不新增 Pro 單品」，之後 Pro 從 55 增到 90；競品分析把「追 AI agent 介面題材」列為不做清單第一條，之後仍新增了 ask-ai-halo；`llms.txt` 還寫著已在 11-06 被禁用的朱紅與印章。創辦人的手實際在做的東西，比文案寬，也比計畫寬。定位句與其說該「改」，不如說該追上型錄已經長成的樣子。唯一要小心的是，招牌的電商整頁模板 campaign-landing 在 11-09 才第一次被作者本人判定為「好普通」（[檔期活動頁平庸診斷](<檔期活動頁平庸診斷-2026-11-09.md>)），所以「Pro 的檔期場景品質已足以撐起旗艦」也還不是定論。

## 建議：以紙感與動效手感為主軸，電商檔期降為旗艦合輯

### 三個選項裡，只有換主詞同時保住空白與分發

| 選項 | 內容 | 最主要的好處 | 最主要的風險 |
|---|---|---|---|
| A 維持不變 | 主標續用「紙感電商區塊」，甚至更往檔期收 | 訊息單純，檔期假說的驗證不受干擾，零改寫成本 | 主標對約 97% 的 Next.js 專案自我排除；Product Hunt 只有一次首發；若 A 的空白其實是讀法 B（沒人買），要到 2027-02 才知道 |
| B 換主詞（建議） | 主標改為風格與手感（紙感、不發光、組好的動態場景），電商與檔期成為第一個、最深的合輯；另用現有區塊加兩到三個非電商合輯；Pro 檔期交付不變 | 讓文案追上型錄現況；對齊 agent 與通用 React 開發者這條分發管道；保留沒有對手的檔期場景當作示範與付費核心 | 訊息變模糊，回到 TA 模擬說的「網站在講兩個產品」；風格型定位沒有營收先例；四語加 agent 端點的改寫擠壓收款與場景工作 |
| C 轉通用 | Pro 投入轉向 SaaS 落地頁、後台、AI 介面區塊 | 面對最大的買家池 | 走進 AI 侵蝕最深、八家以上同質競爭的市場；丟掉唯一沒有直接對手的題材；對 Founding 買家的農曆新年套件承諾失信 |

建議選 B，理由是它是唯一同時符合三組證據的選項：成功的窄起步都窄在技法與風格而不是產業；通用區塊的價格力正在被 AI 拿走，所以不該用通用內容去追通用市場；動態檔期頁是所有動效庫的空白，所以不該放掉。具體的說法可以借 React Bits Pro 的做法，把電商與檔期表達成買家區段（做商店與活動頁的接案公司與內部團隊），而不是把整個型錄貼上產業標籤。要誠實標示的是，B 的「風格主軸」本身也是假說，支持它的是評論文章與競品型態，不是銷售資料。

B 對既有驗證實驗的影響也要講清楚。原本「2027-01-11 滿 50 筆」是檔期假說的門檻，提前改主標會讓它失去對照。但這個實驗本來就分不出「定位錯」和「分發不足」：11 月初 waitlist 是 0、GitHub 4 星，開賣日又正好是黑五當天，今年要做黑五頁的人早就需要了。50 筆乘以 79 美元大約是 3,950 美元【估計】，這個門檻量到的主要是有沒有流量。與其保護一個本來就不乾淨的對照，不如在購買與 waitlist 流程加一題「你要拿來做什麼」，讓同樣的 50 筆能回答電商、檔期、SaaS、遊戲各佔多少。

### 11-27 前只加合輯與量測，定位句留到開賣之後改

| 時間 | 做什麼 | 不做什麼 |
|---|---|---|
| 現在到 2026-11-27（14 天） | 先完成收款（Polar KYC 與結帳連結，[LAUNCH.md](../apps/web/LAUNCH.md) 標為最可能卡關）；用現有區塊加兩到三個非電商合輯（SaaS 定價與帳單、產品發表、產品示範），不新增免費區塊，符合凍結規則；在 waitlist 與結帳加用途欄位 | 不改四語主標、不改 `AGENTS.md` 與 `DESIGN.md` 的定位句、不從 lab 搬回元件、不新增非電商 Pro 單品 |
| 2026-11-27 到 2027-01-12 | 把第一句話改成風格與手感主軸，四語同步，連同 FAQ、`llms.txt`、`guidelines.ts`、MCP 說明一次改完（順便修掉過期的朱紅與印章文字）；把約 13 個「描述寫成電商」的免費項目中性化；農曆新年套件 12 月下旬照原承諾交付；Product Hunt 素材用風格句當標題、用檔期場景當主示範 | 不調價、不拆子品牌、不改 registry 網址與 namespace（公開後不宜更換） |
| 2027-01-12 之後 | 在既定的第 13 週複審點（2027-01-27 到 02-02）用用途欄位、Team 佔比、農曆新年包回購率決定 Pro 的下一批場景投在哪個合輯；凍結解除後再評估從 lab 搬回 command-palette 等通用元件；評估遊戲營運第二垂直與終身價調整 | 在沒有銷售資料前，不把 Pro 主力轉向通用 SaaS 區塊 |

把定位句的改寫放在 11-27 之後，是因為它不是改一句標題。`AGENTS.md` 規定使用者文案要四語同改、設計文件改動要同步 `guidelines.ts`，定位句又散在至少八個地方。在收款還沒接通的 14 天內做這件事，會直接擠掉開賣本身。而合輯是資料層的新增，成本低，又能立刻讓非電商訪客在首頁看到自己的情境。Product Hunt 只有一次首發，所以主標必須在 2027-01-12 之前定案，這是硬期限；11-27 不是。

### 各選項都還沒被證據回答的問題

以下問題決定建議對不對，而目前都沒有資料。第一，動態檔期頁的空白是讀法 A 還是讀法 B，只有銷售能回答，而第一個乾淨的檔期測試其實是農曆新年（2027-02-06），不是黑五。第二，手寫 React 檔期頁的接案公司有多少、一年做幾檔、願意為元件付多少，沒有任何來源統計，台灣、日本、中國、東南亞尤其空白。第三，風格主軸能不能賣錢：沒有任何風格型庫公布營收，Magic UI、React Bits Pro、shadcnblocks 也都沒有公開營收。第四，agent 帶來的使用量能不能轉成授權銷售，研究沒找到任何一家付費庫宣稱解決了這件事，Tailwind 正是反例。第五，買斷授權的訪客轉換率沒有可引用的基準；研究者的情境試算是，以 149 美元賣到年收 10 萬美元，在假設 0.5% 轉換率下需要每月約 1.1 萬名合格訪客，這是假設值不是基準。第六，內部狀態未知：Polar KYC 是否通過、waitlist 人數、安裝排行、檔期定位已對外曝光到什麼程度，repo 裡都沒有最新數字。第七，作者這句話的範圍不明，它可以指對外主標、免費層範圍，或 Pro 的投入方向，本報告對前兩者說「對」，對第三者說「還不能」，如果作者的本意是第三者，結論要反過來讀。

## Conclusion

這次研究改變的不是「電商好不好」的答案，而是問題的切法。垂直對橫向是一條假的軸線：市場上有營收的庫都不是靠產業標籤贏的，被 AI 打垮的也不是因為太寬或太窄，而是因為內容通用、容易被重新生成。真正決定 SunUI 能不能收到錢的軸線是「離 AI 的中位數產出有多遠」以及「人或 agent 在哪裡遇到付費提示」。在這條軸線上，紙感的美術方向與組好的動態場景是資產，「電商」只是這些資產目前最完整的展示櫃。

另一個值得帶走的觀察是，型錄比文案誠實。三次自訂的數量上限都被突破，不做清單上的題材還是做了，Pro 一路長出主題切換、AI 輸入、遊戲營運。這說明創辦人的興趣與手感本來就不在單一產業裡，硬用產業定位去約束，結果只是文案和產品各走各的。把主詞換成風格與手感，是承認這件事；把檔期留作旗艦合輯並在結帳記錄用途，則是讓 2027-01 的複審第一次有真實資料可看，而不是再靠一輪模擬人物來決定下一季。
