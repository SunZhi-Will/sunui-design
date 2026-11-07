# React Bits 參考分析（2026-11-08）

來源：https://reactbits.dev （免費）與 https://pro.reactbits.dev （付費），2026-11-08 實際瀏覽。只取概念與市場訊號，不抄程式碼、CSS 或文案。

## 結論先講

1. **React Bits Pro 是 SunUI 最直接的對手，而且已經長得跟我們的計畫幾乎一樣。** 買斷 $129 / $249 / $349 三級、Polar 結帳、MCP server、Agent Kit（給 Claude Code 與 Cursor 的 skill、prompt、recipe），連「為 AI agent 結構化」的話術都一樣【已驗證】。SunUI 的 $79 / $129 / $349 定價與「AI 友善」不再是差異，只是入場券。
2. **之前報告說「沒有人專攻電商」需要修正。** React Bits Pro 現在有 11 個 Ecommerce blocks（購物袋含免運進度、可購買的編輯型 lookbook、快速加入尺寸的商品格、規格表商品頁、四款比較、售完通知商品頁⋯）【已驗證】。數量少、偏 SaaS 審美、沒有檔期與優惠邏輯，但「電商」這個詞已經被占了一角。`reports/SunUI 商業化深度規劃.md` 第 49 行的說法要改成「沒有人專攻**電商檔期與優惠互動**」。
3. **它的免費層是視覺特效的大宗商品**：背景 63、文字 33、動畫 38、元件 48、微互動 35，共約 217 個【已驗證】。大多是 WebGL、光暈、漸層、液態玻璃，正好全是 DESIGN.md 禁止的東西。這再次證明 option C 是對的：特效拿來收費沒有說服力，React Bits 也把它們放免費當流量。
4. **真正值得學的是 Micro 分類（35 個）。** 這是它 2026 年新增的方向：撕票根、按住確認、滑動確認、OTP 彈入、刪除列碎紙機、下滑關閉的 toast、帶 undo 引信的按鈕。這些是「有物理意義的單一互動」，跟 SunUI 的紙感語言（撕、蓋、折）最接近，也是它目前最強的一塊。
5. **據此實作了三個 Pro 場景**（見第 5 節）：`shoppable-lookbook`、`product-finder`、`restock-notify`。三個都對應 React Bits Pro 電商 blocks 有的題目，但用 SunUI 的方式做：有商業邏輯（整套折扣、符合理由、每個尺寸各自登記）、紙與墨、結果用 Stamp。免費型錄維持凍結。

## 1. 規模與結構

| 層 | 分類 | 數量 |
|---|---|---|
| 免費（MIT + Commons Clause） | Text Animations | 33 |
| | Animations（游標、hover、捲動） | 38 |
| | Components（輪播、選單、卡片） | 48 |
| | Micro（微互動） | 35 |
| | Backgrounds | 63 |
| Pro Starter $129 | 230 個動畫元件 | 230 |
| Pro $249 | 加 300 個頁面 blocks（22 類）、300 個 App UI blocks（38 類）、Agent Kit、Landing Builder | 600+ |
| Ultimate $349 | 加 15 個整頁模板（單買 $49） | 15 |

首頁宣稱「865 assets」。Pro 的頁面 blocks 22 類：hero 34、bento 42、stats 18、pricing 15、ecommerce 11、faq 9⋯；App UI 38 類以 AI 產品為主（AI chat、prompt input、agent activity、tool calls、agent approval、agent plan、AI usage）。

**讀法**：React Bits Pro 的主軸是「AI SaaS 的落地頁與後台」。電商只是 22 類裡的一類，沒有檔期、優惠券、集點、限時活動。

## 2. 跟 SunUI 重疊的地方

| React Bits | SunUI 對應 | 判斷 |
|---|---|---|
| Ecommerce-11 購物袋含免運進度 | Pro `cart-drawer`、`free-shipping-progress` | 已有，SunUI 更深 |
| Ecommerce-9 商品格快速加入尺寸 | Pro `product-filter-grid`、免費 `variant-picker` | 已有 |
| Ecommerce-10 可購買的 lookbook | 免費 `hotspots`（只有點位，沒有購買） | **缺口 → 做了 `shoppable-lookbook`** |
| Ecommerce-5 四款比較「Which one fits you?」 | Pro `plan-comparison`（方案，不是實體商品） | **缺口 → 做了 `product-finder`** |
| Ecommerce-4 售完商品頁 notify me | 免費 `low-stock-indicator`、Pro `drop-release-hero` | **缺口 → 做了 `restock-notify`** |
| Micro tear-ticket | Pro `peel-sticker-coupon`、`scratch-card`、`fold-invite-card` | 已有三種揭露手勢，不再加 |
| Micro hold-button、slide-commit | 免費 `confirm-button` | 已有 |
| Micro code-slots | 免費 `otp-input`、`redeem-key-input` | 已有 |
| Micro swipe-toast、fuse-button（undo 引信） | 免費 `toast-stack` | 可在既有元件加 undo 倒數，不開新 block |
| Micro peek-rating、pulse-heart | 免費 `star-rating`、`favorite-button` | 已有 |
| Components card-swap、bounce-cards、scroll-stack | 免費 `card-effects`、`scroll-effects` | 已有 |
| Animations sticker-peel | Pro `sticker-board`、`peel-sticker-coupon` | 已有 |

