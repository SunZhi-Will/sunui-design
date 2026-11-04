# 用電商檔期區塊打開 SunUI 付費市場

SunUI 要商業化，靠的不是元件數量，也不是「有動畫」，而是一個目前沒有人好好做的垂直切口：**可直接上線的電商與行銷檔期區塊**（倒數、限時折扣、庫存緊張、優惠券領取、加入購物車回饋、價格動畫），而且預設處理好 reduced-motion、鍵盤操作與繁中 / CJK 排版，再配上一頁講清楚的商用授權。動畫元件市場已經非常擁擠：shadcn 官方 registry 索引裡描述含 motion 或 anim 的 registry 約 90 個，React Bits 有 5.1 萬顆星，shadcnblocks 有數千個 blocks，所以 SunUI 不可能拼量，只能拼「最專精」。價格帶已收斂在一次買斷 US$129 至 349，US$199 是事實錨點；建議 SunUI 以 **Pro 個人終身 US$129、Team（5 人）US$349、Founding member 限量 US$79** 進場，收款主選 **Polar**（官方文件明列台灣出款，內建 license key API），Lemon Squeezy 不再建議。最大的結構性風險來自 Tailwind Labs：使用量創新高、營收卻跌近八成，因為 AI 讓開發者不再造訪文件，漏斗入口消失；SunUI 必須把轉換點放在 agent 工作流內（`@sunui-pro` 私有 registry、CLI 回 401 附升級訊息），而不是寄望訪客逛網站後購買。財務上必須誠實：沒有既有受眾的個人開發者，第一年合理區間是 **US$4 千（保守）、US$1.8 萬（基準）、US$5.6 萬（樂觀）** 的總營收，以上皆為估算。90 天計畫的兩個關鍵節點是 2026-11-27 黑色星期五的 Founding member 預售，以及 2027-01-12 的 Product Hunt 發表。

> 閱讀說明：本報告根據 2026-11-04 完成的五份研究筆記撰寫。【已驗證】表示研究者直接讀取一手頁面或 API；【二手】表示來自媒體、聚合站或創辦人自述；【估算】與【建議】為本報告推論，不是事實。凡涉及稅務與法律之處，皆需台灣執業會計師或律師確認。作者為 Sun（謝上智）。

## 從草案到研究結論：五個重要修正

本報告延續 `docs/COMMERCIAL_PLAN.md` 草案已選定的方向 A（微互動 + 可上線的商業區塊，open-core 免費 + Pro），但有五處依研究結果改寫，先列在前面方便對照。

| 項目 | 草案原本寫法 | 研究後的修正 | 主要依據 |
|---|---|---|---|
| 定價 | Pro 個人 US$99（早鳥 US$69），Team 10 人 US$299 | 個人 US$129、Founding member US$79 限量、Team 5 人 US$349 | 錨點 US$199，新進者如 Launch UI 為 US$99；團隊價普遍為個人價 2.5 至 5 倍，US$299 / 10 人明顯偏低 |
| 收款平台 | Polar 或 Lemon Squeezy 二選一 | Polar 主選，Dodo Payments 備援；Lemon Squeezy 排除 | Lemon Squeezy 官方承認更新變慢，遷移目標 Stripe Managed Payments 不支援台灣賣家 |
| 元件數量節奏 | 上線 40、90 天 80、半年 150 | 上線約 24、90 天約 44 + 1 套模板、半年約 80 | 數量不是護城河（90+ 元件的 Artifact UI 總營收 54 美元），少而精的 Launch UI 以 74 個 blocks 賣 US$99 |
| 路線圖內容 | 第二批含 AI UI、Data 圖表 | 移除通用 AI chat UI 與通用圖表，改加電商檔期、CJK 排版 | shadcn 官方 2026-10 推出 AI Elements（21 個 agentic UI pattern），通用 AI 介面已被官方佔據 |
| 漏斗設計 | 以網站型錄、SEO 頁導購為主 | 型錄 + SEO 仍做，但轉換點移入 CLI / MCP；登錄 shadcn 官方索引列為第一週任務 | Tailwind Labs 文件流量降約 40%、營收降約 80% |

## 擁擠市場裡唯一的空白：電商檔期、無障礙與授權透明

### 競品全貌：大家用同一套技術棧，差別只在數量與風格

