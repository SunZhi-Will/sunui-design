"use client";

import { AnimatePresence, motion } from "framer-motion";

import { useDemoText } from "@/lib/demo-locale";

import { BentoTile, LiveBento, springs, useTicker } from "./live-bento";

// Feature section of a component library home page: four tiles, each with a mini screen showing a real feature.
// Mini screens replay only on screen and in a visible tab; with reduced motion they rest on the final, fully informative frame.

export const demoCopy = {
  en: {
    heading: "Built for the details you would otherwise skip",
    intro: "Every block reads your shadcn theme, ships with copy in four languages and moves with the same three springs.",
    tiles: [
      ["One command, your code", "Blocks install through the shadcn CLI as plain files you own. No package to keep in sync."],
      ["Respects reduced motion", "When the system asks for less motion, numbers still update. They just stop bouncing."],
      ["Copy in four languages", "English, Traditional and Simplified Chinese, and Japanese. Layouts hold when a label gets longer."],
      ["Agents find the right block", "The MCP server searches by what you need, not by component name, and answers with the install command."],
    ],
    reduce: "Reduce motion",
    cart: "Cart",
    items: (n: number) => `${n} items`,
    query: "coupon section for a launch page",
    searching: "Searching",
    results: (n: number) => `${n} results`,
  },
  "zh-TW": {
    heading: "那些平常會略過的細節，都先做好了",
    intro: "每個區塊都讀你的 shadcn 主題，附四種語言的文案，動起來用的是同一組三種彈簧。",
    tiles: [
      ["一行指令，程式碼歸你", "透過 shadcn CLI 安裝，拿到的是你自己的檔案，沒有套件要跟著升級。"],
      ["尊重減少動態效果", "系統要求減少動態時，數字照樣更新，只是不再彈跳。"],
      ["四種語言的文案", "英文、繁體中文、簡體中文與日文。標籤變長時版面也不會跑掉。"],
      ["AI 代理找得到對的區塊", "MCP 伺服器依你的需求搜尋，不必知道元件名稱，直接回傳安裝指令。"],
    ],
    reduce: "減少動態效果",
    cart: "購物袋",
    items: (n: number) => `${n} 件`,
    query: "新品上市頁的領券區",
    searching: "搜尋中",
    results: (n: number) => `${n} 筆結果`,
  },
  "zh-CN": {
    heading: "那些平常会略过的细节，都先做好了",
    intro: "每个区块都读取你的 shadcn 主题，附四种语言的文案，动起来用的是同一组三种弹簧。",
    tiles: [
      ["一行命令，代码归你", "通过 shadcn CLI 安装，拿到的是你自己的文件，没有依赖包要跟着升级。"],
      ["尊重减弱动态效果", "系统要求减弱动态时，数字照样更新，只是不再弹跳。"],
      ["四种语言的文案", "英文、繁体中文、简体中文和日文。标签变长时布局也不会乱。"],
      ["AI 智能体找得到对的区块", "MCP 服务器按你的需求搜索，不必知道组件名称，直接返回安装命令。"],
    ],
    reduce: "减弱动态效果",
    cart: "购物袋",
    items: (n: number) => `${n} 件`,
    query: "新品上市页的领券区",
    searching: "搜索中",
    results: (n: number) => `${n} 条结果`,
  },
  ja: {
    heading: "見落としがちな細部まで、先に仕上げてあります",
    intro: "どのブロックも shadcn のテーマを読み込み、四つの言語の文言付き。動きは同じ三種類のスプリングで統一。",
    tiles: [
      ["コマンドひとつ、コードは手元に", "shadcn CLI でインストールすると、自分のファイルとして手に入ります。追従すべきパッケージはありません。"],
      ["視差効果を減らす設定に対応", "システムが動きを減らすよう求めても数字は更新されます。弾まなくなるだけです。"],
      ["四つの言語の文言", "英語、繁体字・簡体字中国語、日本語。ラベルが長くなってもレイアウトは崩れません。"],
      ["エージェントが最適なブロックを発見", "MCP サーバーはコンポーネント名ではなく目的で検索し、インストールコマンドを返します。"],
    ],
    reduce: "視差効果を減らす",
    cart: "カート",
    items: (n: number) => `${n} 点`,
    query: "新商品ローンチページのクーポン欄",
    searching: "検索中",
    results: (n: number) => `${n} 件の結果`,
  },
};

type Copy = (typeof demoCopy)["en"];

const E1 =
  "shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.05)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_1px_rgb(255_255_255/0.08)]";
