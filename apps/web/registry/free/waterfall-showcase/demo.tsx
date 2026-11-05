"use client";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { WaterfallShowcase, type WaterfallWork } from "./waterfall-showcase";

// 示意畫面：漸層天空加上簡單的剪影，代替實際生成的作品
function Scene({ sky, ground, sun }: { sky: string; ground: string; sun: string }) {
  return (
    <div className="absolute inset-0" style={{ background: sky }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" aria-hidden>
        <circle cx="68" cy="34" r="11" fill={sun} opacity="0.85" />
        <path d="M0 78 Q22 60 44 72 T100 66 V100 H0Z" fill={ground} opacity="0.7" />
        <path d="M0 88 Q30 76 60 86 T100 82 V100 H0Z" fill={ground} />
      </svg>
    </div>
  );
}

const palettes = [
  ["linear-gradient(180deg,#fbc7a4,#f6e3c5)", "#7a4b3a", "#fff4dc"],
  ["linear-gradient(180deg,#1e2a4a,#4b5d8f)", "#0e1426", "#e9e4c9"],
  ["linear-gradient(180deg,#c9e4de,#f2efe4)", "#5b7f6e", "#ffffff"],
  ["linear-gradient(180deg,#3a1c4a,#c0587e)", "#1d0f26", "#ffd29a"],
  ["linear-gradient(180deg,#a7c5eb,#e7eef8)", "#41608a", "#fffbe8"],
] as const;

const seeds: Omit<WaterfallWork, "id" | "art">[] = [
  { width: 768, height: 1024, styleName: "Watercolor", text: "A cat napping on a sunny windowsill, soft afternoon light", prompt: "watercolor illustration, a ginger cat asleep on a wooden windowsill, warm afternoon sunlight, soft edges, paper texture", model: "SDXL Base" },
  { width: 768, height: 768, styleName: "Ink wash" },
  { width: 768, height: 1152, styleName: "Anime", text: "A girl waiting for the last train in the snow", prompt: "anime style, girl in a red scarf on an empty platform, falling snow, sodium lights, cinematic framing", model: "Animagine XL" },
  { width: 1024, height: 768, styleName: "Oil painting", text: "Grandma's vegetable garden at dawn", prompt: "impressionist oil painting, small vegetable garden at dawn, mist, rows of cabbages, golden rim light", model: "SDXL Base" },
  { width: 768, height: 960, styleName: "Flat vector" },
  { width: 768, height: 1024, styleName: "Pixel art", text: "A tiny bakery on a rainy street corner", prompt: "pixel art, cozy bakery storefront on a rainy corner, glowing windows, reflections on wet cobblestones", model: "Pixel XL" },
  { width: 768, height: 768, styleName: "Pastel", text: "Two friends sharing an umbrella", prompt: "pastel illustration, two friends under one yellow umbrella, light rain, gentle smiles, muted palette", model: "SDXL Base" },
  { width: 768, height: 1152, styleName: "Ukiyo-e" },
  { width: 1024, height: 768, styleName: "Studio photo", text: "A ceramic mug of tea on a linen cloth", prompt: "product photo, handmade ceramic mug of green tea on natural linen, soft window light, shallow depth of field", model: "Juggernaut XL" },
  { width: 768, height: 1024, styleName: "Storybook", text: "A fox reading a map under a lantern", prompt: "storybook illustration, a small fox reading a paper map by lantern light in a forest clearing, cozy, detailed", model: "SDXL Base" },
];

// 各語言的風格名稱與原句，依 seeds 順序；提示詞維持英文
const copy = {
  en: {
    region: "Works made on this site",
    styles: ["Watercolor", "Ink wash", "Anime", "Oil painting", "Flat vector", "Pixel art", "Pastel", "Ukiyo-e", "Studio photo", "Storybook"],
    texts: [
      "A cat napping on a sunny windowsill, soft afternoon light",
      "",
      "A girl waiting for the last train in the snow",
      "Grandma's vegetable garden at dawn",
      "",
      "A tiny bakery on a rainy street corner",
      "Two friends sharing an umbrella",
      "",
      "A ceramic mug of tea on a linen cloth",
      "A fox reading a map under a lantern",
    ],
  },
  "zh-TW": {
    region: "在本站創作的作品",
    styles: ["水彩", "水墨", "動漫", "油畫", "扁平向量", "像素藝術", "粉彩", "浮世繪", "棚拍攝影", "繪本"],
    texts: [
      "一隻貓在灑滿陽光的窗台上午睡，午後光線柔和",
      "",
      "一個女孩在雪中等末班車",
      "清晨的阿嬤菜園",
      "",
      "雨天街角的一間小麵包店",
      "兩個朋友共撐一把傘",
      "",
      "亞麻布上的一杯陶瓷馬克杯熱茶",
      "一隻狐狸在燈籠下看地圖",
    ],
  },
  "zh-CN": {
    region: "在本站创作的作品",
    styles: ["水彩", "水墨", "动漫", "油画", "扁平矢量", "像素艺术", "粉彩", "浮世绘", "棚拍摄影", "绘本"],
    texts: [
      "一只猫在洒满阳光的窗台上午睡，午后光线柔和",
      "",
      "一个女孩在雪中等末班车",
      "清晨的外婆菜园",
      "",
      "雨天街角的一家小面包店",
      "两个朋友共撑一把伞",
      "",
      "亚麻布上的一杯陶瓷马克杯热茶",
      "一只狐狸在灯笼下看地图",
    ],
  },
  ja: {
    region: "このサイトで作られた作品",
    styles: ["水彩", "水墨画", "アニメ", "油絵", "フラットベクター", "ピクセルアート", "パステル", "浮世絵", "スタジオ写真", "絵本"],
    texts: [
      "日だまりの窓辺で昼寝する猫、やわらかな午後の光",
      "",
      "雪の中で終電を待つ少女",
      "夜明けのおばあちゃんの家庭菜園",
      "",
      "雨の街角にある小さなパン屋",
      "ひとつの傘に入る二人の友だち",
      "",
      "リネンの上に置いた陶器のマグのお茶",
      "ランタンの下で地図を読むキツネ",
    ],
  },
};

export default function WaterfallShowcaseDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const works: WaterfallWork[] = seeds.map((s, i) => {
    const [sky, ground, sun] = palettes[i % palettes.length];
    return {
      ...s,
      styleName: t.styles[i],
      text: s.text ? t.texts[i] : undefined,
      id: `work-${i}`,
      art: <Scene sky={sky} ground={ground} sun={sun} />,
    };
  });

  return (
    <section aria-label={t.region} className="relative w-full min-w-0 py-6">
      <WaterfallShowcase works={works} fixed={false} locale={locale} />
    </section>
  );
}