所有主流玩家都是 React + Tailwind + Motion，SunUI 的技術選擇本身零教育成本，但也零差異。底層生態的規模說明了這點：**framer-motion 近 30 日下載 2.05 億次、motion 1.03 億次**【已驗證】([npm API framer-motion](https://api.npmjs.org/downloads/point/last-month/framer-motion)、[npm API motion](https://api.npmjs.org/downloads/point/last-month/motion))，`shadcn` CLI 週下載從去年同期的 44.7 萬成長到 **1,725 萬**（約 39 倍）【已驗證】([npm API](https://api.npmjs.org/downloads/point/last-week/shadcn))。開源聲量的級距很清楚：**React Bits 51,230 星**遠超 **Magic UI 23,080 星**，下一梯是 Cult UI（6,948）與 Motion Primitives（6,895），再來是 Animate UI（4,884）、Animata（2,992）、Eldora（1,977）【已驗證】([React Bits](https://github.com/DavidHDev/react-bits)、[Magic UI](https://github.com/magicuidesign/magicui)、[Cult UI](https://github.com/nolly-studio/cult-ui))。

付費區塊市場則已進入數量軍備競賽：shadcnblocks 有 **2,467+ 個 Pro blocks 與 21 套模板**【已驗證】([shadcnblocks 定價頁](https://www.shadcnblocks.com/pricing))，shadcn.io 宣稱 **6,231 個 blocks**，而且已把 animated buttons、text effects、backgrounds、shaders 做成 Pro 賣點並附 MCP【已驗證】([shadcn.io 定價頁](https://www.shadcn.io/pricing))，這是 SunUI 動畫定位最直接的競品。新進者 bencho.dev 走另一條路：約 158 個可調參的單點微互動、145 個 Web Audio 合成音效、策展區與無限畫布 Bench，GitHub repo 2026-10-18 才建立【已驗證】([bencho.dev](https://bencho.dev)、[GitHub](https://github.com/cabralorenzo/bencho))，上線不到一個月就已被他人 fork 鏡像【已驗證】([react-micro-interactions](https://github.com/OliviaR13/react-micro-interactions))，這提醒 SunUI：免費層一定會被複製，付費價值必須放在持續更新與未公開的高階區塊。

### 定價比較：US$199 是錨點，團隊方案是空白

| 產品 | 免費層 | 付費方案（2026-11-04 抓取） | 型態 |
|---|---|---|---|
| Magic UI Pro | 開源 MIT | Lifetime US$199 | 買斷 |
| Aceternity UI Pro | 100+ 元件含 MCP | 1 年 US$169、Lifetime US$199、Team 10 人 US$1,590 | 買斷 |
| React Bits Pro | MIT + Commons Clause | US$129 / 249 / 349 | 買斷 |
| bencho.dev | 46 blocks | Pro €99/年、Forever €129（疑似限前 200 名） | 年訂或買斷 |
| Skiper UI | 部分免費 | Premium US$129 | 買斷 |
| Motion+ | Motion 本體 MIT | Individual US$399，團隊按年訂閱 | 買斷 + 訂閱 |
| shadcnblocks | 有 | Pro US$149、Premium US$299、Elite US$399 | 買斷 |
| shadcn studio | 57 blocks | Pro US$199、Team 15 人 US$449 | 買斷 |
| Tailark | 有 | US$199 / 249，Team 10 人 US$449 | 買斷 |
| Launch UI | 開源 | Pro US$99、Pro Team US$499 | 買斷 |
| Untitled UI React | MIT 數百元件 | Solo US$349 至 Enterprise US$8,999 | 買斷 |
| shadcn.io | 有 | US$49/月、US$389/年、終身 US$899 | 訂閱為主 |
| Tailwind Plus | 無 | 個人 US$299、團隊 US$979（二手） | 買斷 |

以上動畫庫價格來自各家官網【已驗證】([Aceternity](https://ui.aceternity.com/pricing)、[React Bits Pro](https://pro.reactbits.dev)、[bencho](https://www.bencho.dev/pricing)、[Motion+](https://motion.dev/plus))，區塊站價格同樣為當日抓取【已驗證】([shadcn studio](https://shadcnstudio.com/pricing)、[Tailark](https://tailark.com/pricing)、[Launch UI](https://www.launchuicomponents.com/pricing)、[Untitled UI](https://www.untitledui.com/react))。Magic UI Pro 與 Aceternity Lifetime 都定在 **US$199**，形成事實錨點；單人方案中位數約 US$149 至 199。

### 三個可直接佔領的缺口

第一，**沒有任何一家專攻電商檔期**。Magic UI Pro 的 9 類模板、Cult UI 的 Auth / Directory 全端模板、React Bits 的 page 與 app blocks，全部集中在 SaaS、AI、Dev Tool 與作品集【已驗證】([Magic UI Pro](https://pro.magicui.design)、[Cult UI Pro](https://pro.cult-ui.com))。SunUI 已有的 CountdownBanner 正好落在空白處。第二，**無障礙與 reduced-motion 普遍沒做好**：評論站稱 Aceternity「beautiful but buggy and somewhat heavy on performance」【二手】([builtatlightspeed](https://www.builtatlightspeed.com/theme/andrey-kudinov-aceternity))，比較文指出 Aceternity 與 Magic UI 預設不處理 prefers-reduced-motion【二手，未逐一驗證】([pkgpulse](https://www.pkgpulse.com/guides/react-bits-vs-aceternity-magic-ui-2026))。所有被檢視的官網與 repo 都未提及中文、日文、韓文排版或 CJK 字型載入策略【已驗證為「未提及」】。第三，**授權普遍不透明**：React Bits 與 Animate UI 採 Commons Clause，讓接案者與模板作者無法放心使用；Hover.dev 再散布需書面同意；Skiper 沒有授權說明；Aceternity 與 React Bits Pro 的 FAQ 答案是空白的【已驗證】([React Bits LICENSE](https://github.com/DavidHDev/react-bits)、[Hover.dev](https://www.hover.dev/pricing))。公開團隊方案也只有 Aceternity 與 Motion+ 兩家。

【建議】因此 SunUI 的一句話定位應從草案的「可以直接上線的動態互動元件與區塊」收窄為：**「給電商與行銷活動用的 production-ready 動畫區塊：預設無障礙、reduced-motion 與繁中排版都測過，授權一頁講清楚。」** 這同時回應三個缺口，並與 SaaS landing 主戰場錯開。必須誠實承認：研究**沒有找到任何電商動畫區塊需求量的量化資料**，也未檢查日本、中國是否已有地區型競品，這個定位是基於「供給空白」的假說，需要用 Founding member 預售來驗證需求。

## AI 繞過文件，Tailwind 的崩跌改寫了漏斗設計

### Tailwind Labs：使用量創新高、營收跌近八成

這是整份研究最重要的單一案例。Adam Wathan 2026-01-07 在 GitHub PR 留言揭露：工程團隊 **75% 的人前一天失去工作**（4 名工程師中的 3 名），**營收下滑接近 80%**，**文件流量自 2023 年初下降約 40%**，同時 Tailwind「成長得比以往任何時候都快」，而文件是使用者認識付費產品的主要管道；他也因此拒絕了一個讓文件更適合 LLM 讀取的 PR【已驗證】([GitHub PR #2388](https://github.com/tailwindlabs/tailwindcss.com/pull/2388)、[DevClass](https://www.devclass.com/ai-ml/2026/01/08/tailwind-labs-lays-off-75-percent-of-its-engineers-thanks-to-brutal-impact-of-ai/4079571))。據 podcast 轉述，書籍與 Tailwind Plus 營收從 2023 年第一季高峰**約每天 US$3 萬，跌到 2025-11 約每天 US$6 千**【二手】([Dan Cleary Substack](https://danjcleary.substack.com/p/ai-is-both-propelling-and-undermining))。2026-09-09 Tailwind Labs 宣布加入 Shopify，Tailwind CSS 維持 MIT【已驗證】([BetaKit](https://betakit.com/tailwind-finds-stable-long-term-home-with-shopify-acquisition/))；多家媒體報導其後停止 Tailwind Plus 新註冊，但 BetaKit 原文未提及此點，屬未經官方確認【二手】([CMSWire](https://www.cmswire.com/digital-experience/shopify-acquires-tailwind-labs-to-secure-css-framework/))。

同一份轉述還有兩個對定價極有用的細節：Tailwind Plus 從 US$299 調到 US$399 後，轉換率下降剛好抵消漲價，營收持平；Wathan 也認為改訂閱不會更賺，因為客戶會一次拿走全部內容後就退訂【二手】([Dan Cleary Substack](https://danjcleary.substack.com/p/ai-is-both-propelling-and-undermining))。

### 從案例萃取的四個教訓

教訓一：**失靈的是漏斗，不是產品需求**。AI 回答問題或直接安裝套件時，開發者根本不進網站，付費方案曝光不到【已驗證】([DevClass](https://www.devclass.com/2026/01/08/tailwind-labs-lays-off-75-percent-of-its-engineers-thanks-to-brutal-impact-of-ai/))。同期 shadcn 原生的 shadcnblocks 在 2025-09 月營收約 A$87,503（約 US$5.8 萬），並被描述為持續月成長【二手】([Tiny Startups](https://tinystartups.beehiiv.com/p/twits-81))，說明「舊龍頭衰退、registry 原生新賣家成長」是同時發生的。教訓二：**對 AI 封閉沒有救回營收**，Tailwind 拒絕 llms.txt PR 之後仍走向被併購；對新進者而言，封閉的成本高於開放【估算】。教訓三：**價格彈性接近 1**，調價對總營收的影響遠小於流量與曝光，所以 SunUI 不需要在 US$119 或 US$129 之間反覆糾結，應把力氣放在分發。教訓四：**純買斷只能靠新客**，因此要用團隊授權、單售模板與可選的年度方案分散依賴。

### AI 對 SunUI 的雙面影響

負面一面已經很清楚；正面一面目前只有間接訊號。shadcn MCP 已讓 Claude Code、Cursor、VS Code、Codex 能以自然語言搜尋並安裝任何第三方或私有 registry【已驗證】([shadcn MCP](https://ui.shadcn.com/docs/mcp))，這代表 agent 本身可以成為 SunUI 的新通路。研究的假說是：AI 擅長生成靜態排版與常見 shadcn 版型，對多階段手勢、物理動畫、捲動編排、效能調校、無障礙處理較弱，這正是 SunUI Pro 應放價值的地方；但**目前沒有量化證據支持「AI 提高對互動密集元件的需求」**，這點必須當作待驗證的前提。另一個推論是 npm 下載數十倍成長很大部分來自 agent 與 CI 自動安裝，與 Tailwind「使用量上升、流量下降」一致【估算】。

## 定價、授權與產品線：買斷為主，團隊與模板分散風險

### 建議價目

證據一面倒支持「一次付費、終身存取 + 終身更新」：Tailwind Plus、shadcnblocks、Untitled UI、Launch UI、Tailark 全部採用，Untitled UI 甚至以「沒有煩人的訂閱」作為賣點【已驗證】([Untitled UI](https://www.untitledui.com/react))。唯一明確走訂閱的 shadcn.io 是把訂閱綁在「持續新增 + MCP」上，取消後失去更新與 MCP【已驗證】([shadcn.io](https://www.shadcn.io/pricing))。bencho 則用 €99/年與 €129 買斷並陳，買斷只比年費貴約 30%【已驗證】([bencho](https://www.bencho.dev/pricing))。

| 方案 | 價格【建議】 | 內容 | 理由 |
|---|---|---|---|
| Free | US$0 | 約 45% 至 50% 項目，以單點微互動為主，MIT | 漏斗與 AI 通路，登錄官方索引需要開源 |
| Founding member | US$79 一次付費，限 150 名，僅 2026-11-27 至 2027-01-11 | 等同 Pro 個人終身 | 預售驗證需求、換取早期口碑；比照 bencho 限量買斷 |
| Pro 個人 | US$129 一次付費 | 全部 Pro 區塊 + 未來新增 + `@sunui-pro` registry 存取 | 低於 US$199 錨點約 35%，內容量少於大站，價格要誠實 |
| Pro Team | US$349 一次付費，5 席 | 同上，席位對應 license activation | 約個人價 2.7 倍；比 Aceternity US$1,590 低很多，填補團隊方案空白 |
| 模板單售 | US$49 至 79，Pro 會員 5 折 | 整頁檔期 / 活動 landing | 讓既有客戶有回購理由 |
| 年度 All-access（第二季才測試） | US$99/年 | 全部 Pro + 全部模板 + 新模板 | 只當選項，不取代買斷；Wathan 的經驗顯示不要把它當主力 |

草案的 Team 10 人 US$299 被撤回：團隊價普遍為個人價 2.5 至 5 倍（Launch UI 約 5 倍、shadcn studio 約 2.3 倍、Tailwind Plus 約 3.3 倍）【已驗證價格，倍數為計算】。折扣紀律建議學 shadcnblocks 公開宣告的做法：每年 1 至 2 次大促、平日不灌水原價【已驗證】([shadcnblocks](https://www.shadcnblocks.com/pricing))，這與「授權透明」的品牌一致。PPP 在所有被抓取的定價頁上都未明列，ParityDeals 宣稱可提升低購買力地區銷售 20% 至 70%，但屬廠商數據【二手】([ParityDeals](https://www.paritydeals.com/integrations/lemon-squeezy))，建議等有流量數據再開。

### 授權條款骨架

Tailwind Plus 的核心邏輯值得沿用：可為無限客戶製作無限終端產品，但不得把元件重新包裝成供他人建站的主題、UI kit、page builder 或網站建構器【二手，條款頁需登入未能逐字讀取】([Tailwind Plus License](https://tailwindcss.com/plus/license))。SunUI Pro 授權【建議，需律師審閱】一頁白話寫明：允許 SaaS、客戶網站、內部工具、販售給終端使用者的應用；禁止再散布原始碼、上傳公開 repo、做競爭性 UI kit / 模板 / page builder、用作 AI 元件生成器的訓練或輸出資料集、分享 license key。免費層維持 MIT 並與 Pro 放在不同 repo 與 namespace，避免授權界線模糊；**不要採 Commons Clause**，因為競品用了它，SunUI 不用正好就是差異。

### 產品線與副收入

產品線依序為：免費 registry、Pro 區塊庫、檔期模板、（第二季以後）Figma Kit 與 Playground 畫布。值得特別考慮的是接案服務：Aceternity 某月營收約 US$4 萬來自 Pro、約 US$3 萬來自幫創辦人做網站，**接案約佔四成**【二手，創辦人自述】([Starter Story](https://www.starterstory.com/stories/aceternity-ui))。對個人開發者，元件庫作為作品集帶動高單價接案，是第一年最可靠的現金流，財務預估中不計入，但建議在網站放「客製檔期頁服務」入口。

## 技術路線：registry 是門票，付費驗證與 agent 端轉換才是設計重點

### 公開 registry：先拿到官方索引的位置

shadcn 已從複製貼上演變成通用程式碼散佈協定：2026-11 官方索引共 **539 個 registry**，每個都有 reliability、correctness、installability、hygiene 四項健康分數與 ranking【已驗證】([registries.json](https://ui.shadcn.com/r/registries.json))。執行 `shadcn add` 或 `shadcn search` 時 CLI 會查這份索引並自動寫入使用者的 `components.json`；收錄方式是在 shadcn-ui/ui 的 `apps/v4/registry/directory.json` 開 PR，條件是開源、公開、扁平結構（`registry.json` 與 item 在根目錄）、`files` 不含 `content`，並通過 `pnpm validate:registries`【已驗證】([Registry Index](https://ui.shadcn.com/docs/registry/registry-index))。SunUI 目前的 `/r/<name>.json` 端點已跑通 CountdownBanner 安裝，下一步是確認輸出符合扁平結構，並在正式網域上線後立即提交 `@sunui`。【估算】健康分數很可能會影響 MCP 與搜尋排序，等同「registry SEO」，所以可用率與 schema 正確性要當成產品品質指標監控。

相容性方面要注意兩個時間點：2026-07 起 **Base UI 成為 shadcn 預設**，並支援 React Aria【已驗證】([shadcn changelog](https://ui.shadcn.com/docs/changelog))；npm 版本分布顯示 **React 19 約 75.5%、Next.js 16 約 74.2%、Tailwind 4.x 約 73.5%**【已驗證】([npm versions react](https://api.npmjs.org/versions/react/last-week)、[npm versions next](https://api.npmjs.org/versions/next/last-week))。【建議】新元件 import `motion/react`，peer dependency 相容 framer-motion；需要 primitive 的元件（Select、Dialog 類）避免綁死 Radix，或提供 Base UI 版本。

### 付費 registry 驗證流程

shadcn CLI 原生支援在 `components.json` 的 `registries` 以 namespace 設定 URL 範本加 `headers` 或 `params`，值以 `${VAR}` 從環境變數讀取；伺服器憑證缺失或無效回 401、有效但無權限回 403，CLI 會顯示 JSON body 中的自訂 `message`【已驗證】([shadcn Registry Authentication](https://ui.shadcn.com/docs/registry/authentication))。shadcnblocks 正是用 `@shadcnblocks` namespace 加 Bearer header、後台產生 `sk_live_` 前綴 key 的方式交付【二手】([shadcnblocks blog](https://www.shadcnblocks.com/blog/shadcn-private-registry-access-namespaced-registries))。Polar 的 license key 支援自訂前綴、activation 上限、usage 計數與輪替，validate 端點可公開呼叫【已驗證】([Polar License Keys](https://polar.sh/docs/features/benefits/license-keys))。

【建議架構】使用者設定 `"@sunui-pro": { "url": "https://<網域>/r/pro/{name}.json", "headers": { "Authorization": "Bearer ${SUNUI_LICENSE_KEY}" } }`。Next.js 端點收到 key 後先查 Edge KV / Redis 快取（10 至 60 分鐘），未命中才打 Polar validate，因為 Polar 文件未記載 rate limit；以 key 為單位限流並記錄不同 IP 數量，異常時回 429；Team 方案用 Polar activation 模擬席位，滿額回 403 並在 `message` 附升級連結；退款或濫用時以 Polar webhook 清除快取並撤銷 key；每份回傳的原始碼檔頭註解寫入授權 ID 以追溯外洩。**最關鍵的一行是：未授權時回 401，`message` 寫清楚 Pro 是什麼與購買網址**，讓轉換發生在開發者的終端機或 agent 對話裡，而不是網站上，這是對 Tailwind 教訓的直接回應。Pro 原始碼必須放在私有 repo，官網只顯示預覽。

### AI-ready 的最小可行組合

業界已收斂為四層：llms.txt / llms-full.txt、MCP、agent skill、符合 schema 的 registry metadata；shadcn CLI v4 本身新增 `docs`、`info`、`--diff`，並提供官方 agent skill，目標就是讓 agent 少犯錯【已驗證】([shadcn CLI v4](https://ui.shadcn.com/docs/changelog/2026-03-cli-v4))。由於 shadcn MCP 已能安裝任何 registry，**SunUI 不需要自建安裝用 MCP**【估算】；應投資的是每個 registry item 的 `description` 寫給 agent 看（何時用、props、reduced-motion 行為、搭配哪些 section），以及一個「用 SunUI 組出檔期活動頁」的 agent skill。llms.txt 成本低可以做，但採用率僅約 5.86%，唯一案例在加入後 LLM 引薦 session 只從 75 增到 92，作者本人也認為單獨效果有限【二手】([Search Engine Land](https://searchengineland.com/what-13-months-of-data-reveals-about-llm-traffic-growth-and-conversions-470115))。Open in v0 只吃公開、非 namespace、無 header 認證的 item【已驗證】([Open in v0](https://ui.shadcn.com/docs/registry/open-in-v0))，所以適合做免費版的行銷入口，不能用來發放 Pro。

## 元件路線圖：少而精，每週 3 至 4 個

### 品質標準與節奏

草案的 Definition of Done（單檔為主、少相依、深淺色、鍵盤與 ARIA、reduced-motion、至少 3 個可調參數、測試、5 至 10 秒錄影）全部保留，另外新增兩項：**繁中與英文兩組示範文案都要排版正確**，以及**通過 `shadcn registry validate`**。數量節奏改為每週 3 至 4 個（小型微互動半天、商業區塊 1 至 2 天），把省下的時間給錄影與發文，因為研究一再顯示分發才是決定性因素：同樣是 Tailwind 元件庫，90+ 元件的 Artifact UI 在 TrustMRR 總營收只有 **54 美元**【已驗證】([TrustMRR](https://trustmrr.com/founder/iPritamX))，而 Aceternity 首版只有 **7 個元件**，靠 X 與 Product Hunt 起飛【二手】([Starter Story](https://www.starterstory.com/stories/aceternity-ui))。

### 具體清單【建議】

| 批次 | 時間 | 免費（微互動，MIT） | Pro（商業區塊） | 累計 |
|---|---|---|---|---|
| 第 0 批：既有重構 | 第 1 至 2 週 | CountdownBanner（已完成）、FloatingButton、SocialButton、GradientBackground、Card | FileUpload 進階版、FilterGrid 商品篩選版 | 7 |
| 第 1 批：檔期核心 | 第 2 至 5 週 | 加入購物車飛入回饋、價格數字滾動、複製優惠碼按鈕、愛心收藏爆裂、庫存數字跳動 | 限時折扣 Hero（含倒數）、優惠券領取卡（撕開 / 翻面）、免運門檻進度條、加購推薦抽屜、結帳按鈕（載入、成功、收據滑出）、閃購商品卡（庫存緊張提示） | 18 |
| 第 2 批：轉換區塊 | 第 6 至 8 週 | 3D 傾斜商品卡、磁吸 CTA 按鈕、無限 Logo 跑馬燈 | 定價卡（月 / 年切換、推薦浮起）、方案比較表、評價牆（瀑布流自動捲動）、FAQ 手風琴、電子報訂閱成功動畫 | 26 |
| 第 3 批：活動與 CJK | 第 9 至 13 週 | 繁中直排 / 標點擠壓標題、中文打字機效果、捲動揭露文字、捲動進度條、數字計數器、OTP 輸入、Toast 堆疊、骨架屏組合 | 抽獎轉盤 / 刮刮卡（需加機率透明提示）、會員集點卡、會員方案升級彈窗、滿額贈禮物盒開箱、限量開賣倒數牆、訂單狀態追蹤、購物車抽屜、商品圖庫、節慶活動 Banner 組（雙 11、黑五、農曆新年）、預購登記區塊 | 44 |
| 模板 | 第 7 至 12 週 | 無 | 檔期活動 landing 模板 1 套（倒數、折扣、商品、FAQ、結帳 CTA 串成整頁） | 44 + 1 |
| 第二季 | 第 4 至 6 個月 | 每月約 6 個 | 每月約 6 個 + 第 2、3 套模板（SaaS 定價頁、App 預購頁） | 約 80 + 3 |

免費與 Pro 的比例約 48 比 52（21 比 23）。從草案移除的項目包括 AI UI 一整組（聊天輸入框、串流文字、Agent 步驟、模型選擇器）與通用資料圖表：前者被 shadcn 官方 AI Elements 佔據【已驗證】([shadcn changelog](https://ui.shadcn.com/docs/changelog))，後者 shadcn.io 已有 70 個 charts【已驗證】([shadcn.io](https://www.shadcn.io/pricing))。Playground 畫布維持「有付費用戶再做」，但 bencho 的 Bench 證明「可調參 + 帶參數的安裝指令」會被設計圈接受【已驗證】([bencho Bench](https://www.bencho.dev/bench))，所以 block 頁的 props 調整面板應提前到第 2 批完成。

## 收款與台灣稅務：Polar 主選，所得很可能屬境內來源

### 金流平台比較

| 平台 | 費率 | 台灣個人可行性 | License key | 結論 |
|---|---|---|---|---|
| Polar | Starter 5% + 50¢，非美國卡 +1.5%；出款每月 US$2 + 0.25% + US$0.25，換匯最高 1% | 官方清單明列台灣（Stripe Connect Express），個人 KYC 需實測 | 內建，API 完整 | **主選** |
| Dodo Payments | 4% + 40¢，國際卡 +1.5% | 官方清單第 154 項為台灣，帳戶類型含 Individual | 自稱內建 | **備援** |
| Creem | 3.9% + 40¢ | 官方稱可出款台灣，個人資格未說明 | 未確認 | 觀察 |
| Paddle | 5% + 50¢ | 無公司個人「視情況」，對 UI kit 審核歷來較嚴 | 無內建 | 不建議初期 |
| Lemon Squeezy | 5% + 50¢ | 可申請，但已進入維護狀態 | 有 | **排除** |
| Gumroad | 10% + 50¢ 加卡費 | 未查證 | 有 | 費率過高 |

Polar 費率與台灣出款資格【已驗證】([Polar Fees](https://polar.sh/docs/merchant-of-record/fees)、[Polar Supported Countries](https://polar.sh/docs/merchant-of-record/supported-countries))；Dodo 台灣與個人帳戶【已驗證】([Dodo Accepted Countries](https://docs.dodopayments.com/miscellaneous/accepted-countries-and-territories.md))；其他費率來自 2026-10 的比較文【二手】([DEV Community](https://dev.to/panchei/ten-100-sales-on-7-merchants-of-record-what-actually-reaches-your-bank-oct-2026-53e6))。Lemon Squeezy 官方 2026-01-28 承認團隊專注 Stripe Managed Payments，造成「slower support responses and less frequent product updates」【已驗證】([Lemon Squeezy 2026 Update](https://www.lemonsqueezy.com/blog/2026-update))，而 Managed Payments 的賣家所在地清單未包含台灣【二手】([aliteq](https://aliteq.com/stripe-managed-payments-fees-2026))，這是草案「Polar 或 Lemon Squeezy」被改成「Polar 主選、Lemon Squeezy 排除」的原因。以 US$129、非美國卡估算，Polar Starter 單筆平台費約 US$8.9（約 6.9%）【估算】；各 MoR 每筆差距只有 US$2 至 4，台灣出款可行性與 license 功能比費率重要。Polar Pro 方案（US$20/月，3.8% + 40¢）要月銷約 10 套以上才划算，初期用 Starter 即可【估算】。

**第一週必做的風險排除**：以台灣個人身分實際走完 Polar 的 Stripe Connect Express KYC（不可用 Wise、Payoneer 虛擬帳戶）【二手】([Polar Payout Accounts](https://polar.sh/docs/features/finance/accounts))，研究未找到台灣開發者的實測紀錄；同時申請 Dodo 作備援。Polar 的「GitHub Repository Access」benefit 本次未讀到官方頁，模板交付若要用它需先確認，否則以 webhook 呼叫 GitHub collaborator API 自建。

### 台灣稅務重點（全部需會計師確認）

最容易犯的錯是套用網路上「海外所得 750 萬以下免稅」的說法。財政部規定海外所得全年達 100 萬元且基本所得額超過 750 萬元才需繳基本稅額【已驗證】([財政部](https://www.mof.gov.tw/singlehtml/384fb3077bb349ea973e7fc6f13b6974?cntId=8294024de8c5456383632aa1dba03e7b))，但勞務報酬來源以**勞務提供地**判斷，個人在中華民國境內提供勞務的報酬屬中華民國來源所得【二手】([財政部稅務入口網](https://www.etax.nat.gov.tw/etwmain/tax-info/understanding/tax-q-and-a/national/individual-income-tax/alien-tax-question/taxation-scope/OQ0DQxJ)、[理律法律事務所](https://www.leeandli.com/TW/Newsletters/4174.htm))。SunUI 由作者在台灣開發與維護，**收入很可能應併入當年度綜合所得稅申報**，而非適用海外所得門檻；所得類別是執行業務所得、權利金或其他所得，會影響可扣除費用比例，研究未找到直接函釋。

營業稅方面，自 2025-01-01 起**銷售勞務起徵點為每月 5 萬元**、銷售貨物 10 萬元，網路賣家按當月實際銷售額計算【二手】([工商時報](https://www.ctee.com.tw/news/20241006700318-430104))。授權與程式碼交付較接近勞務，以匯率 1 美元約 32 元新台幣假設，每月約 US$1,560，相當於約 12 套 Pro 個人方案。賣給國外 MoR 能否適用外銷零稅率，個人未登記時無法適用，且實務常有爭議【二手】([理律 Newsletter 5327](https://www.leeandli.com/TW/Newsletters/5327.htm))。台灣買家向 MoR 購買時，外國事業為營業稅納稅義務人【二手】([理律 Newsletter 1630](https://www.leeandli.com/TW/Newsletters/1630.htm))。

【建議，需會計師確認】三階段：每月持續低於起徵點時以個人申報綜所稅並保留所有 MoR 對帳單；開始持續超過每月 5 萬元時諮詢設立行號；年營收達數百萬或要接企業採購時再評估有限公司。初期**不要接綠界、藍新等台幣金流**，因為它們不是 MoR，境內銷售須自行處理統一發票，會把營業稅問題變成立即義務；台灣買家一律走 MoR 刷卡。Founding member 預售可能讓 2026-12 單月越過起徵點，建議在 11 月底前就先預約一次會計師諮詢。

## GTM 與財務預估：分發決定一切，數字要保守看

### 通路優先順序

研究最一致的結論是：**既有受眾與分發能力決定營收，而不是產品本身**。正面極端是 Tailwind UI 2020 年上線約 5 個月近 US$200 萬、ShipFast 約 4 個月 US$52.8 萬，兩者上市前都已有龐大受眾【二手】([Adam Wathan](https://adamwathan.me/tailwindcss-from-side-project-byproduct-to-multi-mullion-dollar-business/))；反面是一位開發者在 Gumroad 上架 5 套 Next.js 模板，數月後 92 次瀏覽、$0 銷售，作者歸因於缺乏分發【二手】([Indie Hackers](https://www.indiehackers.com/post/next-js-templates-months-of-work-0-in-revenue-here-is-what-i-got-wrong-25d7012907))。

依此排出的通路順序如下。**X 短 demo 影片**是動畫元件的天然素材，Aceternity 創辦人自述主要行銷就是 X，發表約四個月後 X 追蹤者長到約 2 萬，Fireship 的一支影片進一步擴散【二手】([Starter Story](https://www.starterstory.com/stories/aceternity-ui))；Emil Kowalski 在課程尚未製作時就在 X 開賣預售，最後超過 1 萬人報名【二手】([emilkowal.ski](https://emilkowal.ski/ui/building-an-animation-course))，這正是 Founding member 預售的參考模式。**shadcn 官方索引**是 2026 年新興的高意圖通路，直接進入 CLI 與 agent 的搜尋路徑。**Product Hunt** 仍能帶來爆發點與社會證明：Magic UI 2 拿到 606 票當日第 1、Untitled UI React 628 票當日第 1，但約 300 票才排到第 4，沒有受眾的小庫多落在 10 名外【二手】([hunted.space Magic UI 2](https://hunted.space/dashboard/magic-ui/launches/magic-ui-2))，所以 PH 要放在已累積 waitlist 之後。**Reddit 與 Show HN** 規則嚴格，r/webdev 只能在 Showoff Saturday 分享，HN 對付費 UI 庫評價兩極【二手】([HN 鏡像](https://frontpage-app.vercel.app/news/43971688))，應以技術分享文（spring 參數、reduced-motion 寫法、CJK 標點擠壓）切入。**電子報贊助**價格明確，This Week in React 第一贊助位一期 1,500 歐元、39,697 訂閱【已驗證】([This Week in React](https://thisweekinreact.com/sponsor))，對初期過貴，先投稿免費收錄。**台灣與華語**：iThome 2025 鐵人賽 902 人參賽【已驗證】([iThome](https://ithelp.ithome.com.tw/2025ironman/event))，2027 年 8 月報名的鐵人賽可做「30 天拆解 SunUI 動畫」；但研究找不到台灣付費意願的任何數據，台灣定位為口碑與信任起點，營收主力是英文市場。

### 財務預估（全部為估算，不是預測）

共同假設：Day 0 為 2026-11-04；匯率 1 美元約 32 元新台幣；平台與出款費合計約 8.5%（Polar Starter 6.9% 加出款與換匯約 1.6%）；不含接案收入；成本每月約 US$30 至 60（網域、Vercel、Redis），不含作者人力。參考上限是 shadcnblocks 已註冊用戶付費比例約 13% 至 15%（以 Product Hunt 留言的 2,000 付費 / 13,000 免費推算【二手】([Product Hunt](https://www.producthunt.com/p/shadcnblocks-2/shadcnblocks-2))），新品牌實際上會更低。

| 情境 | 關鍵假設 | 第 1 至 3 月 | 第 4 至 6 月 | 第 7 至 12 月 | 12 個月總營收 | 12 個月淨額（扣 8.5%） |
|---|---|---|---|---|---|---|
| 保守 | X 追蹤 1 年 < 1,000；PH 排名 10 名外；平均客單 US$110 | 15 筆 | 8 筆 | 13 筆 | 約 US$4,000（約 12.8 萬元） | 約 US$3,620 |
| 基準 | X 追蹤 3,000 至 5,000；PH 前 10；waitlist 1,000；平均客單 US$115 | 50 筆 | 40 筆 | 70 筆 | 約 US$18,400（約 59 萬元） | 約 US$16,800 |
| 樂觀 | 單支影片爆紅或大型帳號轉發；PH 前 5；Team 佔 15%；平均客單 US$125 | 150 筆 | 110 筆 | 190 筆 | 約 US$56,000（約 179 萬元） | 約 US$51,000 |

這三個區間與研究筆記獨立推得的「12 個月累計約 US$5 千至 5 萬」大致吻合，後者同樣明確標註為無直接來源的推估。對照組是：shadcnblocks 年化約 US$70 萬是經過一到兩年以上每月持續更新的結果；Aceternity 上線兩個月 US$8 萬是在已有約 2 萬 X 追蹤者之後【二手】([Starter Story](https://www.starterstory.com/stories/aceternity-ui))。**基準情境在 Founding member 與 PH 發表的月份可能越過營業稅起徵點，其餘月份多半在起徵點之下**；樂觀情境則幾乎每月都會越過，屆時必須處理營業登記。草案的里程碑「第 2 至 3 月月營收 US$1,000、第 4 至 6 月 US$3,000」在本報告的基準情境下屬於偏樂觀，建議改為「90 天累計 50 筆付費、waitlist 1,000」作為判斷是否加碼的門檻。

## 風險與對策

| 風險 | 可能性 / 衝擊 | 對策 |
|---|---|---|
| AI 繞過網站，漏斗消失（Tailwind 模式） | 高 / 高 | 轉換點放進 CLI 401 訊息與 agent skill；registry metadata 寫給 agent；用 X 影片而非文件導流 |
| 動畫類別擁擠（約 90 個動畫 registry），無法被看見 | 高 / 高 | 收窄到電商檔期 + CJK + 無障礙；每個 block 頁標示 reduced-motion 與鍵盤支援，做成可比較的品質主張 |
| 電商檔期需求是假說，沒有量化證據 | 中 / 高 | Founding member 預售當作需求驗證；若 2027-01-11 前少於 20 筆，第二季改回通用 SaaS 轉換區塊 |
| Polar 台灣個人 KYC 不通過 | 中 / 高 | 第 1 週實測；Dodo 同步申請；最後手段才考慮 Stripe Atlas 美國公司（每年至少 US$325 加 Form 5472 申報義務）【二手】([Shareuhack](https://www.shareuhack.com/en/posts/taiwan-indie-dev-global-payments-guide-2026)) |
| 平台改費率（Polar 2026-05-27 才剛調整） | 中 / 低 | 授權驗證邏輯抽象化，不把 Polar API 寫死在 registry 端點裡 |
| 免費層與 Pro 被 fork 或外流 | 高 / 中 | 接受無法完全防止；key 可輪替、異常 IP 偵測、檔頭授權 ID；價值放在持續更新 |
| 純買斷只能靠新客 | 高 / 中 | Team 方案、模板單售、第二季測試年度 All-access；接案作為現金流 |
| Cult UI Pro 轉開源的訊號：純賣區塊可能撐不久 | 中 / 中 | Cult UI 頁面已宣布「Cult Pro is going open source」【已驗證】([Cult UI Pro](https://pro.cult-ui.com))；SunUI 保持低成本結構，一人營運、不雇人 |
| shadcn 生態轉向（Base UI 預設、schema 變動） | 中 / 中 | 每月跑 `registry validate`；primitive 中立設計；追 shadcn changelog |
| 稅務分類錯誤 | 中 / 中 | 首筆收入前諮詢會計師；保留所有對帳單 |
| 個人過勞 | 高 / 高 | 每週 3 至 4 個 block 的上限；第 8 週（年底假期）只做資產與文件 |

## 90 天逐週執行計畫（2026-11-04 至 2027-02-02）

| 週 | 日期 | 產品與技術 | 商業與行銷 | 本週完成標準 |
|---|---|---|---|---|
| 1 | 11/04 至 11/10 | 確認 registry 輸出符合扁平結構；部署正式網域 | 決定品牌與網域；Polar 台灣個人 KYC 實測、同步申請 Dodo；開 X 產品帳號；上線 waitlist 頁 | Polar 可收測試款；waitlist 頁可訂閱 |
| 2 | 11/11 至 11/17 | 重構 4 個既有元件為 registry；`@sunui-pro` 端點原型（Polar 測試模式 + 快取 + 401 訊息） | 提交 `@sunui` 至 shadcn 官方索引；寫授權條款一頁草稿；X 每日 1 支 demo 開始 | 以測試 key 跑通 `npx shadcn add @sunui-pro/...` |
| 3 | 11/18 至 11/24 | 完成第 1 批前 5 個 Pro 檔期區塊；定價頁與結帳 | 預告 Founding member（限 150 名、US$79）；預約會計師諮詢 | 可完成一筆真實購買並安裝 Pro |
| 4 | 11/25 至 12/01 | 修 bug；block 頁加 reduced-motion / 鍵盤標示 | **11/27 黑色星期五開賣 Founding member**；X、Threads、台灣前端社群同步 | 首批付費；記錄轉換來源 |
| 5 | 12/02 至 12/08 | 第 1 批剩餘區塊；完成 18 項 | 訪談 3 至 5 位買家，問用途與缺什麼 | 18 項上線；買家回饋整理 |
| 6 | 12/09 至 12/15 | llms.txt、registry item 的 agent 向描述、SunUI agent skill；免費項目加 Open in v0 | 第一篇技術分享文（reduced-motion 或 spring 參數） | agent 能以自然語言安裝 SunUI |
| 7 | 12/16 至 12/22 | 第 2 批開始；props 調整面板；檔期模板骨架 | Show HN 技術文（非產品公告） | 22 項；調參面板可用 |
| 8 | 12/23 至 12/29 | 年底假期：只做文件、OG 圖、每元件 SEO 頁、繁中與英文說明 | 準備 PH 素材（影片、圖、首則留言）；聯繫 hunter | PH 素材完成 |
| 9 | 12/30 至 01/05 | 第 2 批完成，26 項 | 01/02（週六）Reddit Showoff Saturday；寄 waitlist 預告 PH | waitlist 目標 700 |
| 10 | 01/06 至 01/12 | 檔期 landing 模板完成；第 3 批 CJK 元件起頭 | **01/12（週二）Product Hunt 發表**；Founding member 於 01/11 截止，切換 US$129 | PH 前 10 名；付費累計 40 |
| 11 | 01/13 至 01/19 | 第 3 批 5 項 | 投稿 This Week in React 等電子報免費收錄；iThome 中文拆解文 | 31 項 + 1 模板 |
| 12 | 01/20 至 01/26 | 第 3 批 6 項 | 檢視數據：來源、轉換、退款；決定是否測試年度 All-access 與 PPP | 37 項；數據報告 |
| 13 | 01/27 至 02/02 | 第 3 批收尾至 44 項；registry 健康度檢查 | 90 天回顧；決定第二季主軸（續攻檔期或轉通用轉換區塊）；若越過起徵點，與會計師確認登記 | 判斷門檻：付費 50 筆、waitlist 1,000 |

## 需要作者決策的事項

以下按急迫程度排列，前四項在第 1 週就要決定，否則 Founding member 無法在黑色星期五開賣。

| # | 決策 | 選項 | 本報告建議 |
|---|---|---|---|
| 1 | 品牌與網域 | 沿用 SunUI；網域 sunui.dev、sunui.design 或其他 | 沿用 SunUI，第 1 週買下網域；registry URL 一旦公開就不宜再換 |
| 2 | 定位收窄 | 電商檔期專精，或維持草案的泛商業區塊 | 電商檔期 + CJK + 無障礙，並以預售結果驗證 |
| 3 | 價格 | Founding US$79 / 個人 US$129 / Team 5 人 US$349，或其他 | 採用建議價；Founding 名額 150 與截止日 01/11 需確認 |
| 4 | 收款平台 | Polar 主選、Dodo 備援 | 同意後立即 KYC 實測 |
| 5 | 是否提供年度方案 | 只賣買斷，或第二季測試年度 All-access | 先只賣買斷，第 12 週依數據決定 |
| 6 | 接案服務 | 是否在網站開放「客製檔期頁」 | 開放，作為第一年現金流 |
| 7 | 舊 npm 套件 | 凍結只維護，README 指向新站 | 凍結 |
| 8 | primitive 支援 | 只支援 Radix，或同時支援 Base UI | 新元件 primitive 中立，必要時出 Base UI 版 |
| 9 | 開源專案使用 Pro | 禁止、或允許編譯後產物但不得公開原始檔 | 允許編譯後產物，原始檔不得公開 |
| 10 | 稅務 | 何時諮詢會計師、何時設行號 | 11 月底前首次諮詢；持續超過每月 5 萬元再談行號 |
| 11 | 語言優先序 | 英文為主繁中為輔，或雙語同等 | 英文為主，繁中做 SEO 與社群口碑 |

## Conclusion

這份研究真正改變的，是「付費價值在哪裡被看見」這個問題的答案。Tailwind 的教訓不是 UI kit 沒人要，而是人類不再經過網站；同一時間，shadcn CLI 與 MCP 讓 agent 成為最大的安裝者。對 SunUI 這種沒有既有受眾的個人產品，這反而是一個公平的起跑點：在官方索引裡，一個健康分數高、描述寫給 agent 看、未授權時會在終端機裡清楚說明 Pro 是什麼的 registry，不需要先有 2 萬名 X 追蹤者才被看見。漏斗設計應該從「網站導購」轉成「registry 導購」，網站與 X 影片負責品牌與信任，終端機與 agent 對話負責成交。

第二個新認識是：在擁擠市場裡，最便宜的差異化往往不是技術，而是誠實。授權一頁講清楚、不灌水原價、明白標示 reduced-motion 與鍵盤支援、財務預期不誇大，這些競品普遍沒做好的事情，對一個台灣個人開發者而言成本最低，卻最能建立長期信任。電商檔期定位目前仍是假說，Founding member 預售就是最便宜的驗證實驗；90 天後若 50 筆付費的門檻沒有達到，該修正的是定位，而不是加做更多元件。
