"use client";

import { useDemoText } from "@/lib/demo-locale";
import { cn } from "@/lib/utils";

import { BrushReveal } from "./brush-reveal";

// 示範照片（AI 生成），放在 public/blocks/brush-reveal：同一盞檯燈的方格紙鉛筆線稿與夜間點燈實拍，兩張像素對齊
const sketch = "/blocks/brush-reveal/lamp-sketch.webp";
const finished = "/blocks/brush-reveal/lamp-finished.webp";

const copy = {
  en: {
    lampAlt: "Pencil sketch of a desk lamp on grid paper",
    lampRevealAlt: "The finished desk lamp in amber, lit at night",
    lampCaption: "Arc desk lamp, from sketch to finish",
    lampHint: "Move the pointer across the sketch to see the finished lamp. When focused, the finished lamp shows.",
    inkEyebrow: "Members' night",
    inkTitle: "Something is under the ink",
    inkLead: "Brush over the card to read it.",
    offerEyebrow: "Friday, 8 pm to midnight",
    offerTitle: "Extra 15% off everything",
    offerCode: "INK15",
    offerNote: "Code works once per account, on top of sale prices.",
    inkHint: "Brush over the card to uncover the members' offer. When focused, the offer shows.",
    stayTitle: "Draw your own window",
    stayLead: "Strokes stay. A gift box waits behind the frost.",
    stayReveal: "Free gift wrap on every order this week",
    stayHint: "Paint across the frosted panel to clear it. When focused, the message shows.",
  },
  "zh-TW": {
    lampAlt: "方格紙上的檯燈鉛筆線稿",
    lampRevealAlt: "完成後的琥珀色檯燈，夜裡點亮",
    lampCaption: "弧臂檯燈，從線稿到成品",
    lampHint: "把游標移過線稿就能看到成品。聚焦時會直接顯示成品。",
    inkEyebrow: "會員之夜",
    inkTitle: "墨水底下藏了東西",
    inkLead: "刷過卡片就看得到。",
    offerEyebrow: "週五晚上 8 點到午夜",
    offerTitle: "全館再折 15%",
    offerCode: "INK15",
    offerNote: "每個帳號限用一次，可與特價併用。",
    inkHint: "刷過卡片就能看到會員優惠。聚焦時會直接顯示優惠。",
    stayTitle: "畫出你的窗",
    stayLead: "筆跡會留著，霧面後面有一個禮物盒。",
    stayReveal: "本週每筆訂單免費禮品包裝",
    stayHint: "在霧面上塗抹就能擦亮。聚焦時會直接顯示訊息。",
  },
  "zh-CN": {
    lampAlt: "方格纸上的台灯铅笔线稿",
    lampRevealAlt: "完成后的琥珀色台灯，夜里点亮",
    lampCaption: "弧臂台灯，从线稿到成品",
    lampHint: "把光标移过线稿就能看到成品。聚焦时会直接显示成品。",
    inkEyebrow: "会员之夜",
    inkTitle: "墨水底下藏了东西",
    inkLead: "刷过卡片就看得到。",
    offerEyebrow: "周五晚上 8 点到午夜",
    offerTitle: "全场再打 85 折",
    offerCode: "INK15",
    offerNote: "每个账号限用一次，可与特价叠加。",
    inkHint: "刷过卡片就能看到会员优惠。聚焦时会直接显示优惠。",
    stayTitle: "画出你的窗",
    stayLead: "笔迹会留着，雾面后面有一个礼物盒。",
    stayReveal: "本周每笔订单免费礼品包装",
    stayHint: "在雾面上涂抹就能擦亮。聚焦时会直接显示信息。",
  },
  ja: {
    lampAlt: "方眼紙に描いたデスクランプの鉛筆スケッチ",
    lampRevealAlt: "完成したアンバー色のデスクランプ、夜に点灯",
    lampCaption: "アームのデスクランプ、スケッチから完成まで",
    lampHint: "スケッチの上でポインターを動かすと完成品が見えます。フォーカス時は完成品を表示します。",
    inkEyebrow: "会員ナイト",
    inkTitle: "インクの下に何かがあります",
    inkLead: "カードをなぞると読めます。",
    offerEyebrow: "金曜 20 時から深夜 0 時まで",
    offerTitle: "全品さらに 15% オフ",
    offerCode: "INK15",
    offerNote: "1 アカウント 1 回まで、セール価格と併用できます。",
    inkHint: "カードをなぞると会員特典が見えます。フォーカス時は特典を表示します。",
    stayTitle: "自分の窓を描く",
    stayLead: "描いた跡は残ります。曇りガラスの奥にギフトボックス。",
    stayReveal: "今週はすべての注文でギフト包装無料",
    stayHint: "曇ったパネルをなぞると晴れます。フォーカス時はメッセージを表示します。",
  },
};