## 3. React Bits 做得好、值得借的做法

1. **一個元件一句話描述行為**，而且寫物理：「perforated stub tears off by hand, fibre by fibre」「liquid fill rises while pressed and snaps back if you let go」。描述本身就是規格，也是 SEO 與 agent 搜尋的語料。SunUI 的 `meta.usage` 已經有類似結構，`description` 可以學它把**手勢與回饋**寫在第一句。
2. **Micro 是獨立分類**。把小互動從「元件」拆出來，讓人一眼知道「這是一顆按鈕的手感」，而不是一整塊版面。SunUI 的免費 paper 系列其實大部分是 micro（`stamp`、`copy-code-button`、`favorite-button`），可以考慮在型錄加一個 micro 篩選（不新增元件，只是分類）。
3. **工具頁**：Background Studio、Texture Lab、Shape Magic、Sound Lab。這是免費層的第二個流量入口，讓人「玩」而不是「看」。SunUI 的 `/docs/motion` 字典是同一個思路，但沒有可調的 playground。上線後可考慮做一個「優惠券產生器」之類跟電商有關的工具頁，比特效 playground 更貼近買家。
4. **每個 Pro block 都有 Live Preview，且文字可讀**：電商 blocks 頁面的預覽是真的 DOM，抓得到「Free express shipping unlocked」這類文案。對 SEO 和 agent 都友善。SunUI 的 Pro 展示版（`preview.tsx`）走的是同一條路。
5. **模板單賣 $49**：Ultimate 之外每個模板可以單買。SunUI 的季節包（農曆新年）可以用同樣的「單買或全包」雙軌。

## 4. 不學的部分

- 免費層的 WebGL 背景、液態玻璃、光暈游標、漸層文字：全部違反 DESIGN.md（無漸層、光暈、毛玻璃、常駐循環）。
- App UI 的 AI agent 介面（tool calls、agent plan）：不是 SunUI 的買家（接案做活動頁的 freelancer 與小代理商）。
- 860+ 的數量策略：SunUI 走「少而有商業邏輯」，不跟它比量（見 `reports/免費與付費切分規劃-2026-11-05.md`）。

## 5. 這次實作的三個 Pro 場景

四項測試（`reports/免費與付費切分規劃-2026-11-05.md`）的判斷：

| block | 可替代性 | 製作時間 | 離營收距離 | 展示價值 |
|---|---|---|---|---|
| `shoppable-lookbook` | Magic UI、Aceternity 沒有；React Bits 有一個但沒有整套折扣與尺寸驗證 | 中 | 近：檔期主視覺常用「整套帶走」 | 高：圖釘與清單連動 |
| `product-finder` | 免費層都沒有；React Bits 只有靜態四欄比較 | 中 | 近：降低「選哪個」的猶豫 | 中高：卡片依符合度滑動重排 |
| `restock-notify` | 免費層多半只有 disabled 的 Sold out | 低 | 最近：直接收集補貨名單 | 中：同一個動作區在三種狀態間變形 |

### shoppable-lookbook

- 每套穿搭：4:5 圖、編號圖釘、右側單品清單。**圖釘和清單是同一份選取**：hover 圖釘清單那列亮起，點圖釘就勾選或取消。
- 單品可要求尺寸；缺尺寸就按加入時，那一列抖一下、外框轉紅，按鈕文字直接說「請選羊毛綁帶大衣的尺寸」。
- 全選套用整套折扣，底下那行從「整套帶走省 10%」變成「整套帶走：省下 US$58.40」。
- 分頁換造型時圖框不動、清單高度用 gentle 補，每套各自記住勾選與尺寸。結果是按鈕原位的 Stamp。

### product-finder

- 兩到四題單選，回答後商品依符合題數重排（framer `layout`，FLIP）。同分維持原順序，不會無故洗牌。
- 每張卡：墨色小刻度表示符合幾題，文字寫出「適合：一家人和貝果和其他」「不適合：一家人」（用 `Intl.ListFormat`，中日文用全形冒號）。
- 只有唯一領先者才標「最適合」並拿到主按鈕；一題都不符的變淡但不消失，仍可比較。這條遵守 DESIGN-product 的「把為什麼寫出來」與「誠實」。

