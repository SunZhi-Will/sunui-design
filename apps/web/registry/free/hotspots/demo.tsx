"use client";

import { useDemoText } from "@/lib/demo-locale";

import { Hotspots } from "./hotspots";

const copy = {
  en: {
    name: "Waxed field jacket",
    price: "$184",
    hint: "Tap a number to see the detail.",
    spots: [
      { id: "collar", x: 50, y: 16, title: "Corduroy collar", description: "Turns up and fastens with a throat tab in wind." },
      { id: "wax", x: 30, y: 42, title: "Waxed cotton", description: "Sheds rain and darkens where it creases. Rewax once a year." },
      { id: "pocket", x: 68, y: 72, title: "Hand-warmer pockets", description: "Fleece-lined behind the bellows pockets." },
      { id: "cuff", x: 87, y: 85, title: "Storm cuffs", description: "Inner knit cuffs keep the wind out of the sleeves." },
    ],
  },
  "zh-TW": {
    name: "上蠟野外夾克",
    price: "NT$5,480",
    hint: "點數字看細節。",
    spots: [
      { id: "collar", x: 50, y: 16, title: "燈芯絨領", description: "起風時立起領子，用領扣片扣住。" },
      { id: "wax", x: 30, y: 42, title: "上蠟棉布", description: "能擋小雨，摺痕處會自然變深。每年補蠟一次。" },
      { id: "pocket", x: 68, y: 72, title: "暖手口袋", description: "風琴口袋後方另有刷毛內裡的暖手袋。" },
      { id: "cuff", x: 87, y: 85, title: "防風袖口", description: "內層羅紋袖口，風不會灌進袖子。" },
    ],
  },
  "zh-CN": {
    name: "上蜡野外夹克",
    price: "¥1,280",
    hint: "点数字查看细节。",
    spots: [
      { id: "collar", x: 50, y: 16, title: "灯芯绒领", description: "起风时立起领子，用领扣片扣住。" },
      { id: "wax", x: 30, y: 42, title: "上蜡棉布", description: "能挡小雨，折痕处会自然变深。每年补蜡一次。" },
      { id: "pocket", x: 68, y: 72, title: "暖手口袋", description: "风琴口袋后方另有抓绒内衬的暖手袋。" },
      { id: "cuff", x: 87, y: 85, title: "防风袖口", description: "内层罗纹袖口，风不会灌进袖子。" },
    ],
  },
  ja: {
    name: "ワックス フィールドジャケット",
    price: "¥27,500",
    hint: "番号をタップすると詳細が見られます。",
    spots: [
      { id: "collar", x: 50, y: 16, title: "コーデュロイの襟", description: "風の強い日は立ててスロートタブで留められます。" },
      { id: "wax", x: 30, y: 42, title: "ワックスコットン", description: "小雨をはじき、しわの部分が味のある色に。年に一度リプルーフを。" },
      { id: "pocket", x: 68, y: 72, title: "ハンドウォーマー", description: "マチ付きポケットの裏にフリース裏地のポケット。" },
      { id: "cuff", x: 87, y: 85, title: "ストームカフ", description: "内側のリブ袖口で風が入りません。" },
    ],
  },
};

// 示範照片（AI 生成）：蠟布夾克平拍，4:5。熱點座標以這張照片的百分比位置為準
function Jacket() {
  return (
    <img
      src="/blocks/hotspots/jacket.webp"
      alt=""
      width={960}
      height={1200}
      draggable={false}
      className="block h-auto w-full select-none"
    />
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
