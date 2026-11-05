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

const works: WaterfallWork[] = seeds.map((s, i) => {
  const [sky, ground, sun] = palettes[i % palettes.length];
  return { ...s, id: `work-${i}`, art: <Scene sky={sky} ground={ground} sun={sun} /> };
});

export default function WaterfallShowcaseDemo() {
  return (
    <section aria-label="Works made on this site" className="relative w-full min-w-0 py-6">
      <WaterfallShowcase works={works} fixed={false} />
    </section>
  );
}