### restock-notify

- 有貨尺寸：加入購物車，庫存低於 `lowStockAt` 才顯示剩幾件。
- 售完尺寸：刪除線；選到時同一個動作區變成 email 欄 + 到貨通知我，知道補貨日才顯示預計日期（不知道就不寫，不猜）。
- 登記後：Stamp「已登記」、遮罩信箱、排第幾位（handler 有回傳才顯示），並提議「L 到貨也通知我」。每個尺寸記住是否登記（chip 角落一個小點），切回來看到結果而不是又一張表單。

三個都附 `preview.tsx` 展示版（寫死資料、沒有 labels 覆寫與型別匯出），型錄排序已加進 `lib/catalog-order.ts`：前兩個放 B 組，`restock-notify` 放 C 組，近親是 `variant-picker`、`low-stock-indicator`。

## 5b. 第二批：再加三個 Pro 場景

| block | 從 React Bits 借的概念 | SunUI 的做法 |
|---|---|---|
| `size-finder` | Ecommerce-1 的版型切換 | 身高、體重、版型三個輸入推動捲尺上的指針；指針是連續位置，靠近格線就寫「介於 M 和 L 之間，依版型建議 L」；`runsLarge` 處理偏大偏小的款式並寫出來 |
| `pickup-ticket` | Micro tear-ticket | 用在「門市取貨、活動入場」這個電商情境：沿打孔線從左往右撕，撕開不會癒合，過 60% 自動撕完掉落，原位出現有日期的 Stamp；鍵盤有「標記為已取貨」 |
| `holiday-cutoff` | 無（React Bits 沒有檔期元件） | 每種寄送方式各自的最後下單時間與即時倒數；選中的方式在眼前截止時，自動改選下一個來得及的並寫出原因；全部截止時誠實說趕不上，接 fallback（例如電子禮物卡） |

`holiday-cutoff` 直接服務季節包（聖誕、農曆新年），是三個裡離營收最近的。倒數只在分頁可見時走，符合 DESIGN.md 的倒數例外。

## 5c. 第三批：從 React Bits Pro 的 App UI 與頁面 blocks 找電商缺口

再往下看了 React Bits Pro 的 pricing（15）、CTA（14）、waitlist（6）、social proof（16）、stats（18）頁面 blocks，以及 billing（8）、paywall（7）、feedback（6）、onboarding（7）App UI【已驗證】。兩個觀察：

1. **它開始往電商靠**：stats-18 是「以黑色星期五為高峰的每日結帳流量」山脊圖，ecommerce 從 0 長到 11 個。SunUI 的電商檔期定位要在上線前站穩，不然會被量淹過去。
2. **它的 App UI 是 SaaS 後台語彙**（proration、seat gate、metered reads）。同一個需求換到 DTC 電商，就是訂閱制商品管理、數量折扣、到貨後評價、排隊名單。這四個 SunUI 都沒有。

| block | React Bits 的對應 | SunUI 的做法與差異 |
|---|---|---|
| `subscription-manager` | billing-5 改方案與按比例計價 | 咖啡豆、寵物食品這類定期便：下次到貨日與金額是錨點；接下來四批像一排票根，點一張就跳過；換口味、週期、數量；取消前的挽留優惠和「仍要取消」一樣顯眼，優惠只折下一批 |
| `volume-tiers` | pricing-14 方案加購開關 | 買越多越便宜：級距卡、數量步進器、外框跟著級距滑動；差兩件以內才推一把，而且把算式寫出來 |
| `review-request` | feedback-3 星等加理由 | 理由依星等換整組；回饋碼**不管幾顆星都給**，避免變成「好評換折扣」（FTC 與歐盟對誘因評價的規定）；低分有協助連結 |
| `referral-queue` | waitlist-4 即時排隊人數 | 限量發售的排隊名單：大號碼、分享連結、從加入位置到第 1 名的軌道與門檻；推薦數由伺服器帶入，不在前端假裝移動 |

這批四個都把「誠實」寫進元件行為，而不只是文件：取消按鈕不藏、推一把只在真的差幾件時出現、回饋不綁好評、排隊名次不在前端造假。這是跟 React Bits 和一般 Shopify 外掛最明顯的差別，也可以寫進定價頁。

## 6. 後續建議（不在這次範圍）

- 修正 `reports/SunUI 商業化深度規劃.md` 對「沒有人做電商」的說法（第 49 行）。
- 型錄加 micro 篩選，把既有的小互動歸類，不新增元件。
- `toast-stack` 加 undo 倒數引信（React Bits 的 fuse-button / swipe-toast 概念），屬於既有免費元件的改善，不違反凍結。
- 上線前的定價頁要正面回答「跟 React Bits Pro 差在哪」：電商檔期與優惠邏輯、紙感一致的設計語言、四語系文案。