const SPOT_BG = "bg-[color:var(--sunui-spot,var(--primary))] text-[color:var(--sunui-spot-foreground,var(--primary-foreground))]";
const INSET = "bg-muted shadow-[inset_0_1px_2px_rgb(0_0_0/0.06)]";

function Icon({ d, className }: { d: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={className}>
      <path d={d} />
    </svg>
  );
}

const CHECK = "M5 12.5l4.5 4.5L19 7.5";
const BAG = "M5 8h14l-1 12H6L5 8zM9 8V6a3 3 0 0 1 6 0v2";
const SEARCH = "M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4";

/* ---------- 1. Install: command and output appear line by line, height reserved so layout does not shift ---------- */

const INSTALL_LINES = [
  { mark: "", text: "Resolving @sunui/coupon-wallet" },
  { mark: "+", text: "components/ui/coupon-wallet.tsx" },
  { mark: "+", text: "components/ui/stamp.tsx" },
  { mark: "=", text: "lib/utils.ts (unchanged)" },
];

export function InstallVisual() {
  const { ref, step, playing } = useTicker(800, 7);
  return (
    <div ref={ref} className={`w-full max-w-md rounded-lg bg-card p-4 font-mono text-xs leading-6 ${E1}`}>
      <p className="break-all">
        <span className="text-muted-foreground">$ </span>npx shadcn add @sunui/coupon-wallet
      </p>
      {INSTALL_LINES.map((line, i) => (
        <motion.p
          key={line.text}
          initial={false}
          animate={step > i ? { opacity: 1, y: 0 } : { opacity: 0, y: 4 }}
          transition={playing ? springs.gentle : { duration: 0 }}
          className="flex min-w-0 gap-2 text-muted-foreground"
        >
          <span className="w-2 shrink-0 text-foreground">{line.mark}</span>
          <span className="truncate">{line.text}</span>
        </motion.p>
      ))}
      <motion.p
        initial={false}
        animate={step > 4 ? { opacity: 1, y: 0 } : { opacity: 0, y: 4 }}
        transition={playing ? springs.gentle : { duration: 0 }}
        className="mt-1 flex items-center gap-2 font-sans text-sm font-medium"
      >
        <span className={`grid size-4 place-items-center rounded-full shadow-[inset_0_1px_0_rgb(255_255_255/0.12)] ${SPOT_BG}`}>
          <Icon d={CHECK} className="size-3" />
        </span>
        Done in <span className="tabular-nums">1.8s</span>
      </motion.p>
    </div>
  );
}

/* ---------- 2. Reduced motion: for the first four beats the badge number bounces; once the switch is on, only the number changes ---------- */

export function MotionVisual({ t }: { t: Copy }) {
  const { ref, step, playing } = useTicker(1000, 8);
  const on = step >= 4;
  const count = 3 + step;
  return (
    <div ref={ref} className={`w-full max-w-60 divide-y divide-foreground/10 rounded-lg bg-card ${E1}`}>
      <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
        <span className="truncate">{t.reduce}</span>
        <span className={`flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200 ${on ? SPOT_BG : INSET}`}>
          <motion.span
            initial={false}
            animate={{ x: on ? 16 : 0 }}
            transition={playing ? springs.snappy : { duration: 0 }}
            className="size-4 rounded-full bg-card shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.1)]"
          />
        </span>
      </div>
      <div className="flex items-center gap-3 px-3 py-2.5 text-sm">
        <span className="relative">
          <Icon d={BAG} className="size-5" />
          <motion.span
            key={count}
            initial={playing && !on ? { scale: 1.25 } : false}
            animate={{ scale: 1 }}
            transition={springs.pop}
            className={`absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-semibold tabular-nums shadow-[inset_0_1px_0_rgb(255_255_255/0.12)] ${SPOT_BG}`}
          >
            {count}
          </motion.span>
        </span>
        <span className="ml-1 flex-1 truncate">{t.cart}</span>
        <span className="tabular-nums text-muted-foreground">{t.items(count)}</span>
      </div>
    </div>
  );
}

/* ---------- 3. Four languages: product name and button change language, the price is the fixed anchor ---------- */

const LANGS = [
  { chip: "EN", name: "Linen tote", cta: "Add to bag" },
  { chip: "繁中", name: "亞麻托特包", cta: "加入購物袋" },
  { chip: "简中", name: "亚麻托特包", cta: "加入购物袋" },
  { chip: "日本語", name: "リネントート", cta: "カートに入れる" },
];

