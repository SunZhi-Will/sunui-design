# Motion Prompt 參考分析

日期：2026-11-05
來源：https://showheyohtaki.github.io/motion-prompt/ （GitHub `showheyohtaki/motion-prompt`，MIT，© 2026 Shohei Ohtaki）

## 1. 這個站是什麼

一本「給 AI 下指令用的名詞辭典」。192 個名稱分成 8 包，每個名稱附一段 Canvas 2D 的循環示範、一份文字規格（尺寸、時間、緩動公式）和「什麼時候用」。使用方式是複製提示詞給 AI，或裝成 skill 後在畫廊裡挑選、送給 AI。

| 包 | 編號 | 內容 | 跟 SunUI 的關係 |
|---|---|---|---|
| motion / motion2 | 001 至 024、121 至 144 | 動態設計手法（Pop-in、Stagger、Overshoot、Glitch…） | 文字與進場效果，另一個 session 正在做 `text-effects`、`animate-presets` |
| camera / camera2 | 025 至 048、169 至 192 | 運鏡與剪接（Dolly zoom、J-cut…） | 影片語彙，不是 UI 元件 |
| photo | 097 至 120 | 攝影光線與調色 | 影像風格，不是 UI 元件 |
| ui | 049 至 072 | UI 元件名稱 | **主要參考對象** |
| lp / lp2 | 073 至 096、145 至 168 | 著陸頁與網頁效果 | **主要參考對象** |

### 值得學的結構

1. **名稱優先**：每個條目有英文名、日文名、標籤（tags）、一句話描述。這正是 SunUI `meta.usage.aliases` 想做的事：讓代理人用使用者說的話找到元件。
2. **規格可驗證**：例如 #084 磁吸按鈕寫明「吸引範圍半徑 110px、位移 = 游標差 × 0.35、每幀追 18%、離開後 1.1s elastic 回位」。數字讓 AI 能照做，也讓人能檢查。
3. **畫面只取決於時間**：示範是純函式 `(ctx, w, h, t)`，可逐幀輸出成影片。SunUI 的預覽不需要這個，但「示範可重播、不靠隨機」的精神一致。
4. **「什麼時候用」一句話**：對應 SunUI 的 `whenToUse`。

授權是 MIT，但示範程式是 Canvas 繪圖，不是 React 元件，所以這次只參考**名稱、互動規格與使用時機**，元件全部重新以 framer-motion + Tailwind 實作，不搬程式碼。

## 2. UI 與網頁效果 72 項逐一對照

標記：✅ SunUI 已有　🆕 本次新增　🔄 其他 session 進行中　⛔ 違反 DESIGN.md 不做　➖ 不適合做成 block

### UI 元件（049 至 072）

| # | 名稱 | 判斷 | 對應 |
|---|---|---|---|
| 049 | Modal dialog | 🆕 | `dialog-sheet`（center 模式） |
| 050 | Drawer | ✅ | `side-panel` |
| 051 | Bottom sheet | 🆕 | `dialog-sheet`（sheet 模式，拖曳把手關閉） |
| 052 | Accordion | ✅ | `order-history` 展開列；通用版留給 shadcn |
| 053 | Dropdown | ➖ | shadcn Select 已足夠 |
| 054 | Tooltip | ✅ | `avatar-stack` 內建；通用版用 shadcn |
| 055 | Popover | ✅ | `hover-card` |
| 056 | Toast | ✅ | `toast-stack` |
| 057 | Tabs | 🆕 | `sliding-tabs`（underline） |
| 058 | Carousel | ✅ | `hero-billboard-carousel` |
| 059 | Toggle switch | ✅ | `cookie-consent` 內建 |
| 060 | Segmented control | 🆕 | `sliding-tabs`（segment） |
| 061 | Filter chips | 🆕 | `sliding-tabs`（chips，多選） |
| 062 | Range slider | 🆕 | `range-slider` |
| 063 | Stepper | ✅ | `quantity-stepper` |
| 064 | Pagination | ✅ | `pagination` |
| 065 | Hamburger menu | ✅ | `store-header` |
| 066 | Breadcrumbs | ➖ | 無動態可言 |
| 067 | Mega menu | ➖ | 跟站點資訊架構綁太緊，留待 store-header 延伸 |
| 068 | Step indicator | ✅ | `checkout-steps` |
| 069 | Skeleton | ✅ | `skeleton-set` |
| 070 | Spinner | 🆕 | `loading-button` 內建 |
| 071 | Badge | 🆕 | `notify-badge` |
| 072 | Empty state | ✅ | `empty-state` |

