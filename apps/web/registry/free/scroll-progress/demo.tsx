"use client";

import { useRef } from "react";

import { cn } from "@/lib/utils";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { ScrollProgress } from "./scroll-progress";

const paper = "bg-[#faf7f0] dark:bg-[#1f1c18]";
const edge = "border-[#e7e0d0] dark:border-[#38332b]";
const ink = "text-[#1c1917] dark:text-[#ece7dc]";
const inkMuted = "text-[#1c1917]/65 dark:text-[#ece7dc]/65";

type Chapter = { id: string; label: string; title: string; body: string[] };

const copy: Record<"en" | "zh-TW" | "zh-CN" | "ja", { eyebrow: string; heading: string; outro: string; chapters: Chapter[] }> = {
  en: {
    eyebrow: "Care guide",
    heading: "Looking after your linen",
    outro: "Questions about a specific piece? Reply to your order email and we will help.",
    chapters: [
  {
    id: "care-wash",
    label: "Washing",
    title: "Washing",
    body: [
      "Machine wash at 30°C on a gentle cycle with similar colors. Linen softens with every wash, so there is no need for fabric softener; it coats the fibers and slows that process down.",
      "Use a mild liquid detergent without bleach or optical brighteners. Undyed and natural colors can yellow slightly if brighteners build up over time.",
      "Turn shirts inside out and fasten the buttons. It keeps the placket flat and stops buttons from catching on other pieces in the drum.",
    ],
  },
  {
    id: "care-dry",
    label: "Drying",
    title: "Drying",
    body: [
      "Line dry in the shade whenever you can. Give each piece a firm shake before hanging it; most of the creases fall out on their own as it dries.",
      "If you need the dryer, use low heat and take everything out while it is still slightly damp. Over-drying is what makes linen feel stiff and brittle.",
      "Expect up to 3% shrinkage after the first wash. Our sizes already allow for it.",
    ],
  },
  {
    id: "care-press",
    label: "Pressing",
    title: "Pressing",
    body: [
      "Linen is meant to look lived in, but if you prefer a crisp collar, iron on the linen setting while the fabric is damp.",
      "Press dark colors on the reverse side to avoid a shine on the surface. A pressing cloth works too.",
    ],
  },
  {
    id: "care-store",
    label: "Storing",
    title: "Storing",
    body: [
      "Store clean and completely dry, folded loosely or on wide wooden hangers. Avoid plastic covers; linen needs air to stay fresh between seasons.",
      "Refold along different lines now and then so the same crease does not set in.",
      "Keep linen away from direct sunlight in storage. Natural dyes and undyed fibers fade unevenly where light falls on a fold.",
    ],
  },
],
  },
  "zh-TW": {
    eyebrow: "保養指南",
    heading: "照顧你的亞麻衣物",
    outro: "對某件衣物有疑問嗎？直接回覆訂單信件，我們會協助你。",
    chapters: [
      {
        id: "care-wash",
        label: "洗滌",
        title: "洗滌",
        body: [
          "以 30°C 溫和行程機洗，與相近顏色的衣物一起洗。亞麻每洗一次就更柔軟，不需要柔軟精；柔軟精會包覆纖維，反而拖慢這個過程。",
          "使用不含漂白劑與螢光增白劑的溫和液體洗劑。原色與自然色的布料，若長期累積增白劑，可能會微微泛黃。",
          "襯衫翻面並扣好鈕扣。前襟能保持平整，鈕扣也不會在洗衣槽裡勾到其他衣物。",
        ],
      },
      {
        id: "care-dry",
        label: "晾乾",
        title: "晾乾",
        body: [
          "盡量在陰涼處吊掛晾乾。晾之前用力甩幾下，大部分皺褶會在乾燥時自己消失。",
          "若要用烘衣機，請選低溫，並在衣物還微濕時取出。烘得太乾才是亞麻變硬、變脆的原因。",
          "第一次洗後可能縮水約 3%，我們的尺寸已預留這個空間。",
        ],
      },
      {
        id: "care-press",
        label: "熨燙",
        title: "熨燙",
        body: [
          "亞麻本來就適合帶點生活感，但若喜歡挺括的領子，可趁布料微濕時用亞麻檔熨燙。",
          "深色衣物請從反面熨燙，避免表面出現亮光；墊一塊熨布也可以。",
        ],
      },
      {
        id: "care-store",
        label: "收納",
        title: "收納",
        body: [
          "洗淨並完全乾燥後再收納，輕輕摺疊或掛在寬木衣架上。避免使用塑膠套，亞麻需要透氣才能在換季之間保持清爽。",
          "偶爾換個位置重新摺疊，以免同一道摺痕定型。",
          "收納時避開陽光直射。天然染料與原色纖維在摺痕受光處會褪色不均。",
        ],
      },
    ],
  },
  "zh-CN": {
    eyebrow: "护理指南",
    heading: "好好照顾你的亚麻衣物",
    outro: "对某件衣物有疑问？直接回复订单邮件，我们会帮你处理。",
    chapters: [
      {
        id: "care-wash",
        label: "洗涤",
        title: "洗涤",
        body: [
          "用 30°C 轻柔模式机洗，和颜色相近的衣物一起洗。亚麻每洗一次就更柔软，不需要柔顺剂；柔顺剂会包裹纤维，反而拖慢这个过程。",
          "使用不含漂白剂和荧光增白剂的温和洗衣液。本色和自然色的面料，增白剂长期残留可能会微微发黄。",
          "衬衫翻面并扣好纽扣。门襟能保持平整，纽扣也不会在滚筒里钩到其他衣物。",
        ],
      },
      {
        id: "care-dry",
        label: "晾干",
        title: "晾干",
        body: [
          "尽量在阴凉处挂起晾干。晾之前用力抖几下，大部分褶皱会在晾干过程中自然消失。",
          "如果要用烘干机，请选低温，并在衣物还略微潮湿时取出。烘得过干才是亚麻变硬、变脆的原因。",
          "首次洗涤后可能缩水约 3%，我们的尺码已经预留了这部分。",
        ],
      },
      {
        id: "care-press",
        label: "熨烫",
        title: "熨烫",
        body: [
          "亚麻本来就适合带点随性感，但如果喜欢挺括的领子，可以趁面料微湿时用亚麻挡熨烫。",
          "深色衣物请从反面熨烫，避免表面发亮；垫一块熨烫布也可以。",
        ],
      },
      {
        id: "care-store",
        label: "收纳",
        title: "收纳",
        body: [
          "洗净并完全干透后再收纳，轻轻折叠或挂在宽木衣架上。避免使用塑料罩，亚麻需要透气才能在换季期间保持清爽。",
          "偶尔换个位置重新折叠，免得同一道折痕定型。",
          "收纳时避开阳光直射。天然染料和本色纤维在折痕受光的地方会褪色不均。",
        ],
      },
    ],
  },
  ja: {
    eyebrow: "お手入れガイド",
    heading: "リネンを長く楽しむために",
    outro: "個別のアイテムについてのご質問は、ご注文メールにそのまま返信してください。",
    chapters: [
      {
        id: "care-wash",
        label: "洗濯",
        title: "洗濯",
        body: [
          "30°C の弱水流で、似た色のものと一緒に洗濯機で洗ってください。リネンは洗うたびに柔らかくなるので柔軟剤は不要です。繊維をコーティングして、その変化を遅らせてしまいます。",
          "漂白剤や蛍光増白剤を含まない中性の液体洗剤を使ってください。生成りやナチュラルカラーは、増白剤が蓄積するとわずかに黄ばむことがあります。",
          "シャツは裏返してボタンを留めておきましょう。前立てが平らに保たれ、ボタンがドラムの中でほかの衣類に引っかかりません。",
        ],
      },
      {
        id: "care-dry",
        label: "乾燥",
        title: "乾燥",
        body: [
          "できるだけ日陰で吊るして干してください。干す前にしっかり振っておけば、ほとんどのしわは乾くうちに自然と消えます。",
          "乾燥機を使う場合は低温にして、少し湿り気が残るうちに取り出してください。乾かしすぎがリネンを硬くもろくする原因です。",
          "初回の洗濯で最大 3% ほど縮みますが、サイズはそれを見込んで設計しています。",
        ],
      },
      {
        id: "care-press",
        label: "アイロン",
        title: "アイロン",
        body: [
          "リネンはこなれた風合いが魅力ですが、襟をぱりっとさせたいときは、湿っているうちに麻の設定でアイロンをかけてください。",
          "濃い色は表面のテカリを防ぐため裏からかけてください。当て布を使っても構いません。",
        ],
      },
      {
        id: "care-store",
        label: "保管",
        title: "保管",
        body: [
          "清潔で完全に乾いた状態で、ゆるくたたむか幅広の木製ハンガーに掛けて保管してください。ビニールカバーは避けましょう。季節をまたいでも爽やかに保つには通気が必要です。",
          "ときどきたたむ位置を変えて、同じ折り目がつかないようにしてください。",
          "保管中は直射日光を避けてください。天然染料や未染色の繊維は、折り目の光が当たる部分だけ色あせしやすくなります。",
        ],
      },
    ],
  },
};

