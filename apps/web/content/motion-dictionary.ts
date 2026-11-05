import type { Locale } from "@/lib/i18n";

// 動效辭典：業界常見的動效名稱，各自標上 SunUI 的立場。
// 立場依 DESIGN.md 第 1、4 節與 reports/動效參考站整合規劃-2026-11-05.md。
// 名稱是業界通用詞；說明文字全部自寫，不引用任何參考站的內容。

export type Verdict = "allow" | "limit" | "avoid";
export type DemoKey = "press" | "stamp" | "shake" | "roll" | "panel" | "list";

type L = Record<Locale, string>;
type Names = Omit<L, "en">;

export type MotionEntry = {
  id: string;
  name: string;
  aliases?: string[];
  names: Names;
  verdict: Verdict;
  how: L;
  /** 對應 block；不存在的（例如沒有 Pro repo）頁面會自動略過 */
  blocks?: string[];
  demo?: DemoKey;
  /** 規劃中、尚未上線的 block */
  planned?: string;
};

export type MotionGroup = { id: string; title: L; entries: MotionEntry[] };

const n = (zhTW: string, zhCN: string, ja: string): Names => ({ "zh-TW": zhTW, "zh-CN": zhCN, ja });

export const motionGroups: MotionGroup[] = [
  {
    id: "enter-exit",
    title: { en: "Entrance and exit", "zh-TW": "進場與退場", "zh-CN": "进场与退场", ja: "登場と退場" },
    entries: [
      {
        id: "fade-up",
        name: "Fade Up",
        aliases: ["Fade In Up", "Reveal on Scroll", "Animate on Scroll"],
        names: n("上浮淡入", "上浮淡入", "フェードアップ"),
        verdict: "avoid",
        how: {
          en: "Content is simply there when the page loads. If a value arrives later, roll the number instead of fading the block in.",
          "zh-TW": "頁面載入時內容直接就在。資料晚到時，讓數字滾到新值，而不是整塊淡入。",
          "zh-CN": "页面加载时内容直接就在。数据晚到时，让数字滚到新值，而不是整块淡入。",
          ja: "読み込み時はそのまま表示します。値が後から届く場合は、ブロックをフェードさせず数字を回します。",
        },
        blocks: ["animated-number"],
      },
      {
        id: "blur-in",
        name: "Blur In",
        aliases: ["Focus In", "Blur Text Reveal"],
        names: n("模糊入場", "模糊入场", "ブラーイン"),
        verdict: "avoid",
        how: {
          en: "SunUI uses no blur at all. Swap the content instantly.",
          "zh-TW": "SunUI 完全不用模糊。內容直接切換。",
          "zh-CN": "SunUI 完全不用模糊。内容直接切换。",
          ja: "SunUI はぼかしを使いません。内容はそのまま切り替えます。",
        },
      },
      {
        id: "bounce-in",
        name: "Bounce In",
        aliases: ["Zoom In", "Jack In The Box", "Back In", "Puff In"],
        names: n("彈跳入場", "弹跳入场", "バウンスイン"),
        verdict: "avoid",
        how: {
          en: "Popping and scaling have no physical meaning on paper. Dialogs settle with the gentle spring from 98%, without overshoot.",
          "zh-TW": "彈出與縮放在紙上沒有物理意義。對話框用 gentle 彈簧從 98% 落定，不回彈。",
          "zh-CN": "弹出与缩放在纸上没有物理意义。对话框用 gentle 弹簧从 98% 落定，不回弹。",
          ja: "ポップや拡大は紙として意味がありません。ダイアログは gentle スプリングで 98% から静かに収まります。",
        },
        blocks: ["upgrade-modal"],
      },
      {
        id: "slide-in",
        name: "Slide In / Slide Out",
        aliases: ["Drawer Slide", "Bottom Sheet Slide-Up"],
        names: n("滑入與滑出", "滑入与滑出", "スライドイン／アウト"),
        verdict: "allow",
        how: {
          en: "A panel is pushed in from its own edge with the gentle spring and leaves the same way. No fade on the panel itself.",
          "zh-TW": "面板從自己的那一側用 gentle 彈簧推進來，原路離開。面板本身不淡入。",
          "zh-CN": "面板从自己的那一侧用 gentle 弹簧推进来，原路离开。面板本身不淡入。",
          ja: "パネルは自分の辺から gentle スプリングで押し出され、同じ道で戻ります。パネル自体はフェードしません。",
        },
        blocks: ["side-panel", "cart-drawer"],
        demo: "panel",
      },
      {
        id: "fade",
        name: "Fade In / Fade Out",
        aliases: ["Backdrop Scrim Fade"],
        names: n("淡入與淡出", "淡入与淡出", "フェードイン／アウト"),
        verdict: "limit",
        how: {
          en: "Only for a scrim or overlay that appears because the user opened something. 180 to 220 ms.",
          "zh-TW": "只用在使用者打開東西時出現的遮罩或浮層。180 到 220ms。",
          "zh-CN": "只用在用户打开东西时出现的遮罩或浮层。180 到 220ms。",
          ja: "ユーザーが何かを開いたときのスクリムやオーバーレイだけ。180〜220ms。",
        },
      },
      {
        id: "stagger",
        name: "Stagger",
        aliases: ["Cascade", "Staggered Animation"],
        names: n("交錯動畫", "交错动画", "スタッガー"),
        verdict: "limit",
        how: {
          en: "Only when a list changes because of the user, such as applying a filter. Never on page load, and the whole run stays under 400 ms.",
          "zh-TW": "只在清單因使用者操作而改變時，例如套用篩選。頁面載入不用，整段在 400ms 內。",
          "zh-CN": "只在列表因用户操作而改变时，例如应用筛选。页面加载不用，整段在 400ms 内。",
          ja: "フィルター適用など、ユーザー操作でリストが変わるときだけ。読み込み時は使わず、全体で 400ms 以内。",
        },
        blocks: ["product-filter-grid"],
      },
      {
        id: "card-flip",
        name: "Card Flip",
        aliases: ["Flip In", "Flip Card"],
        names: n("卡片翻轉", "卡片翻转", "カードフリップ"),
        verdict: "limit",
        how: {
          en: "Only when the back carries information, such as coupon terms, and only on press. Not as decoration on hover.",
          "zh-TW": "只在背面有資訊時用，例如優惠券使用條款，而且要按下才翻。不當成 hover 裝飾。",
          "zh-CN": "只在背面有信息时用，例如优惠券使用条款，而且要按下才翻。不当成 hover 装饰。",
          ja: "裏面に情報があるとき（クーポンの利用条件など）に、押したときだけ。ホバーの装飾にはしません。",
        },
      },
    ],
  },
  {
    id: "emphasis",
    title: { en: "Emphasis", "zh-TW": "強調", "zh-CN": "强调", ja: "強調" },
    entries: [
      {
        id: "shake",
        name: "Shake",
        aliases: ["Error Shake", "Invalid Input Shake", "Head Shake"],
        names: n("抖動", "抖动", "シェイク"),
        verdict: "allow",
        how: {
          en: "One short horizontal shake, 320 ms, when input is rejected, always with the error text. Skipped under reduced motion; the text stays.",
          "zh-TW": "輸入被拒時橫向輕搖一次，320ms，一定搭配錯誤文字。減少動態時不搖，文字照常顯示。",
          "zh-CN": "输入被拒时横向轻摇一次，320ms，一定搭配错误文字。减少动态时不摇，文字照常显示。",
          ja: "入力が拒否されたとき横に一度だけ 320ms 揺らし、必ずエラー文を添えます。動きを減らす設定では揺らさず、文は残します。",
        },
        blocks: ["otp-input", "redeem-key-input"],
        demo: "shake",
      },
      {
        id: "pulse",
        name: "Pulse",
        aliases: ["Pulsing"],
        names: n("脈動", "脉动", "パルス"),
        verdict: "limit",
        how: {
          en: "Only a small dot for a real live state such as processing or recording. Never on buttons or call-to-action areas.",
          "zh-TW": "只給代表真實狀態的小圓點，例如處理中、錄製中。不用在按鈕或行動呼籲上。",
          "zh-CN": "只给代表真实状态的小圆点，例如处理中、录制中。不用在按钮或行动号召上。",
          ja: "処理中・録画中など、実際の状態を示す小さな点だけ。ボタンや CTA には使いません。",
        },
        blocks: ["status-dot"],
      },
      {
        id: "attention",
        name: "Heartbeat / Tada / Jello / Wobble",
        aliases: ["Rubber Band", "Swing", "Bounce (attention)", "Ping"],
        names: n("心跳、慶祝晃動、果凍、搖晃", "心跳、庆祝晃动、果冻、摇晃", "ハートビート・タダ・ゼリー・ウォブル"),
        verdict: "avoid",
        how: {
          en: "Attention-seeking loops. A result gets a stamp; an idle element does not move.",
          "zh-TW": "討注意的循環動作。結果用蓋章表現，閒置的元素不動。",
          "zh-CN": "讨注意的循环动作。结果用盖章表现，闲置的元素不动。",
          ja: "注意を引くためのループです。結果はスタンプで示し、待機中の要素は動かしません。",
        },
      },
      {
        id: "flash",
        name: "Flash / Flicker",
        aliases: ["Blink", "Flicker In"],
        names: n("快閃與閃爍", "快闪与闪烁", "フラッシュ・フリッカー"),
        verdict: "avoid",
        how: {
          en: "Hard on the eyes and unsafe for people sensitive to flashing. Mark new content with a small label.",
          "zh-TW": "傷眼，對光敏感的人也不安全。新內容用一個小標籤標示。",
          "zh-CN": "伤眼，对光敏感的人也不安全。新内容用一个小标签标示。",
          ja: "目に負担があり、光過敏の人にも危険です。新着は小さなラベルで示します。",
        },
      },
    ],
  },
  {
    id: "scroll",
    title: { en: "Scroll", "zh-TW": "捲動", "zh-CN": "滚动", ja: "スクロール" },
    entries: [
      {
        id: "headroom",
        name: "Hide on Scroll Header",
        aliases: ["Headroom", "Auto-hide Navbar"],
        names: n("捲動隱藏頁首", "滚动隐藏页首", "スクロールで隠れるヘッダー"),
        verdict: "allow",
        how: {
          en: "Hide on scroll down, show at once on scroll up, with an 8 px threshold. Never hide while keyboard focus is inside the header.",
          "zh-TW": "往下捲收起，往上捲立刻出現，門檻 8px。鍵盤焦點在頁首裡時不得收起。",
          "zh-CN": "往下滚收起，往上滚立刻出现，门槛 8px。键盘焦点在页首里时不得收起。",
          ja: "下にスクロールで隠し、上で即座に表示。しきい値は 8px。キーボードフォーカスがヘッダー内にある間は隠しません。",
        },
        planned: "store-header",
      },
      {
        id: "header-shrink",
        name: "Sticky Header Shrink",
        aliases: ["Shrinking Header", "Shrink on Scroll"],
        names: n("固定頁首縮小", "固定页首缩小", "縮むヘッダー"),
        verdict: "allow",
        how: {
          en: "Once the page leaves the top, the header gets shorter and gains a 1 px paper edge. No frosted glass.",
          "zh-TW": "離開頁面頂端後頁首變矮，加上 1px 紙邊。不用毛玻璃。",
          "zh-CN": "离开页面顶端后页首变矮，加上 1px 纸边。不用毛玻璃。",
          ja: "ページ上端を離れるとヘッダーが低くなり、1px の紙の縁が付きます。すりガラスは使いません。",
        },
        blocks: ["capsule-nav"],
        planned: "store-header",
      },
      {
        id: "scroll-progress",
        name: "Scroll Progress Indicator",
        aliases: ["Reading Progress Bar", "Back to Top Progress"],
        names: n("捲動進度指示器", "滚动进度指示器", "スクロール進捗"),
        verdict: "allow",
        how: {
          en: "A thin ink line that follows the scroll position directly, with no spring lag.",
          "zh-TW": "一條細墨線直接跟著捲動位置，不加彈簧延遲。",
          "zh-CN": "一条细墨线直接跟着滚动位置，不加弹簧延迟。",
          ja: "細いインクの線がスクロール位置にそのまま追従します。スプリングの遅れは付けません。",
        },
        blocks: ["scroll-progress"],
      },
      {
        id: "pinning",
        name: "Pinning / Stacking Cards",
        aliases: ["Pinned Section", "Sticky Stacking Cards", "Split Screen Scroll"],
        names: n("捲動釘選與堆疊卡片", "滚动钉选与堆叠卡片", "ピン留め・カードスタック"),
        verdict: "allow",
        how: {
          en: "One pinned story section per page for a feature or campaign walkthrough. It must work with plain scrolling and reduced motion.",
          "zh-TW": "每頁一段釘選敘事，用來介紹功能或活動。一般捲動與減少動態下都要能讀。",
          "zh-CN": "每页一段钉选叙事，用来介绍功能或活动。普通滚动与减少动态下都要能读。",
          ja: "機能やキャンペーンの説明に、1 ページ 1 か所だけ。通常のスクロールと動きを減らす設定でも読めること。",
        },
        blocks: ["scroll-story"],
      },
      {
        id: "scroll-linked",
        name: "Scroll-Linked Animation",
        aliases: ["Scroll Scrub", "Scroll-Driven Animation", "Mask Reveal"],
        names: n("捲動連動動畫", "滚动联动动画", "スクロール連動アニメーション"),
        verdict: "limit",
        how: {
          en: "Progress is tied to scroll and reverses when scrolling back. Keep it to one storytelling section; under reduced motion show the final state.",
          "zh-TW": "進度綁定捲動、往回捲會倒轉。只用在一段敘事區；減少動態時直接顯示最終狀態。",
          "zh-CN": "进度绑定滚动、往回滚会倒转。只用在一段叙事区；减少动态时直接显示最终状态。",
          ja: "進行はスクロールに連動し、戻すと逆再生します。物語的な 1 セクションだけに。動きを減らす設定では最終状態を表示します。",
        },
        blocks: ["scroll-reveal-text", "scroll-tilt-stage"],
      },
      {
        id: "parallax",
        name: "Parallax / Zoom on Scroll",
        aliases: ["Parallax Layers", "Scroll Zoom", "Text Marquee on Scroll"],
        names: n("視差與捲動縮放", "视差与滚动缩放", "パララックス・スクロールズーム"),
        verdict: "avoid",
        how: {
          en: "Brand-page decoration that says nothing about the product, and a crowded space other libraries already own.",
          "zh-TW": "形象頁裝飾，不傳達商品資訊，也是其他元件庫的主場。",
          "zh-CN": "形象页装饰，不传达商品信息，也是其他组件库的主场。",
          ja: "商品について何も伝えないブランドページの装飾で、他のライブラリが得意な領域です。",
        },
      },
      {
        id: "smooth-scroll",
        name: "Smooth Scroll",
        aliases: ["Inertia Scroll"],
        names: n("平滑捲動", "平滑滚动", "スムーススクロール"),
        verdict: "avoid",
        how: {
          en: "Do not take over native scrolling. For anchor jumps, CSS scroll-behavior is enough and respects reduced motion.",
          "zh-TW": "不要接管原生捲動。錨點跳轉用 CSS scroll-behavior 就夠，也會尊重減少動態。",
          "zh-CN": "不要接管原生滚动。锚点跳转用 CSS scroll-behavior 就够，也会尊重减少动态。",
          ja: "ネイティブのスクロールを乗っ取らないでください。アンカー移動は CSS の scroll-behavior で十分です。",
        },
      },
    ],
  },
  {
    id: "text",
    title: { en: "Text and numbers", "zh-TW": "文字與數字", "zh-CN": "文字与数字", ja: "文字と数字" },
    entries: [
      {
        id: "number-ticker",
        name: "Number Ticker / Odometer",
        aliases: ["Count Up", "Rolling Digits", "Price Roll"],
        names: n("數字遞增與里程表", "数字递增与里程表", "ナンバーティッカー・オドメーター"),
        verdict: "allow",
        how: {
          en: "Digits roll in the direction the value moved, only when the value changes. Screen readers get the formatted number.",
          "zh-TW": "數值改變時，數字朝變動方向滾動。螢幕閱讀器讀到格式化後的數字。",
          "zh-CN": "数值改变时，数字朝变动方向滚动。屏幕阅读器读到格式化后的数字。",
          ja: "値が変わったときだけ、増減の方向に数字が回ります。スクリーンリーダーには整形済みの数値を渡します。",
        },
        blocks: ["animated-number", "quantity-stepper"],
        demo: "roll",
      },
      {
        id: "split-flap",
        name: "Split-Flap",
        aliases: ["Flip Clock", "Departure Board"],
        names: n("翻牌", "翻牌", "パタパタ表示"),
        verdict: "allow",
        how: {
          en: "For countdowns and drop times. A card flips only when its digit changes, and the countdown pauses on hidden tabs.",
          "zh-TW": "用在倒數與開賣時間。只有數字改變的那張翻牌，分頁隱藏時暫停。",
          "zh-CN": "用在倒数与开卖时间。只有数字改变的那张翻牌，标签页隐藏时暂停。",
          ja: "カウントダウンや発売時刻に。数字が変わったカードだけがめくれ、タブが非表示の間は止まります。",
        },
        blocks: ["countdown-banner", "launch-countdown-wall"],
      },
      {
        id: "typewriter",
        name: "Typewriter",
        aliases: ["Typing Effect", "Text Generate"],
        names: n("打字機效果", "打字机效果", "タイプライター"),
        verdict: "limit",
        how: {
          en: "One short rotating line at most, paused when off screen. Never for body copy, prices or anything people need to read in full.",
          "zh-TW": "最多一行短句輪替，離開畫面時暫停。不用在內文、價格或必須讀完的資訊。",
          "zh-CN": "最多一行短句轮替，离开画面时暂停。不用在正文、价格或必须读完的信息。",
          ja: "短い 1 行の切り替えまで。画面外では止めます。本文や価格など読み切る必要がある情報には使いません。",
        },
        blocks: ["typewriter"],
      },
      {
        id: "underline-draw",
        name: "Underline Draw",
        aliases: ["Underline Reveal", "Text Highlighter"],
        names: n("底線繪製", "下划线绘制", "下線ドロー"),
        verdict: "limit",
        how: {
          en: "On hover or focus of a link, 120 ms. Not as a load-in highlight on headlines.",
          "zh-TW": "連結 hover 或聚焦時，120ms。不當成標題的進場螢光筆。",
          "zh-CN": "链接 hover 或聚焦时，120ms。不当成标题的进场荧光笔。",
          ja: "リンクのホバーやフォーカス時に 120ms。見出しの登場演出には使いません。",
        },
      },
      {
        id: "scramble",
        name: "Text Scramble",
        aliases: ["Scramble Decode", "Matrix Text"],
        names: n("亂碼解碼", "乱码解码", "スクランブル"),
        verdict: "avoid",
        how: {
          en: "Reads as a hacker effect and hides the code from screen readers while it runs. To reveal a coupon code, tear the stub instead.",
          "zh-TW": "看起來像駭客特效，播放期間螢幕閱讀器也讀不到。要揭曉優惠碼，改用撕票根。",
          "zh-CN": "看起来像黑客特效，播放期间屏幕阅读器也读不到。要揭晓优惠码，改用撕票根。",
          ja: "ハッカー風に見え、再生中はスクリーンリーダーにも読めません。クーポンコードは半券を切って見せます。",
        },
        blocks: ["coupon-claim-card"],
      },
      {
        id: "fancy-text",
        name: "Gradient / Neon / Glitch Text",
        aliases: ["Animated Gradient Text", "Neon Glow Text", "Holographic Text", "Glitch Text"],
        names: n("漸層、霓虹、故障文字", "渐变、霓虹、故障文字", "グラデーション・ネオン・グリッチ文字"),
        verdict: "avoid",
        how: {
          en: "Gradients and glows are banned outright. Emphasis comes from size, weight and the one vermilion accent.",
          "zh-TW": "漸層與光暈直接禁止。強調靠字級、字重和唯一的朱紅。",
          "zh-CN": "渐变与光晕直接禁止。强调靠字号、字重和唯一的朱红。",
          ja: "グラデーションと発光は禁止です。強調はサイズ、太さ、唯一の朱色で行います。",
        },
      },
    ],
  },
  {
    id: "hover-press",
    title: { en: "Hover and press", "zh-TW": "懸停與按壓", "zh-CN": "悬停与按压", ja: "ホバーと押下" },
    entries: [
      {
        id: "press",
        name: "Press",
        aliases: ["Button Tap Scale", "Push"],
        names: n("按下縮放", "按下缩放", "押し込み"),
        verdict: "allow",
        how: {
          en: "Scale to 97% on press with the snappy spring. It is feedback that the press landed, so keep it on every pressable surface.",
          "zh-TW": "按下時用 snappy 彈簧縮到 97%。這是「按到了」的回饋，每個可按的面都保留。",
          "zh-CN": "按下时用 snappy 弹簧缩到 97%。这是“按到了”的反馈，每个可按的面都保留。",
          ja: "押したとき snappy スプリングで 97% に縮めます。押せたことのフィードバックなので、押せる面すべてに付けます。",
        },
        demo: "press",
      },
      {
        id: "hover-zoom",
        name: "Hover Zoom / Magnifier",
        aliases: ["Hover Zoom & Pan", "Magnifier Lens", "Image Swap on Hover"],
        names: n("懸停放大與放大鏡", "悬停放大与放大镜", "ホバーズーム・ルーペ"),
        verdict: "allow",
        how: {
          en: "For product images, where seeing detail helps a purchase. On touch screens, open the gallery on tap instead.",
          "zh-TW": "用在商品圖，看清細節有助購買。觸控裝置改成點擊開啟圖庫。",
          "zh-CN": "用在商品图，看清细节有助购买。触控设备改成点击打开图库。",
          ja: "商品画像に。細部が見えると購入の助けになります。タッチ端末ではタップでギャラリーを開きます。",
        },
        blocks: ["product-gallery"],
        planned: "product-media",
      },
      {
        id: "background-fade",
        name: "Background Fade",
        aliases: ["Hover State Layer", "Border Fade"],
        names: n("背景色漸變", "背景色渐变", "背景フェード"),
        verdict: "allow",
        how: {
          en: "A 120 ms color change on hover, using theme tokens. The default hover for rows, chips and menu items.",
          "zh-TW": "hover 時 120ms 換色，用主題 token。清單列、標籤、選單項目的預設 hover。",
          "zh-CN": "hover 时 120ms 换色，用主题 token。列表行、标签、菜单项的默认 hover。",
          ja: "ホバー時に 120ms でテーマトークンの色へ。行、チップ、メニュー項目の標準ホバーです。",
        },
      },
      {
        id: "glow",
        name: "Glow / Shine Sweep / Border Beam",
        aliases: ["Hover Border Gradient", "Neon Glow Button", "Rotating Gradient Border"],
        names: n("發光、光澤掃過、邊框光束", "发光、光泽扫过、边框光束", "グロー・シャイン・ボーダービーム"),
        verdict: "avoid",
        how: {
          en: "Colored glows and gradients are the clearest template signal. A hover may change color or lift by 1 px, nothing more.",
          "zh-TW": "彩色光暈與漸層是最明顯的模板訊號。hover 只換色或上移 1px。",
          "zh-CN": "彩色光晕与渐变是最明显的模板信号。hover 只换色或上移 1px。",
          ja: "色付きの発光やグラデーションはテンプレートの典型です。ホバーは色を変えるか 1px 浮かせるまで。",
        },
      },
      {
        id: "tilt",
        name: "3D Tilt / Glare Card",
        aliases: ["Holographic Card", "Tilt Parallax Image"],
        names: n("3D 傾斜與炫光卡片", "3D 倾斜与炫光卡片", "3D チルト・グレアカード"),
        verdict: "avoid",
        how: {
          en: "Pretty but says nothing, and it does not work on touch. Paper lies flat.",
          "zh-TW": "好看但不傳達資訊，觸控裝置也沒效果。紙是平放的。",
          "zh-CN": "好看但不传达信息，触控设备也没效果。纸是平放的。",
          ja: "見た目だけで情報がなく、タッチでは機能しません。紙は平らに置かれています。",
        },
      },
      {
        id: "cursor",
        name: "Custom Cursor / Magnetic Button",
        aliases: ["Cursor Follower", "Cursor Trail", "Cursor Spotlight"],
        names: n("自訂游標與磁吸按鈕", "自定义光标与磁吸按钮", "カスタムカーソル・マグネットボタン"),
        verdict: "avoid",
        how: {
          en: "Decoration that fights the pointer people already know, and does nothing on phones where most shoppers are.",
          "zh-TW": "和使用者熟悉的游標作對的裝飾，在多數購物者使用的手機上也沒作用。",
          "zh-CN": "和用户熟悉的光标作对的装饰，在多数购物者使用的手机上也没作用。",
          ja: "慣れたポインターに逆らう装飾で、買い物客の多いスマートフォンでは何も起きません。",
        },
      },
    ],
  },
  {
    id: "micro",
    title: { en: "Micro-interactions", "zh-TW": "微互動", "zh-CN": "微交互", ja: "マイクロインタラクション" },
    entries: [
      {
        id: "stamp",
        name: "Stamp",
        aliases: ["Rubber Stamp", "Seal"],
        names: n("蓋章", "盖章", "スタンプ"),
        verdict: "allow",
        how: {
          en: "SunUI's one celebration. Pressed down from 160%, turned to -10°, settled with the stamp spring. Used for claimed, redeemed, paid and sold out.",
          "zh-TW": "SunUI 唯一的慶祝。從 160% 壓下、轉到 -10°、用 stamp 彈簧落定。用在已領取、已兌換、已付款、已售完。",
          "zh-CN": "SunUI 唯一的庆祝。从 160% 压下、转到 -10°、用 stamp 弹簧落定。用在已领取、已兑换、已付款、已售完。",
          ja: "SunUI 唯一のお祝い。160% から押し下げ、-10° に傾け、stamp スプリングで収めます。受取済み・利用済み・支払済み・完売に使います。",
        },
        blocks: ["coupon-wallet", "tier-progress", "stamp-card"],
        demo: "stamp",
      },
      {
        id: "confetti",
        name: "Confetti",
        aliases: ["Particles Burst", "Fireworks"],
        names: n("彩紙噴發", "彩纸喷发", "紙吹雪"),
        verdict: "avoid",
        how: {
          en: "Use the stamp. One celebration across the whole set is what makes it recognisable.",
          "zh-TW": "改用蓋章。整套只有一種慶祝，才認得出來。",
          "zh-CN": "改用盖章。整套只有一种庆祝，才认得出来。",
          ja: "スタンプを使います。お祝いが 1 種類だけだから見分けがつきます。",
        },
      },
      {
        id: "add-to-cart-fly",
        name: "Add to Cart Fly",
        aliases: ["Fly to Cart", "Cart Badge Bounce"],
        names: n("飛入購物車", "飞入购物车", "カートへ飛ぶ"),
        verdict: "allow",
        how: {
          en: "A paper price tag arcs into a cart icon that stays visible, then the badge count updates. The request never waits for the animation.",
          "zh-TW": "紙吊牌以弧線飛進一直看得到的購物車圖示，接著數字更新。請求不等動畫。",
          "zh-CN": "纸吊牌以弧线飞进一直看得到的购物车图标，接着数字更新。请求不等动画。",
          ja: "紙の値札が常に見えるカートアイコンへ弧を描いて飛び、バッジの数が更新されます。通信はアニメーションを待ちません。",
        },
        blocks: ["add-to-cart-button"],
      },
      {
        id: "like-burst",
        name: "Like / Heart Burst",
        aliases: ["Heart Burst", "Favorite"],
        names: n("愛心迸發", "爱心迸发", "ハートバースト"),
        verdict: "limit",
        how: {
          en: "One small ink burst on the press that saves the item. No particles, no loop afterwards.",
          "zh-TW": "按下收藏時一次小小的墨點迸開。沒有粒子，之後也不循環。",
          "zh-CN": "按下收藏时一次小小的墨点迸开。没有粒子，之后也不循环。",
          ja: "保存を押したときに小さなインクが一度はじけるだけ。粒子もループもありません。",
        },
        blocks: ["favorite-button"],
      },
      {
        id: "copy-feedback",
        name: "Copy-to-Clipboard Feedback",
        aliases: ["Copy Feedback", "Copied Tooltip"],
        names: n("複製回饋", "复制反馈", "コピーのフィードバック"),
        verdict: "allow",
        how: {
          en: "The icon becomes a check and a polite live region says it was copied. Reverts after about two seconds.",
          "zh-TW": "圖示變成勾勾，並用 polite live region 告知已複製。約兩秒後恢復。",
          "zh-CN": "图标变成勾勾，并用 polite live region 告知已复制。约两秒后恢复。",
          ja: "アイコンがチェックに変わり、polite な live region でコピーを伝えます。約 2 秒で戻ります。",
        },
        blocks: ["copy-code-button"],
      },
      {
        id: "success-check",
        name: "Success Checkmark",
        aliases: ["Button Loading State", "Checkbox Check Draw"],
        names: n("成功打勾", "成功打勾", "成功のチェック"),
        verdict: "allow",
        how: {
          en: "The check line draws once in under 300 ms. For an order or payment result, follow it with a stamp.",
          "zh-TW": "勾勾線條在 300ms 內畫一次。訂單或付款結果之後再蓋章。",
          "zh-CN": "勾勾线条在 300ms 内画一次。订单或付款结果之后再盖章。",
          ja: "チェックの線を 300ms 以内に一度描きます。注文や支払いの結果なら続けてスタンプを押します。",
        },
        blocks: ["confirm-button", "checkout-button"],
      },
      {
        id: "swipe-delete",
        name: "Swipe to Delete",
        aliases: ["Swipe Action"],
        names: n("滑動刪除", "滑动删除", "スワイプで削除"),
        verdict: "allow",
        how: {
          en: "Allowed on touch lists if a visible remove button and an undo toast exist too. Swiping alone is undiscoverable.",
          "zh-TW": "觸控清單可用，但同時要有看得到的刪除按鈕和復原提示。只靠滑動沒人發現得了。",
          "zh-CN": "触控列表可用，但同时要有看得到的删除按钮和撤销提示。只靠滑动没人发现得了。",
          ja: "タッチのリストで使えますが、見える削除ボタンと元に戻すトーストも必須です。スワイプだけでは気づかれません。",
        },
        blocks: ["toast-stack", "cart-drawer"],
      },
    ],
  },
  {
    id: "layout",
    title: { en: "Components and layout", "zh-TW": "元件與版面", "zh-CN": "组件与布局", ja: "コンポーネントとレイアウト" },
    entries: [
      {
        id: "list-item",
        name: "List Item Enter / Exit",
        aliases: ["Collapse", "Height Auto"],
        names: n("清單項目進出", "列表项目进出", "リスト項目の出入り"),
        verdict: "allow",
        how: {
          en: "Removed rows collapse their height so the rows below move up in place. Pair with an undo when the removal is the user's.",
          "zh-TW": "移除的列收合高度，讓下方的列原地補上。使用者自己刪除時搭配復原。",
          "zh-CN": "移除的行收合高度，让下方的行原地补上。用户自己删除时搭配撤销。",
          ja: "削除した行は高さを畳み、下の行がその場に詰まります。ユーザーが消した場合は元に戻すを添えます。",
        },
        blocks: ["cart-drawer", "toast-stack"],
        demo: "list",
      },
      {
        id: "tab-indicator",
        name: "Tab Indicator Slide",
        aliases: ["Sliding Highlight", "Segmented Control"],
        names: n("頁籤指示器滑動", "标签指示器滑动", "タブインジケーター"),
        verdict: "allow",
        how: {
          en: "The indicator slides to the new tab with the snappy spring; content swaps without a slide.",
          "zh-TW": "指示器用 snappy 彈簧滑到新頁籤；內容直接切換，不滑動。",
          "zh-CN": "指示器用 snappy 弹簧滑到新标签；内容直接切换，不滑动。",
          ja: "インジケーターは snappy スプリングで新しいタブへ。内容はスライドせず切り替えます。",
        },
        blocks: ["capsule-nav", "variant-picker"],
      },
      {
        id: "flip-layout",
        name: "FLIP Layout Animation",
        aliases: ["Shared Layout Animation", "Grid Shuffle", "Filterable Grid"],
        names: n("FLIP 版面動畫", "FLIP 布局动画", "FLIP レイアウト"),
        verdict: "allow",
        how: {
          en: "When filtering or sorting moves items, they glide to their new place with the gentle spring so people can follow them.",
          "zh-TW": "篩選或排序讓項目換位時，用 gentle 彈簧滑到新位置，讓人跟得上。",
          "zh-CN": "筛选或排序让项目换位时，用 gentle 弹簧滑到新位置，让人跟得上。",
          ja: "絞り込みや並べ替えで項目が動くとき、gentle スプリングで新しい位置へ滑らせて目で追えるようにします。",
        },
        blocks: ["product-filter-grid"],
      },
      {
        id: "accordion",
        name: "Accordion Expand-Collapse",
        aliases: ["Disclosure", "FAQ"],
        names: n("手風琴展開收合", "手风琴展开收合", "アコーディオン"),
        verdict: "allow",
        how: {
          en: "Height opens with the gentle spring; the plus turns into a minus. Content stays in the DOM for search engines.",
          "zh-TW": "高度用 gentle 彈簧展開，加號轉成減號。內容留在 DOM 裡給搜尋引擎。",
          "zh-CN": "高度用 gentle 弹簧展开，加号转成减号。内容留在 DOM 里给搜索引擎。",
          ja: "高さは gentle スプリングで開き、プラスがマイナスに。内容は検索エンジンのため DOM に残します。",
        },
        blocks: ["faq-accordion"],
      },
      {
        id: "toast",
        name: "Toast Slide-In",
        aliases: ["Snackbar", "Toast Stack"],
        names: n("快顯通知滑入", "快显通知滑入", "トーストのスライドイン"),
        verdict: "allow",
        how: {
          en: "Toasts slide in from their edge and stack; pausing on hover and focus, with a polite live region.",
          "zh-TW": "通知從邊緣滑入並堆疊；hover 與聚焦時暫停計時，搭配 polite live region。",
          "zh-CN": "通知从边缘滑入并堆叠；hover 与聚焦时暂停计时，搭配 polite live region。",
          ja: "トーストは端から滑り込んで重なります。ホバーとフォーカスでタイマーを止め、polite な live region を使います。",
        },
        blocks: ["toast-stack"],
      },
      {
        id: "marquee",
        name: "Marquee",
        aliases: ["Infinite Card Wall", "Logo Marquee"],
        names: n("跑馬燈", "跑马灯", "マーキー"),
        verdict: "limit",
        how: {
          en: "One of the few allowed loops, for reviews only. It pauses on hover and focus and stops under reduced motion.",
          "zh-TW": "少數允許的循環之一，只用在評價。hover 與聚焦時暫停，減少動態時停止。",
          "zh-CN": "少数允许的循环之一，只用在评价。hover 与聚焦时暂停，减少动态时停止。",
          ja: "数少ない許可されたループで、レビュー専用。ホバーとフォーカスで止まり、動きを減らす設定では停止します。",
        },
        blocks: ["testimonial-marquee"],
      },
      {
        id: "carousel",
        name: "Carousel Slide",
        aliases: ["Carousel Crossfade", "Coverflow", "3D Carousel"],
        names: n("輪播", "轮播", "カルーセル"),
        verdict: "limit",
        how: {
          en: "Moves only when the user swipes or presses. No autoplay unless it has a visible pause button. Coverflow and 3D rings are out.",
          "zh-TW": "只在使用者滑動或按下時移動。沒有看得到的暫停鍵就不自動播放。封面流與 3D 環形不用。",
          "zh-CN": "只在用户滑动或按下时移动。没有看得到的暂停键就不自动播放。封面流与 3D 环形不用。",
          ja: "ユーザーのスワイプや押下でだけ動きます。見える一時停止ボタンがなければ自動再生しません。カバーフローや 3D リングは使いません。",
        },
        blocks: ["product-gallery"],
      },
      {
        id: "page-transition",
        name: "Page Transition",
        aliases: ["Curtain Wipe", "Circular Reveal", "Shared Element Transition"],
        names: n("換頁轉場", "换页转场", "ページ遷移"),
        verdict: "limit",
        how: {
          en: "A framework concern (View Transitions in Next.js), not a block. If you add one, keep it under 250 ms and skip it under reduced motion.",
          "zh-TW": "屬框架層級（Next.js 的 View Transitions），不是 block。真要加，250ms 內，減少動態時跳過。",
          "zh-CN": "属框架层级（Next.js 的 View Transitions），不是 block。真要加，250ms 内，减少动态时跳过。",
          ja: "フレームワーク側（Next.js の View Transitions）の話でブロックではありません。入れるなら 250ms 以内、動きを減らす設定では省きます。",
        },
      },
    ],
  },
  {
    id: "loading",
    title: { en: "Loading and data", "zh-TW": "載入與數據", "zh-CN": "加载与数据", ja: "読み込みとデータ" },
    entries: [
      {
        id: "skeleton",
        name: "Skeleton Shimmer",
        aliases: ["Pulse Placeholder", "Content Loader"],
        names: n("骨架微光", "骨架微光", "スケルトン"),
        verdict: "allow",
        how: {
          en: "Loading is one of two exceptions to the no-loop rule. The shimmer stops the moment data arrives and is static under reduced motion.",
          "zh-TW": "載入是「不循環」的兩個例外之一。資料一到就停，減少動態時改為靜態。",
          "zh-CN": "加载是“不循环”的两个例外之一。数据一到就停，减少动态时改为静态。",
          ja: "読み込みはループ禁止の 2 つの例外の 1 つ。データが届いた瞬間に止め、動きを減らす設定では静止させます。",
        },
        blocks: ["skeleton-set"],
      },
      {
        id: "button-loading",
        name: "Button Loading State",
        aliases: ["Spinner", "Circular Spinner"],
        names: n("按鈕載入狀態", "按钮加载状态", "ボタンの読み込み状態"),
        verdict: "allow",
        how: {
          en: "The button keeps its width, shows a small spinner and sets aria-busy. It never becomes a different shape.",
          "zh-TW": "按鈕維持寬度、顯示小轉圈並設 aria-busy。不變成別的形狀。",
          "zh-CN": "按钮维持宽度、显示小转圈并设 aria-busy。不变成别的形状。",
          ja: "ボタンは幅を保ち、小さなスピナーと aria-busy を付けます。形は変えません。",
        },
        blocks: ["confirm-button", "checkout-button"],
      },
      {
        id: "progress",
        name: "Progress Bar / Ring",
        aliases: ["Determinate Progress", "Progress Ring", "Free Shipping Progress"],
        names: n("進度條與進度環", "进度条与进度环", "プログレスバー・リング"),
        verdict: "allow",
        how: {
          en: "Animates from the old value to the new one when progress really changes. Reaching a goal gets a stamp.",
          "zh-TW": "進度真的改變時，從舊值動到新值。達成目標時蓋章。",
          "zh-CN": "进度真的改变时，从旧值动到新值。达成目标时盖章。",
          ja: "進捗が本当に変わったとき、旧値から新値へ動きます。目標達成でスタンプ。",
        },
        blocks: ["quota-meter", "tier-progress", "free-shipping-progress"],
      },
      {
        id: "charts",
        name: "Bar Chart Grow / Donut Fill",
        aliases: ["Chart Data Transition", "Line Chart Draw"],
        names: n("圖表成長與填充", "图表成长与填充", "チャートの伸長・塗り"),
        verdict: "limit",
        how: {
          en: "When the data loads or changes, once. Not replayed every time the chart scrolls into view.",
          "zh-TW": "資料載入或改變時播一次。不要每次捲進畫面都重播。",
          "zh-CN": "数据加载或改变时播一次。不要每次滚进画面都重播。",
          ja: "データの読み込みや変更時に一度だけ。画面に入るたびに再生しません。",
        },
      },
    ],
  },
  {
    id: "ambient",
    title: { en: "Ambient and decoration", "zh-TW": "氛圍與裝飾", "zh-CN": "氛围与装饰", ja: "背景と装飾" },
    entries: [
      {
        id: "ambient",
        name: "Particles / Aurora / Animated Gradient",
        aliases: ["Sparkles", "Meteors", "Light Rays", "Background Beams", "Mesh Gradient", "Starfield"],
        names: n("粒子、極光、動態漸層", "粒子、极光、动态渐变", "パーティクル・オーロラ・動くグラデーション"),
        verdict: "avoid",
        how: {
          en: "Every item here breaks the color rules and adds an idle loop. A SunUI page gets its character from paper, type and the stamp.",
          "zh-TW": "這一類每一個都違反顏色規則，還多一個常駐循環。SunUI 的頁面靠紙、字和印章出性格。",
          "zh-CN": "这一类每一个都违反颜色规则，还多一个常驻循环。SunUI 的页面靠纸、字和印章出性格。",
          ja: "どれも色のルールに反し、常駐ループを増やします。SunUI のページは紙、文字、スタンプで個性を出します。",
        },
      },
      {
        id: "ken-burns",
        name: "Ken Burns",
        aliases: ["Slow Zoom", "Pan and Zoom"],
        names: n("緩慢推鏡", "缓慢推镜", "ケン・バーンズ"),
        verdict: "avoid",
        how: {
          en: "An idle loop on the product photo, which is the one thing shoppers need to see still.",
          "zh-TW": "在商品照上常駐循環，而商品照正是購物者最需要看清楚的東西。",
          "zh-CN": "在商品照上常驻循环，而商品照正是购物者最需要看清楚的东西。",
          ja: "商品写真に常駐ループをかけます。買い物客が静止して見たいのはまさに商品写真です。",
        },
      },
    ],
  },
];