### 著陸頁與網頁效果（073 至 096、145 至 168）

| # | 名稱 | 判斷 | 對應 |
|---|---|---|---|
| 073 | Parallax scrolling | 🔄 | `scroll-effects` parallax |
| 074 | Fade-in on scroll | ⛔ | 進場淡入上浮，DESIGN.md 4.1 禁止 |
| 075 | Sticky header | ✅ | `store-header`、`capsule-nav` |
| 076 | Pinning | ✅ | `scroll-story` |
| 077 | Horizontal scroll | 🔄 | `scroll-effects` |
| 078 | Scroll snap | ➖ | CSS `scroll-snap-type` 一行即可 |
| 079 | Scroll progress bar | ✅ | `scroll-progress` |
| 080 | Highlighter | 🔄 | `text-effects` highlighter |
| 081 | Hover lift | 🔄 | `card-effects` |
| 082 | Image zoom on hover | ✅ | `product-media` |
| 083 | Cursor follower | ⛔ | 純裝飾，沒有回應任何操作 |
| 084 | Magnetic button | 🆕 | `hover-motion` Magnetic |
| 085 | Ripple | ⛔ | 沒有物理意義的擴散，SunUI 用按壓內縮 |
| 086 | Underline animation | 🆕 | `hover-motion` InkUnderline |
| 087 | Before/after slider | ✅ | `compare-slider` |
| 088 | Exit-intent popup | 🆕 | `dialog-sheet` 附 `useExitIntent` |
| 089 | Preloader | ⛔ | 擋住內容的開場動畫 |
| 090 | Lazy loading | ➖ | 原生 `loading="lazy"` |
| 091 | Infinite scroll | ➖ | 資料層責任；`pagination` 較適合電商 |
| 092 | Page transition | ➖ | 路由層責任 |
| 093 | Smooth scroll | ➖ | CSS `scroll-behavior` |
| 094 | Marquee | ✅ | `testimonial-marquee` |
| 095 | Animated gradient | ⛔ | 漸層加常駐循環 |
| 096 | Floating animation | ⛔ | 常駐循環 |
| 145 | Timeline on scroll | 🆕 | `scroll-timeline`（也可當訂單追蹤，進度可外部控制） |
| 146 | Scroll text reveal | ✅ | `scroll-reveal-text` |
| 147 | Stacking cards | 🔄 | `scroll-effects` stacking-cards |
| 148 | Background color change | ➖ | 跟主題 token 衝突 |
| 149 | Hide-on-scroll header | ✅ | `store-header`、`capsule-nav` |
| 150 | Scrollspy | 🆕 | `toc-scrollspy` |
| 151 | Back-to-top | 🆕 | `back-to-top` |
| 152 | Zoom on scroll | 🔄 | `scroll-effects` |
| 153 | 3D tilt | 🔄 | `card-effects` |
| 154 | Spotlight hover | 🔄 | `card-effects`（光暈另議） |
| 155 | Image swap on hover | ✅ | `product-media` |
| 156 | Text roll on hover | 🆕 | `hover-motion` TextRoll |
| 157 | Hover image reveal | 🆕 | `hover-motion` HoverPreviewList |
| 158 | Floating label | 🆕 | `floating-field` |
| 159 | Inline validation | 🆕 | `floating-field` |
| 160 | Loading button | 🆕 | `loading-button` |
| 161 | View transition | 🆕 | `lightbox`（縮圖以 layoutId 長成大圖） |
| 162 | Lightbox | 🆕 | `lightbox` |
| 163 | Hotspots | 🆕 | `hotspots` |
| 164 | Countdown timer | ✅ | `countdown-banner`、`reservation-timer` |
| 165 | Shape divider | ⛔ | 常駐搖擺 |
| 166 | Like button | ✅ | `favorite-button`（粒子改為印章式按壓） |
| 167 | Scroll-down cue | ⛔ | 常駐循環 |
| 168 | Background video | ➖ | 媒體素材，不是元件 |

## 3. 本次新增的 11 個 block

設計原則是「彈性」：每個元件只做一件事，但用 props 切換形態，而不是做成多個幾乎一樣的元件。