export default function ScrollProgressDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const chapters = t.chapters;
  const scroller = useRef<HTMLDivElement>(null);

  return (
    <article className={cn("w-full max-w-2xl overflow-hidden rounded-md border", paper, edge, ink)}>
      <header className={cn("border-b px-6 pt-5 pb-3 sm:px-8", edge)}>
        <p className={cn("text-xs font-medium tracking-[0.14em] uppercase", inkMuted)}>{t.eyebrow}</p>
        <h2 className="mt-1 text-xl font-semibold tracking-tight">{t.heading}</h2>
        <ScrollProgress container={scroller} sections={chapters} position="static" showPercent locale={locale} className="mt-5" />
      </header>
      <div ref={scroller} className="relative h-[380px] overflow-y-auto px-6 py-6 sm:px-8">
        <div className="space-y-10">
          {chapters.map((c, i) => (
            <section key={c.id} id={c.id} className="scroll-mt-6">
              <h3 className="flex items-baseline gap-3 text-base font-semibold">
                <span className={cn("font-mono text-xs tabular-nums", inkMuted)}>{String(i + 1).padStart(2, "0")}</span>
                {c.title}
              </h3>
              {c.body.map((p) => (
                <p key={p} className={cn("mt-3 max-w-prose text-sm leading-7", inkMuted)}>
                  {p}
                </p>
              ))}
            </section>
          ))}
          <p className={cn("pb-32 text-sm", inkMuted)}>{t.outro}</p>
        </div>
      </div>
    </article>
  );
}
