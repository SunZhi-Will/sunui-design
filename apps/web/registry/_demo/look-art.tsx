// 只給 demo 與 Pro 展示版用的示意穿搭圖：暗色棚拍底上的單件衣物線稿（showcase 系列）。
// 會填滿任何比例的框，衣物置中、不裁切，所以可以當小框縮圖，也可以長成滿版主視覺。
// 不會被安裝到使用者專案；block 本身一律透過 props 接收圖片。

export type LookKind = "coat" | "knit" | "shirt" | "trousers" | "scarf" | "tote" | "boots" | "hat" | "dress";

// 四種棚拍底色，都是無色偏的中性灰
const BACKDROPS = ["#1c1c1c", "#262626", "#303030", "#3a3a3a"] as const;

const PATHS: Record<LookKind, string[]> = {
  coat: [
    "M72 40 L90 32 L100 48 L110 32 L128 40 L146 118 L132 122 L130 214 L70 214 L68 122 L54 118 Z",
    "M100 48 L100 214",
    "M90 32 L95 86 M110 32 L105 86",
    "M76 150 L92 150 M108 150 L124 150",
  ],
  knit: [
    "M64 62 Q100 48 136 62 L156 132 L140 138 L134 112 L134 200 L66 200 L66 112 L60 138 L44 132 Z",
    "M86 56 Q100 70 114 56",
    "M66 186 L134 186 M66 192 L134 192",
    "M80 90 L80 180 M100 80 L100 180 M120 90 L120 180",
  ],
  shirt: [
    "M70 46 L90 38 L100 52 L110 38 L130 46 L148 104 L134 108 L132 206 L68 206 L66 108 L52 104 Z",
    "M90 38 L100 62 L110 38",
    "M100 62 L100 206",
    "M98 84 h4 M98 112 h4 M98 140 h4 M98 168 h4",
  ],
  trousers: [
    "M72 40 L128 40 L140 220 L108 220 L100 96 L92 220 L60 220 Z",
    "M72 54 L128 54",
    "M84 54 L86 76 M116 54 L114 76",
  ],
  scarf: [
    "M78 40 Q100 30 122 40 Q132 70 112 84 L118 210 L100 214 L96 92 Q70 80 78 40 Z",
    "M100 196 L100 214 M106 196 L108 212 M112 196 L116 210",
    "M84 54 Q100 64 116 54",
  ],
  tote: [
    "M56 98 L144 98 L136 206 L64 206 Z",
    "M78 98 Q78 52 100 52 Q122 52 122 98",
    "M86 98 Q86 64 100 64 Q114 64 114 98",
    "M64 124 L136 124",
  ],
  boots: [
    "M60 60 L88 60 L90 170 L122 186 L124 206 L58 206 Z",
    "M112 70 L140 70 L142 176 L160 188 L160 206 L110 206 Z",
    "M58 192 L124 192 M110 194 L160 194",
  ],
  hat: [
    "M40 150 Q100 170 160 150 Q160 138 140 134 L132 82 Q100 66 68 82 L60 134 Q40 138 40 150 Z",
    "M62 122 Q100 136 138 122",
  ],
  dress: [
    "M84 36 L92 36 Q100 50 108 36 L116 36 L122 94 L152 214 L48 214 L78 94 Z",
    "M78 94 Q100 104 122 94",
    "M92 36 L88 18 M108 36 L112 18",
  ],
};

/** 填滿父層的穿搭圖；tone 換棚拍底色深淺 */
export function LookArt({ kind, tone = 0, className }: { kind: LookKind; tone?: 0 | 1 | 2 | 3; className?: string }) {
  return (
    <div className={className ?? "absolute inset-0"} style={{ background: BACKDROPS[tone] }}>
      <svg viewBox="0 0 200 250" preserveAspectRatio="xMidYMid meet" className="absolute inset-0 size-full" fill="none" aria-hidden>
        {/* 地平線：棚拍無縫紙的轉角 */}
        <path d="M-400 226 H600" stroke="#ffffff" strokeOpacity={0.06} strokeWidth={1} />
        {PATHS[kind].map((d, i) => (
          <path
            key={i}
            d={d}
            stroke="#e5e5e5"
            strokeOpacity={i === 0 ? 0.7 : 0.45}
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            fill={i === 0 ? "#ffffff" : "none"}
            fillOpacity={i === 0 ? 0.05 : 0}
          />
        ))}
      </svg>
    </div>
  );
}