| Block | 參考 | 彈性點 |
|---|---|---|
| `dialog-sheet` | 049、051、088 | `variant="auto"` 桌面置中、手機變底部面板；sheet 可拖曳關閉；受控或非受控；`useExitIntent` 把離開意圖接到任何開關 |
| `sliding-tabs` | 057、060、061 | `variant` underline / segment / chips；`multiple` 變成多選篩選籤；指示器以 layoutId 滑動 |
| `range-slider` | 062 | 單值或雙值（傳數字或 `[min, max]`）、step、刻度、`format`、`minGap`、鍵盤與表單 name |
| `loading-button` | 070、160 | 傳回 Promise 的 onClick 自動管理 idle → loading → success / error；也可受控 `state` |
| `floating-field` | 158、159 | 浮動標籤、`validate` 函式（同步）、`validateOn` change / blur、錯誤輕搖、textarea |
| `notify-badge` | 071 | 包住任何圖示；數字、`max` 上限、`dot` 模式；數字增加才彈一下，減少不動 |
| `hover-motion` | 084、086、156、157 | 四個小元件：Magnetic、InkUnderline、TextRoll、HoverPreviewList，觸控裝置自動退化 |
| `toc-scrollspy` | 150 | 自動偵測目前段落、滑動指示線、可指定 container 與 offset；附 `useScrollSpy` hook |
| `back-to-top` | 151 | 門檻後出現、外圈顯示閱讀進度、可指定 container |
| `scroll-timeline` | 145 | `mode="scroll"` 隨捲動畫線；`mode="progress"` 外部控制，可當訂單追蹤 |
| `hotspots` | 163 | 以百分比定位、編號或圓點、受控 active、紙片說明卡自動避開邊緣 |
| `lightbox` | 161、162 | 縮圖以 layoutId 長成大圖、左右鍵與滑動、`renderThumb` 自訂縮圖 |

全部遵守 DESIGN.md：只用三種彈簧、只回應操作、不做常駐循環（載入中的轉圈除外）、沒有漸層光暈、reduced motion 下立即切換。

## 4. 可延伸的想法（未做）

- **把 tags 直接併入 aliases**：motion-prompt 每個條目的 tags（例如 `magnetic, magnetic-button, cta`）可補到既有 block 的 `meta.usage.aliases`，讓搜尋更準。
- **規格欄位**：參考它的 Motion spec，在 `/docs/motion` 每個名詞旁寫出 SunUI 的實際數值（彈簧參數、時長），代理人才有依據。

## 5. 動畫本身：motion 系列補上的 5 個 block

第一輪只處理了 UI 元件。這一輪補上站上真正的主體：動態手法、運鏡轉場與影像風格，共 120 個名稱。這些效果放在 `meta.series: "motion"`，遵守 `DESIGN-motion.md`（允許漸層、光暈、循環），不受紙感系列限制。

| Block | 對應編號 | 內容 |
|---|---|---|
| `scene-transitions` | 017 至 020、043 至 046、137 至 142、186 至 188 | 21 種轉場：cut、cross-dissolve、fade-to-black、morph-cut、wipe、push、cover、whip-pan、smash-cut、iris、circle-reveal、star-reveal、blinds、bands、liquid、zoom-through、cube、page-curl、doors、pixelate、shatter。`SceneTransition` 換 `activeKey` 就轉場，`SceneSlideshow` 自動輪播 |
| `camera-moves` | 025 至 036、169 至 170、173、176 至 178、183 至 184、191 | 21 種運鏡，套在使用者自己分層的場景上（`CameraLayer depth`），近景與遠景依深度產生正確視差；dolly-zoom 主體大小不變、背景逼近；可用 `progress` 接捲動 |
| `photo-looks` | 097 至 120 | 24 種攝影光線與調色，套在任何圖片或元素上：逆光、輪廓光、剪影、林布蘭光、黃金時刻、散景、移軸、長曝光、鏡頭眩光、魚眼、色差、暗角、雙色調、青橙、底片顆粒、漏光、雙重曝光等 |
| `motion-principles` | 002、003、009 至 011、014、024、121 至 128、134 至 136、143 | 動畫原理包在任何子元素外：擠壓伸展、預備動作、跟隨動作、回彈、晃動、殘影、重複器、萬花筒、線條抖動、爆炸圖等 |
| `type-motion` | 131 至 133 | 文字沿路徑、可變字重、文字遮罩 |

既有 motion block 已涵蓋的（Pop-in、Line draw、Mask reveal、Typewriter、Count-up、Shape morph、Glitch、Scramble、Wave text、Motion path、Particles、Ken Burns 等）沒有重做。剪接概念裡無法變成網頁元件的（J-cut、L-cut、Long take、Cross-cutting、Montage、POV、Over-the-shoulder 這類敘事與音訊用語）不做。