export type MotionPageCopy = {
  title: string;
  metaDescription: string;
  lead: string;
  rulesTitle: string;
  rules: string[];
  legend: Record<Verdict, { label: string; body: string }>;
  filterLabel: string;
  all: string;
  searchLabel: string;
  searchPlaceholder: string;
  empty: string;
  aka: string;
  blocks: string;
  planned: string;
  play: string;
  libTitle: string;
  libBody: string;
  libUsage: string;
  sourcesTitle: string;
  sourcesBody: string;
};

export const motionPageCopy: Record<Locale, MotionPageCopy> = {
  en: {
    title: "Motion dictionary",
    metaDescription: "Common web motion names and where SunUI stands on each: allowed, limited or avoided, with the alternative and the block that does it.",
    lead: "Motion effects have names: Fade Up, Odometer, Headroom, Confetti. This page lists the common ones and says where SunUI stands on each, so you and your AI agent can ask for a motion by name and get an answer that fits the design rules.",
    rulesTitle: "The four rules behind every verdict",
    rules: [
      "Motion answers a user action or a data change. Nothing fades in on page load, and nothing loops while idle (countdowns and loading are the exceptions).",
      "No gradients, glows, blur or colored shadows.",
      "The stamp is the only celebration.",
      "Single animations stay under 400 ms, and reduced motion becomes an instant switch with no information lost.",
    ],
    legend: {
      allow: { label: "Allowed", body: "Use it the way described." },
      limit: { label: "Limited", body: "Only in the situation described." },
      avoid: { label: "Avoided", body: "Not in SunUI. The note says what to do instead." },
    },
    filterLabel: "Filter by verdict",
    all: "All",
    searchLabel: "Search motions",
    searchPlaceholder: "Search a motion name, e.g. headroom",
    empty: "No motion matches. Try another name or alias.",
    aka: "Also called",
    blocks: "Blocks",
    planned: "Planned",
    play: "Play",
    libTitle: "Use the same timing in your code",
    libBody: "`sunui-motion` is a small library with the three springs and the allowed motions on this page (press, stamp, shake, panel, list collapse, number roll). Every helper has a reduced-motion path. It has no fade-up, pulse or confetti on purpose.",
    libUsage: "Installs to `lib/sunui-motion.ts`. Import `springs`, `press`, `stamp`, `useShake`, `panel`, `listItem` or `roll`.",
    sourcesTitle: "Further reading",
    sourcesBody: "Two public collections are good for learning motion names and seeing them play. Most of their effects fall under Avoided here; use them as a vocabulary, not a shopping list.",
  },
  "zh-TW": {
    title: "動效辭典",
    metaDescription: "常見網頁動效名稱與 SunUI 對每一個的立場：允許、限定或不用，附替代做法與對應 block。",
    lead: "動效都有名字：Fade Up、Odometer、Headroom、Confetti。這頁列出常見的名稱，並寫明 SunUI 對每一個的立場。你和你的 AI 代理可以直接用名稱提需求，得到符合設計規則的答案。",
    rulesTitle: "所有判定背後的四條規則",
    rules: [
      "只在回應使用者動作或資料改變時動。頁面載入不淡入，閒置時不循環（倒數與載入除外）。",
      "不用漸層、光暈、模糊、彩色陰影。",
      "蓋章是唯一的慶祝。",
      "單次動畫在 400ms 內；減少動態時改成立即切換，資訊不能遺失。",
    ],
    legend: {
      allow: { label: "允許", body: "照說明的方式使用。" },
      limit: { label: "限定", body: "只在說明的情境使用。" },
      avoid: { label: "不用", body: "SunUI 不做。說明寫了替代方案。" },
    },
    filterLabel: "依立場篩選",
    all: "全部",
    searchLabel: "搜尋動效",
    searchPlaceholder: "搜尋動效名稱，例如 headroom",
    empty: "找不到符合的動效，換個名稱或別稱試試。",
    aka: "別稱",
    blocks: "對應 block",
    planned: "規劃中",
    play: "播放",
    libTitle: "在程式裡用同一套節奏",
    libBody: "`sunui-motion` 是一個小函式庫，包含三種彈簧和本頁允許的動態（按壓、蓋章、輕搖、面板、清單收合、數字滾動）。每個工具都有減少動態的版本。刻意不提供上浮淡入、脈動與彩紙。",
    libUsage: "安裝到 `lib/sunui-motion.ts`。可匯入 `springs`、`press`、`stamp`、`useShake`、`panel`、`listItem`、`roll`。",
    sourcesTitle: "延伸閱讀",
    sourcesBody: "這兩個公開收藏適合用來認識動效名稱、看實際效果。它們大部分的效果在這裡屬於「不用」；請當成詞彙表，不是採購清單。",
  },
  "zh-CN": {
    title: "动效辞典",
    metaDescription: "常见网页动效名称与 SunUI 对每一个的立场：允许、限定或不用，附替代做法与对应 block。",
    lead: "动效都有名字：Fade Up、Odometer、Headroom、Confetti。这页列出常见的名称，并写明 SunUI 对每一个的立场。你和你的 AI 代理可以直接用名称提需求，得到符合设计规则的答案。",
    rulesTitle: "所有判定背后的四条规则",
    rules: [
      "只在响应用户操作或数据改变时动。页面加载不淡入，闲置时不循环（倒数与加载除外）。",
      "不用渐变、光晕、模糊、彩色阴影。",
      "盖章是唯一的庆祝。",
      "单次动画在 400ms 内；减少动态时改成立即切换，信息不能丢失。",
    ],
    legend: {
      allow: { label: "允许", body: "照说明的方式使用。" },
      limit: { label: "限定", body: "只在说明的情境使用。" },
      avoid: { label: "不用", body: "SunUI 不做。说明写了替代方案。" },
    },
    filterLabel: "按立场筛选",
    all: "全部",
    searchLabel: "搜索动效",
    searchPlaceholder: "搜索动效名称，例如 headroom",
    empty: "找不到符合的动效，换个名称或别称试试。",
    aka: "别称",
    blocks: "对应 block",
    planned: "规划中",
    play: "播放",
    libTitle: "在代码里用同一套节奏",
    libBody: "`sunui-motion` 是一个小函数库，包含三种弹簧和本页允许的动态（按压、盖章、轻摇、面板、列表收合、数字滚动）。每个工具都有减少动态的版本。刻意不提供上浮淡入、脉动与彩纸。",
    libUsage: "安装到 `lib/sunui-motion.ts`。可导入 `springs`、`press`、`stamp`、`useShake`、`panel`、`listItem`、`roll`。",
    sourcesTitle: "延伸阅读",
    sourcesBody: "这两个公开收藏适合用来认识动效名称、看实际效果。它们大部分的效果在这里属于“不用”；请当成词汇表，不是采购清单。",
  },
  ja: {
    title: "モーション辞典",
    metaDescription: "よく使われる Web モーションの名前と、それぞれに対する SunUI の立場（使う・条件付き・使わない）、代わりの方法と対応ブロック。",
    lead: "モーションには名前があります。Fade Up、Odometer、Headroom、Confetti。このページはよく使われる名前を並べ、それぞれに対する SunUI の立場を示します。あなたや AI エージェントが名前で頼めば、デザインルールに沿った答えが返ります。",
    rulesTitle: "すべての判定の元になる 4 つのルール",
    rules: [
      "動くのはユーザー操作かデータの変化に応えるときだけ。読み込み時にフェードせず、待機中にループしません（カウントダウンと読み込みは例外）。",
      "グラデーション、発光、ぼかし、色付きの影は使いません。",
      "お祝いはスタンプだけです。",
      "1 回のアニメーションは 400ms 以内。動きを減らす設定では即座に切り替え、情報は失いません。",
    ],
    legend: {
      allow: { label: "使う", body: "説明どおりに使います。" },
      limit: { label: "条件付き", body: "説明の場面でだけ使います。" },
      avoid: { label: "使わない", body: "SunUI では使いません。代わりの方法を書いています。" },
    },
    filterLabel: "立場で絞り込む",
    all: "すべて",
    searchLabel: "モーションを検索",
    searchPlaceholder: "モーション名で検索（例：headroom）",
    empty: "該当するモーションがありません。別の名前や別名で試してください。",
    aka: "別名",
    blocks: "対応ブロック",
    planned: "予定",
    play: "再生",
    libTitle: "コードでも同じリズムを使う",
    libBody: "`sunui-motion` は 3 種類のスプリングと、このページで許可しているモーション（押し込み、スタンプ、シェイク、パネル、リストの折りたたみ、数字の回転）をまとめた小さなライブラリです。すべてに動きを減らす設定用の経路があります。フェードアップ、パルス、紙吹雪は意図的に入れていません。",
    libUsage: "`lib/sunui-motion.ts` に入ります。`springs`、`press`、`stamp`、`useShake`、`panel`、`listItem`、`roll` を import できます。",
    sourcesTitle: "参考資料",
    sourcesBody: "次の 2 つの公開コレクションは、モーションの名前を覚えたり動きを見たりするのに便利です。効果の多くはここでは「使わない」に当たります。買い物リストではなく語彙集として使ってください。",
  },
};

export const motionSources = [
  { name: "ShowMotion", url: "https://showmotion.bohehub.com/zh-hant/" },
  { name: "Motion Library", url: "https://kittenjam-motion-library.vercel.app/" },
];
