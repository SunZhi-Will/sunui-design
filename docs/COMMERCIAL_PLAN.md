# SunUI 商業化與元件擴充規劃

> 版本：2026-11-04 初稿（Log，尚待決策）
> **已被取代**：上網查證後的完整規劃見 [reports/SunUI 商業化深度規劃.md](../reports/SunUI%20商業化深度規劃.md)。定價、收款平台、元件數量與路線圖都已依研究修正，以該報告為準。
> 參考對象：[bencho.dev](https://bencho.dev/)

---

## 1. 現況盤點

| 面向 | 現況 | 問題 |
|------|------|------|
| 元件數量 | 8 個（Card、FileUpload、FilterGrid、FloatingButton、GradientBackground、SidePanel、SocialButton、CountdownBanner） | 數量太少，沒辦法形成「逛型錄」的體驗 |
| 分發方式 | 每個元件各自是一個 npm 套件（`@sunui-design/*`），外加 `@sunui-design/react` 整合包，版本 0.0.55 | 一個元件一個套件，維護和發版成本很高；使用者拿不到原始碼，客製化困難 |
| 展示 | Storybook 靜態站部署在 Vercel | 不利 SEO，不像產品，沒有轉換漏斗 |
| 授權 | MIT 全開源 | 沒有付費層 |
| 技術 | React 19、Tailwind v4、framer-motion 12、Lerna | 堪用，但套件拆分方式偏舊 |
| 收入 | 只有 GitHub Sponsors | 幾乎是零 |

**結論**：程式碼的資產是有的，但「產品形態」還停在「開源套件」。商業化要先改的是**形態**，不是先寫更多元件。

---

## 2. bencho.dev 拆解：該學什麼

我觀察到 bencho 的做法（只看公開頁面，看不到它的收費方式）：

1. **以「互動手勢」分類，而不是以「元件種類」分類**：Press、Hover、Drag、Loading/Loop、Type、Swipe、Select、Slide。使用者是用「想要什麼感覺」來逛，不是「我要一個 Button」。
2. **數量就是護城河**：目前約 158 個 block，每個都很小、很精緻，而且是一個完整的「微互動」。
3. **一個 block 一個頁面**：網址是 `/blocks/confetti`，標題寫法是「Confetti Burst Button with Paper Physics, React Component」，等於每個元件都是一個 SEO 入口。
4. **周邊產品線**：Blocks、Sounds（音效）、Finds（策展精選）、Bench（無限畫布，可以擺放並調整 block，還會記住狀態）。
5. **極簡行銷**：首頁就是型錄本身，沒有花俏的 landing page，作品自己說話。

**不要學的**：不要做出跟它一模一樣的 block 清單或外觀。SunUI 要做出自己的辨識度（見第 3 節）。

---

## 3. 定位

**一句話**：SunUI 是「可以直接上線的動態互動元件與區塊」，免費元件開源，Pro 版提供完整的商業頁面區塊與模板。

**跟 bencho 的差異化**（三選一當主軸，建議 A）：

- **A. 「微互動 + 可上線的商業區塊」**：bencho 偏向單一微互動，SunUI 往上一層，把微互動組成可直接用在電商、SaaS、活動頁的區塊（定價卡、倒數活動 banner、結帳按鈕、方案比較、評價牆）。現有的 CountdownBanner、Card、FileUpload 剛好就是這條路線的起點。
- B. 「AI 產品 UI」：聊天輸入框、串流文字、Agent 步驟、Token 計量條等。市場正熱，但競品也多。
- C. 「中文 / 亞洲市場」：繁中文件、中文字體排版最佳化、在地支付。可作為 A 的附加優勢，而非主軸。

**目標使用者**：獨立開發者、接案者與小型代理商（要快速做出有質感的產品頁）、新創前端工程師。

---

## 4. 商業模式

### 4.1 Open-core 架構

| 層級 | 內容 | 價格（建議） | 授權 |
|------|------|------|------|
| **Free** | 約 40% 的 block（單一微互動為主）、基礎 tokens | 免費 | MIT |
| **Pro 個人** | 全部 block + 全部商業區塊 + 未來更新 | 一次買斷 US$99（早鳥 US$69） | 商用授權，1 人，不限專案數 |
| **Pro 團隊** | 同上，最多 10 人 | 一次買斷 US$299 | 商用授權，團隊 |
| **模板** | 整頁 Landing / SaaS / 活動頁 Next.js 模板 | 單買 US$39 至 79，Pro 會員 5 折或含在 All-access | 商用授權 |
| **Figma Kit**（第二階段） | 對應程式碼的設計檔 | US$49 或含在 All-access | 商用授權 |

為什麼選**買斷**而不是月訂閱：UI 元件庫這個市場的使用者習慣是一次買斷（Tailwind Plus、許多同類產品都是），轉換門檻低。之後可以用「年度更新費」或「All-access 年費」追加收入。

### 4.2 收款與發貨

- 收款平台：**Lemon Squeezy** 或 **Polar**（都是 Merchant of Record，會幫你處理全球稅務；台灣個人也能收款）。建議 Polar，對開發者產品和 GitHub 整合比較友善。
- 發貨方式：購買後給 **License Key**，用 key 解鎖：
  1. 網站上 Pro block 的原始碼顯示與複製；
  2. CLI 安裝 Pro block（見 5.2）；
  3. 模板則是邀請進私有 GitHub repo 或下載 zip。

### 4.3 其他收入（低優先）

- GitHub Sponsors（已有）、公司 Logo 贊助位。
- 接案引流：網站放「客製化服務」頁，Pro 用戶優先。

---

## 5. 產品與技術架構重整

### 5.1 從「每個元件一個 npm 套件」改為「原始碼型錄 + Registry」

目前每個元件各自一個 npm 套件的做法，建議**凍結**，改用 shadcn 生態的 **Registry 模式**：使用者用 CLI 把原始碼直接拷進自己的專案，自己擁有、自己改。

```bash
npx shadcn@latest add https://sunui.dev/r/confetti-button.json
```

好處：

- 不用再維護十幾個 npm 套件的版本與發布流程（Lerna 可以退場）。
- 直接相容 shadcn/ui 生態，使用者門檻最低。
- Pro block 可以透過「帶 License Key 的 registry 端點」發貨。

現有的 `@sunui-design/react` npm 套件：**保留但只維護不擴充**，在 README 指向新網站，避免破壞既有使用者。

### 5.2 Repo 結構（建議）

```
sunui-design/                 (公開 repo, MIT)
├─ apps/
│  └─ web/                    Next.js 官網：型錄、block 頁、定價、文件、帳號
├─ registry/
│  ├─ free/                   免費 block 原始碼（每個 block 一個資料夾）
│  └─ registry.json           shadcn registry 定義
├─ packages/
│  ├─ tokens/                 色彩、圓角、動態曲線等 design tokens
│  └─ legacy/                 舊的 @sunui-design/* 套件（凍結）
└─ docs/

sunui-pro/                    (私有 repo)
├─ registry/pro/              Pro block 原始碼
└─ templates/                 整頁模板
```

**重點**：Pro 原始碼絕對不能放在公開 repo。官網建置時從私有 repo 拉 Pro 原始碼（Vercel 支援私有 Git 子模組或 build 時以 token 拉取），預覽可以給大家看，原始碼只在驗證 License 後回傳。

### 5.3 官網功能（對標 bencho，再加商業轉換）

1. **首頁 = 型錄**：依互動分類篩選（Press / Hover / Drag / Scroll / Type / Loading / Feedback / Section），每張卡片是**活的預覽**，滑過就會動。
2. **Block 頁 `/blocks/[slug]`**：
   - 大型互動預覽 + 深淺色切換 + 手機寬度切換
   - **Props 調整面板**（調顏色、速度、彈性，即時預覽，這是比 bencho 多走一步的地方）
   - 安裝指令 / 複製原始碼（Pro 顯示鎖頭與購買按鈕）
   - 相依套件、無障礙說明、`prefers-reduced-motion` 支援說明
   - 相關 block 推薦
   - SEO：獨立 title、description、OG 圖（自動產生）
3. **定價頁**、**帳號頁**（輸入 / 管理 License Key）。
4. **更新日誌頁**：每週新 block 都在這裡，也是社群貼文素材。
5. 第二階段：**Playground 畫布**（把多個 block 擺在一起組合成頁面，再匯出程式碼）。這是差異化最強的功能，但工程量大，等有付費用戶再做。

### 5.4 每個 block 的品質標準（Definition of Done）

- [ ] 單一檔案為主，相依只用 `motion`（framer-motion）、`clsx`、`tailwind-merge`
- [ ] Tailwind v4 + CSS 變數 tokens，深淺色都正確
- [ ] 完整鍵盤操作與 ARIA，支援 `prefers-reduced-motion`
- [ ] 檔案頂端 `"use client"`，可在 Next.js App Router 直接用
- [ ] 有 props 型別與預設值，至少 3 個可調參數
- [ ] 一個 Jest 測試（渲染 + 互動）
- [ ] 一段 5 至 10 秒的錄影（給社群行銷用）
- [ ] 原創設計，不複製任何現有產品的 block

---

## 6. 元件擴充路線圖

數量目標：**上線 40 個（免費 16 / Pro 24）→ 90 天 80 個 → 半年 150 個**。
節奏：每週 4 至 6 個 block。小 block 半天，商業區塊 1 至 2 天。

### 6.1 第一批（上線用，40 個）

**現有 8 個重構成 registry 格式**：CountdownBanner、Card、FileUpload、FilterGrid、FloatingButton、GradientBackground、SidePanel、SocialButton

**Press（按下）**
- 結帳按鈕（載入中 → 成功打勾 → 收據滑出）
- 長按確認按鈕（按住填滿才觸發，用於刪除）
- 按讚爆裂（愛心粒子）
- 複製按鈕（複製後圖示變形）
- 開關切換（帶彈性與日夜主題動畫）

**Hover（滑過）**
- 光暈追蹤卡片（滑鼠位置光暈）
- 3D 傾斜商品卡
- 磁吸按鈕
- 圖片放大鏡
- 連結底線流動

**Type（輸入）**
- OTP 驗證碼輸入（自動跳格、貼上分配）
- 密碼強度條
- 標籤輸入（Enter 新增、Backspace 刪除）
- 搜尋框（展開 + 建議清單）

**Loading / Feedback（等待與回饋）**
- 骨架屏組合
- 進度環（帶數字滾動）
- Toast 通知堆疊
- 數字滾動計數器
- 空狀態插圖區塊

**Scroll（捲動）**
- 捲動進度條
- 捲動揭露文字
- 無限跑馬燈（Logo 牆）

**Section（商業區塊，Pro 主力）**
- 定價卡（月 / 年切換、推薦方案浮起）
- 方案比較表
- FAQ 手風琴
- 評價牆（瀑布流 + 自動捲動）
- Hero 區塊（漸層 + 打字效果）
- CTA 橫幅
- 功能 Bento Grid
- 電子報訂閱框（送出後動畫）

### 6.2 第二批（第 2 至 3 個月，+40）

- **Drag**：排序清單、拖拉上傳進階版、滑動解鎖、看板卡片、圖片前後對比滑桿
- **Swipe / Select**：滑卡選擇、日期範圍選擇器、時間刻度選擇器、多選晶片
- **Data**：迷你走勢圖、甜甜圈圖、KPI 卡、熱力日曆
- **AI UI**：聊天輸入框（附件 + 指令）、串流文字、思考中指示器、Agent 步驟時間軸、模型選擇器
- **Commerce**：購物車抽屜、商品圖庫、數量步進器、優惠碼輸入、訂單狀態追蹤
- **Navigation**：浮動 Dock、指令面板（Cmd+K）、分頁指示條動畫、麵包屑

### 6.3 第三批（第 4 至 6 個月）

- 整頁模板 4 套：SaaS 產品頁、活動 / 倒數頁、個人作品集、App 下載頁
- Figma Kit
- Playground 畫布

---

## 7. 成長策略

1. **每個 block 都是一則社群貼文**：5 至 10 秒錄影發到 X、Threads、LinkedIn，附 block 頁連結。這是 bencho 類產品最主要的流量來源。
2. **SEO**：每個 block 頁都是一個長尾關鍵字（例如「React OTP input component」「Tailwind pricing card animation」）。
3. **上線活動**：Product Hunt、Hacker News「Show HN」、Reddit r/reactjs、r/webdev、台灣的 Facebook 前端社團與 Threads。
4. **電子報**：網站放訂閱框，每週寄「本週新 block」。早鳥價只給訂閱者。
5. **免費元件是漏斗**：免費 block 頁底部放「同系列 Pro 區塊」推薦。

---

## 8. 里程碑

| 時間 | 目標 | 衡量指標 |
|------|------|------|
| 第 1 至 2 週 | Repo 重整、官網骨架（型錄 + block 頁）、registry 跑通 | `npx shadcn add` 可安裝第一個 block |
| 第 3 至 4 週 | 40 個 block、Polar 收款、License 驗證、定價頁 | 可以完成一筆測試購買 |
| 第 5 週 | 公開上線 + Product Hunt | 訂閱者 300、首批付費 10 筆 |
| 第 2 至 3 月 | 80 個 block、2 套模板 | 月營收 US$1,000 |
| 第 4 至 6 月 | 150 個 block、Figma Kit、Playground | 月營收 US$3,000 |

（營收數字是設定目標用的假設，不是預測。）

---

## 9. 風險

| 風險 | 對策 |
|------|------|
| 與 bencho 等免費型錄競爭，付費意願低 | Pro 價值放在「可上線的商業區塊與模板」，而非單一微互動 |
| Pro 原始碼外流 | 外流無法完全防止；用授權條款 + 持續更新維持價值，不要在 DRM 上花時間 |
| 一人維護負擔 | 每個 block 嚴守單檔、少相依；凍結舊 npm 套件 |
| 舊 MIT 套件使用者 | 舊套件繼續可用，README 說明遷移方式 |
| 網域與品牌 | 盡早買下網域（例如 sunui.dev），統一品牌名 |

---

## 10. 待你決定的事

1. **差異化主軸**：A（商業區塊）、B（AI UI）或 C（中文市場）？建議 A，C 作為附加。
2. **網域與品牌名**：是否沿用「SunUI」？網域要用哪個？
3. **收款平台**：Polar 或 Lemon Squeezy？
4. **舊 npm 套件**：同意凍結並改走 registry 嗎？
5. **定價**：US$99 / US$299 買斷是否可以，還是想先以台幣、較低價測試市場？

決定後的第一步：建立 `apps/web` 官網骨架與 registry，把 CountdownBanner 轉成第一個可用 `npx shadcn add` 安裝的 block，驗證整條路徑。