/** 線稿刷出上色版：完整 demo 的主圖，也是首頁型錄卡片（card.tsx）的內容 */
export function LampReveal({ className, wide = false }: { className?: string; wide?: boolean }) {
  const t = useDemoText(copy);
  return (
    <figure className={className}>
      <BrushReveal
        hint={t.lampHint}
        brushSize={120}
        className={cn("aspect-[16/10] rounded-xl border border-border", wide && "sm:aspect-[16/7]")}
        reveal={<img src={finished} alt={t.lampRevealAlt} className="h-full w-full object-cover" draggable={false} />}
      >
        <img src={sketch} alt={t.lampAlt} className="h-full w-full object-cover" draggable={false} />
      </BrushReveal>
      <figcaption className="mt-2 text-sm text-muted-foreground">{t.lampCaption}</figcaption>
    </figure>
  );
}

export default function BrushRevealDemo() {
  const t = useDemoText(copy);
  return (
    <div className="grid w-full max-w-5xl gap-5 p-4 sm:grid-cols-2">
      <LampReveal className="sm:col-span-2" wide />

      <BrushReveal
        shape="ink"
        fade={2400}
        brushSize={110}
        hint={t.inkHint}
        className="min-h-56 rounded-xl border border-border"
        reveal={
          <div className="flex h-full flex-col justify-between bg-foreground p-6 text-background">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] opacity-70">{t.offerEyebrow}</p>
            <div>
              <p className="text-2xl font-semibold tracking-tight">{t.offerTitle}</p>
              <p className="mt-2 font-mono text-lg tracking-[0.12em]">{t.offerCode}</p>
              <p className="mt-1 text-sm opacity-70">{t.offerNote}</p>
            </div>
          </div>
        }
      >
        <div className="flex h-full min-h-56 flex-col justify-between bg-card p-6">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{t.inkEyebrow}</p>
          <div>
            <p className="text-2xl font-semibold tracking-tight">{t.inkTitle}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t.inkLead}</p>
          </div>
        </div>
      </BrushReveal>

      <BrushReveal
        fade={0}
        brushSize={70}
        hint={t.stayHint}
        className="min-h-56 rounded-xl border border-border"
        reveal={
          <div className="flex h-full flex-col items-center justify-center gap-3 bg-background p-6 text-center">
            <svg viewBox="0 0 48 48" className="h-12 w-12" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
              <rect x="8" y="18" width="32" height="22" rx="2" />
              <path d="M6 12h36v6H6zM24 12v28M24 12c-3-6-11-6-9 0M24 12c3-6 11-6 9 0" />
            </svg>
            <p className="max-w-[16em] text-lg font-semibold tracking-tight">{t.stayReveal}</p>
          </div>
        }
      >
        <div className="flex h-full min-h-56 flex-col justify-end bg-muted p-6">
          <p className="text-2xl font-semibold tracking-tight">{t.stayTitle}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t.stayLead}</p>
        </div>
      </BrushReveal>
    </div>
  );
}