function Swap({ text, playing }: { text: string; playing: boolean }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={text}
        initial={playing ? { opacity: 0, y: 4 } : false}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, transition: { duration: 0.1 } }}
        transition={springs.gentle}
        className="block truncate"
      >
        {text}
      </motion.span>
    </AnimatePresence>
  );
}

export function LanguageVisual() {
  const { ref, step, playing } = useTicker(1700, 4);
  const idx = (step + 1) % LANGS.length;
  const lang = LANGS[idx];
  return (
    <div ref={ref} className={`w-full max-w-60 space-y-3 rounded-lg bg-card p-3 ${E1}`}>
      <div className={`relative grid grid-cols-4 rounded-md p-0.5 text-[11px] ${INSET}`}>
        <motion.span
          initial={false}
          animate={{ x: `${idx * 100}%` }}
          transition={playing ? springs.snappy : { duration: 0 }}
          className={`absolute inset-y-0.5 left-0.5 w-[calc((100%-4px)/4)] rounded-[4px] bg-card ${E1}`}
        />
        {LANGS.map((l, i) => (
          <span key={l.chip} className={`relative py-1 text-center ${i === idx ? "font-medium" : "text-muted-foreground"}`}>
            {l.chip}
          </span>
        ))}
      </div>
      <div className="flex items-center gap-3">
        <span className="size-10 shrink-0 rounded-md bg-muted" />
        <span className="min-w-0 flex-1 text-sm font-medium">
          <Swap text={lang.name} playing={playing} />
        </span>
        <span className="text-sm tabular-nums">$48</span>
      </div>
      <span className="flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]">
        <Swap text={lang.cta} playing={playing} />
      </span>
    </div>
  );
}

/* ---------- 4. Agent search: query, score bars grow, first place in the brand spot colour ---------- */

const RESULTS = [
  { name: "coupon-wallet", score: 0.94 },
  { name: "countdown-banner", score: 0.78 },
  { name: "announcement-strip", score: 0.61 },
];

export function AgentVisual({ t }: { t: Copy }) {
  const { ref, step, playing } = useTicker(1100, 5);
  const shown = step > 0;
  return (
    <div ref={ref} className={`w-full max-w-md rounded-lg bg-card p-3 ${E1}`}>
      <div className={`flex h-8 items-center gap-2 rounded-md px-2.5 text-sm ${INSET}`}>
        <Icon d={SEARCH} className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate">{t.query}</span>
      </div>
      <p className="mt-2.5 flex justify-between gap-2 px-0.5 font-mono text-[11px] text-muted-foreground">
        <span>search_blocks</span>
        <span className="tabular-nums">{shown ? t.results(RESULTS.length) : t.searching}</span>
      </p>
      <ul className="mt-1.5 space-y-1">
        {RESULTS.map((r, i) => (
          <li key={r.name} className={`flex items-center gap-3 rounded-md px-2 py-1.5 ${i === 0 && shown ? "bg-muted" : ""}`}>
            <span className={`w-32 shrink-0 truncate font-mono sm:w-36 text-xs ${i === 0 ? "font-medium" : "text-muted-foreground"}`}>{r.name}</span>
            <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-foreground/10">
              <motion.span
                initial={false}
                animate={{ scaleX: shown ? r.score : 0 }}
                transition={playing ? { ...springs.gentle, delay: i * 0.06 } : { duration: 0 }}
                style={{ originX: 0 }}
                className={`block h-full rounded-full ${i === 0 ? "bg-[color:var(--sunui-spot,var(--primary))]" : "bg-foreground/30"}`}
              />
            </span>
            <span className="w-8 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{shown ? `${Math.round(r.score * 100)}%` : ""}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function LiveBentoDemo() {
  const t = useDemoText(demoCopy);
  return (
    <section className="w-full max-w-5xl min-w-0">
      <div className="mb-8 max-w-xl">
        <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">{t.heading}</h2>
        <p className="mt-3 text-pretty text-muted-foreground">{t.intro}</p>
      </div>
      <LiveBento>
        <BentoTile wide title={t.tiles[0][0]} body={t.tiles[0][1]}>
          <InstallVisual />
        </BentoTile>
        <BentoTile title={t.tiles[1][0]} body={t.tiles[1][1]}>
          <MotionVisual t={t} />
        </BentoTile>
        <BentoTile title={t.tiles[2][0]} body={t.tiles[2][1]}>
          <LanguageVisual />
        </BentoTile>
        <BentoTile wide title={t.tiles[3][0]} body={t.tiles[3][1]}>
          <AgentVisual t={t} />
        </BentoTile>
      </LiveBento>
    </section>
  );
}
