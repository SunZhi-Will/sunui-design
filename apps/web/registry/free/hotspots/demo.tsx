"use client";

import { useDemoText } from "@/lib/demo-locale";

import { Hotspots } from "./hotspots";

const copy = {
  en: {
    name: "Waxed field jacket",
    price: "$184",
    hint: "Tap a number to see the detail.",
    spots: [
      { id: "collar", x: 50, y: 14, title: "Corduroy collar", description: "Turns up and fastens with a throat tab in wind." },
      { id: "wax", x: 32, y: 40, title: "Waxed cotton", description: "Sheds rain and darkens where it creases. Rewax once a year." },
      { id: "pocket", x: 64, y: 66, title: "Hand-warmer pockets", description: "Fleece-lined behind the bellows pockets." },
      { id: "cuff", x: 86, y: 80, title: "Storm cuffs", description: "Inner knit cuffs keep the wind out of the sleeves." },
    ],
  },
  "zh-TW": {
    name: "上蠟野外夾克",
    price: "NT$5,480",
    hint: "點數字看細節。",
    spots: [
      { id: "collar", x: 50, y: 14, title: "燈芯絨領", description: "起風時立起領子，用領扣片扣住。" },
      { id: "wax", x: 32, y: 40, title: "上蠟棉布", description: "能擋小雨，摺痕處會自然變深。每年補蠟一次。" },
      { id: "pocket", x: 64, y: 66, title: "暖手口袋", description: "風琴口袋後方另有刷毛內裡的暖手袋。" },
      { id: "cuff", x: 86, y: 80, title: "防風袖口", description: "內層羅紋袖口，風不會灌進袖子。" },
    ],
  },
  "zh-CN": {
    name: "上蜡野外夹克",
    price: "¥1,280",
    hint: "点数字查看细节。",
    spots: [
      { id: "collar", x: 50, y: 14, title: "灯芯绒领", description: "起风时立起领子，用领扣片扣住。" },
      { id: "wax", x: 32, y: 40, title: "上蜡棉布", description: "能挡小雨，折痕处会自然变深。每年补蜡一次。" },
      { id: "pocket", x: 64, y: 66, title: "暖手口袋", description: "风琴口袋后方另有抓绒内衬的暖手袋。" },
      { id: "cuff", x: 86, y: 80, title: "防风袖口", description: "内层罗纹袖口，风不会灌进袖子。" },
    ],
  },
  ja: {
    name: "ワックス フィールドジャケット",
    price: "¥27,500",
    hint: "番号をタップすると詳細が見られます。",
    spots: [
      { id: "collar", x: 50, y: 14, title: "コーデュロイの襟", description: "風の強い日は立ててスロートタブで留められます。" },
      { id: "wax", x: 32, y: 40, title: "ワックスコットン", description: "小雨をはじき、しわの部分が味のある色に。年に一度リプルーフを。" },
      { id: "pocket", x: 64, y: 66, title: "ハンドウォーマー", description: "マチ付きポケットの裏にフリース裏地のポケット。" },
      { id: "cuff", x: 86, y: 80, title: "ストームカフ", description: "内側のリブ袖口で風が入りません。" },
    ],
  },
};

function Jacket() {
  return (
    <svg viewBox="0 0 400 400" className="block h-auto w-full" role="img" aria-hidden="true">
      <rect width="400" height="400" className="fill-[#ececec] dark:fill-[#272727]" />
      <g className="fill-[#acacac] stroke-[#171717]/50 dark:fill-[#606060] dark:stroke-[#ededed]/40" strokeWidth="1.5" strokeLinejoin="round">
        <path d="M150 60 L120 72 L70 110 L40 300 L70 330 L95 330 L105 180 L110 360 L290 360 L295 180 L305 330 L330 330 L360 300 L330 110 L280 72 L250 60 Z" />
        <path d="M150 60 L200 120 L250 60 L235 45 L200 70 L165 45 Z" className="fill-[#7a5a3a] dark:fill-[#3b3b3b]" />
        <path d="M200 120 L200 360" fill="none" />
        <rect x="225" y="240" width="55" height="60" rx="4" />
        <rect x="120" y="240" width="55" height="60" rx="4" />
        <path d="M330 300 L360 300 L355 322 L330 330 Z" className="fill-[#4d4d4d] dark:fill-[#343434]" />
      </g>
    </svg>
  );
}

export default function HotspotsDemo() {
  const t = useDemoText(copy);
  return (
    <div className="grid w-full max-w-3xl gap-6 rounded-lg border bg-background p-6 sm:grid-cols-[1.2fr_1fr]">
      <Hotspots spots={t.spots} defaultActive="wax" className="overflow-visible rounded-md">
        <div className="overflow-hidden rounded-md">
          <Jacket />
        </div>
      </Hotspots>
      <div>
        <p className="text-xl font-semibold tracking-tight">{t.name}</p>
        <p className="mt-1 tabular-nums text-muted-foreground">{t.price}</p>
        <p className="mt-6 text-sm text-muted-foreground">{t.hint}</p>
      </div>
    </div>
  );
}
