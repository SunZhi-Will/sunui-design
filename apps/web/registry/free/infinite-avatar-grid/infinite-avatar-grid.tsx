"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type MouseEvent as ReactMouseEvent, type TouchEvent as ReactTouchEvent } from "react";

import { cn } from "@/lib/utils";

export interface AvatarGridUser {
  id: string;
  name: string;
  title: string;
  /** 頭像圖片；未提供時用座標產生 SVG 頭像 */
  avatar?: string;
  location: string;
  skills: string[];
}

export interface InfiniteAvatarGridLabels {
  /** 畫布的無障礙名稱 */
  canvas: string;
  /** 彈窗內技能區標題 */
  skills: string;
  /** 縮放指示器的無障礙名稱前綴 */
  zoom: string;
}

export interface InfiniteAvatarGridProps {
  /** 依網格座標回傳使用者；同座標必須回傳相同資料。預設用原專案的確定性產生器 */
  getUser?: (gridX: number, gridY: number) => AvatarGridUser;
  /** 點選頭像時觸發 */
  onSelect?: (user: AvatarGridUser) => void;
  /** 是否開啟內建的名片彈窗 */
  showModal?: boolean;
  /** 頭像是否顯示；由 false 變 true 時全部以泡泡動畫出現 */
  visible?: boolean;
  /** 右下角縮放指示器 */
  showZoomIndicator?: boolean;
  /** 彈窗覆蓋整個視窗（fixed）或只覆蓋本元件（absolute） */
  fixed?: boolean;
  cellSize?: number;
  avatarSize?: number;
  minScale?: number;
  maxScale?: number;
  onScaleChange?: (scale: number) => void;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤；未給 getUser 時也決定範例資料語言 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: Partial<InfiniteAvatarGridLabels>;
  className?: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, InfiniteAvatarGridLabels> = {
  en: {
    canvas: "People grid. Drag or use arrow keys to pan, scroll or press plus and minus to zoom.",
    skills: "Skills",
    zoom: "Zoom",
  },
  "zh-TW": {
    canvas: "人物網格。拖曳或用方向鍵平移，滾動滑鼠滾輪或按加減鍵縮放。",
    skills: "技能",
    zoom: "縮放",
  },
  "zh-CN": {
    canvas: "人物网格。拖动或用方向键平移，滚动鼠标滚轮或按加减键缩放。",
    skills: "技能",
    zoom: "缩放",
  },
  ja: {
    canvas: "人物グリッド。ドラッグまたは矢印キーで移動、スクロールまたはプラス・マイナスキーで拡大縮小します。",
    skills: "スキル",
    zoom: "ズーム",
  },
};

const RENDER_BUFFER = 1;
const ZOOM_STEP = 0.1;
// 泡泡出現的曲線：原專案為回彈彈簧，依 PORTING.md 改成 expo-out
const SPRING = "cubic-bezier(0.23, 1, 0.32, 1)";

// 原專案 UserGenerator.ts 的資料與種子公式，各語言各一份
interface SampleData {
  names: string[];
  titles: string[];
  locations: string[];
  skills: string[][];
}

const SAMPLES: Record<SunLocale, SampleData> = {
  "zh-TW": {
    names: ["張小明", "李美華", "王大偉", "陳小芳", "林志強", "黃淑芬", "吳建國", "劉雅婷", "鄭文傑", "許慧君", "周俊傑", "徐雅琪", "朱建華", "高文斌", "孫麗娟", "馬志明", "趙淑惠", "錢俊宏", "蔡雅芳", "謝建國"],
    titles: ["前端工程師", "UI設計師", "後端工程師", "產品經理", "數據分析師", "專案經理", "DevOps工程師", "UX設計師", "全端工程師", "行銷專員", "系統架構師", "QA工程師", "技術總監", "設計總監", "業務經理"],
    locations: ["台北市", "新北市", "桃園市", "台中市", "台南市", "高雄市", "新竹市", "基隆市", "嘉義市", "彰化縣"],
    skills: [
      ["React", "TypeScript", "Node.js"],
      ["Figma", "Sketch", "Photoshop"],
      ["Python", "Django", "PostgreSQL"],
      ["產品規劃", "用戶研究", "數據分析"],
      ["SQL", "R", "Python"],
      ["專案管理", "團隊協作", "敏捷開發"],
      ["Docker", "Kubernetes", "AWS"],
      ["用戶體驗", "介面設計", "原型製作"],
      ["Vue.js", "Express", "MongoDB"],
      ["數位行銷", "社群經營", "內容創作"],
    ],
  },
  "zh-CN": {
    names: ["张小明", "李美华", "王大伟", "陈小芳", "林志强", "黄淑芬", "吴建国", "刘雅婷", "郑文杰", "许慧君", "周俊杰", "徐雅琪", "朱建华", "高文斌", "孙丽娟", "马志明", "赵淑惠", "钱俊宏", "蔡雅芳", "谢建国"],
    titles: ["前端工程师", "UI设计师", "后端工程师", "产品经理", "数据分析师", "项目经理", "DevOps工程师", "UX设计师", "全栈工程师", "市场专员", "系统架构师", "QA工程师", "技术总监", "设计总监", "销售经理"],
    locations: ["台北市", "新北市", "桃园市", "台中市", "台南市", "高雄市", "新竹市", "基隆市", "嘉义市", "彰化县"],
    skills: [
      ["React", "TypeScript", "Node.js"],
      ["Figma", "Sketch", "Photoshop"],
      ["Python", "Django", "PostgreSQL"],
      ["产品规划", "用户研究", "数据分析"],
      ["SQL", "R", "Python"],
      ["项目管理", "团队协作", "敏捷开发"],
      ["Docker", "Kubernetes", "AWS"],
      ["用户体验", "界面设计", "原型制作"],
      ["Vue.js", "Express", "MongoDB"],
      ["数字营销", "社群运营", "内容创作"],
    ],
  },
  en: {
    names: ["Alex Chen", "Maya Lin", "David Wang", "Grace Liu", "Ethan Lin", "Iris Huang", "Kevin Wu", "Tina Liu", "Jason Cheng", "Wendy Hsu", "Leo Chou", "Chloe Hsu", "Brian Chu", "Victor Kao", "Lily Sun", "Martin Ma", "Sophie Chao", "Ryan Chien", "Amy Tsai", "Daniel Hsieh"],
    titles: ["Frontend Engineer", "UI Designer", "Backend Engineer", "Product Manager", "Data Analyst", "Project Manager", "DevOps Engineer", "UX Designer", "Full-stack Engineer", "Marketing Specialist", "Systems Architect", "QA Engineer", "Engineering Director", "Design Director", "Sales Manager"],
    locations: ["Taipei", "New Taipei", "Taoyuan", "Taichung", "Tainan", "Kaohsiung", "Hsinchu", "Keelung", "Chiayi", "Changhua"],
    skills: [
      ["React", "TypeScript", "Node.js"],
      ["Figma", "Sketch", "Photoshop"],
      ["Python", "Django", "PostgreSQL"],
      ["Product planning", "User research", "Data analysis"],
      ["SQL", "R", "Python"],
      ["Project management", "Teamwork", "Agile"],
      ["Docker", "Kubernetes", "AWS"],
      ["User experience", "Interface design", "Prototyping"],
      ["Vue.js", "Express", "MongoDB"],
      ["Digital marketing", "Community", "Content creation"],
    ],
  },
  ja: {
    names: ["佐藤 陽翔", "鈴木 美咲", "高橋 大輔", "田中 結衣", "伊藤 健太", "渡辺 さくら", "山本 翔太", "中村 彩花", "小林 拓海", "加藤 愛", "吉田 蓮", "山田 美穂", "佐々木 誠", "山口 浩二", "松本 千尋", "井上 直樹", "木村 恵", "林 優斗", "清水 菜々子", "斎藤 健一"],
    titles: ["フロントエンドエンジニア", "UIデザイナー", "バックエンドエンジニア", "プロダクトマネージャー", "データアナリスト", "プロジェクトマネージャー", "DevOpsエンジニア", "UXデザイナー", "フルスタックエンジニア", "マーケティング担当", "システムアーキテクト", "QAエンジニア", "技術責任者", "デザイン責任者", "営業マネージャー"],
    locations: ["台北市", "新北市", "桃園市", "台中市", "台南市", "高雄市", "新竹市", "基隆市", "嘉義市", "彰化県"],
    skills: [
      ["React", "TypeScript", "Node.js"],
      ["Figma", "Sketch", "Photoshop"],
      ["Python", "Django", "PostgreSQL"],
      ["プロダクト企画", "ユーザー調査", "データ分析"],
      ["SQL", "R", "Python"],
      ["プロジェクト管理", "チームワーク", "アジャイル開発"],
      ["Docker", "Kubernetes", "AWS"],
      ["ユーザー体験", "UIデザイン", "プロトタイピング"],
      ["Vue.js", "Express", "MongoDB"],
      ["デジタルマーケティング", "コミュニティ運営", "コンテンツ制作"],
    ],
  },
};

/** 預設的確定性產生器；locale 決定範例資料的語言（預設繁中，與原專案相同） */
export function defaultGetUser(gridX: number, gridY: number, locale: string = "zh-TW"): AvatarGridUser {
  const d = SAMPLES[resolveLocale(locale)];
  const seed = Math.abs(gridX * 997 + gridY * 991);
  return {
    id: `user_${gridX}_${gridY}`,
    name: d.names[seed % d.names.length],
    title: d.titles[(seed * 7) % d.titles.length],
    location: d.locations[(seed * 13) % d.locations.length],
    skills: d.skills[(seed * 17) % d.skills.length],
  };
}

// 依 id 雜湊出錯開延遲（原專案 UserCard.tsx 的公式，0 到 800ms）
function bubbleDelay(id: string) {
  const hash = id.split("_").reduce((acc, val) => acc + parseInt(val, 10) || 0, 0);
  return hash % 800;
}

function hashString(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 頭像字首：中日文取第一個字，拉丁字母取首尾兩個單字的字首 */
function initialsOf(name: string) {
  const n = name.trim();
  if (!n) return "?";
  if (/[\u3040-\u30ff\u3400-\u9fff]/.test(n[0])) return n[0];
  const parts = n.split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

/**
 * 依 seed 雜湊出低彩度底色的字首頭像，取代原本的外部頭像服務與卡通插畫。
 * 底色與字色都和主題的 card、foreground 混色，Light 與 Dark 都不刺眼。
 */
export function GeneratedAvatar({ seed, name, className }: { seed: string; name?: string; className?: string }) {
  const hue = hashString(seed) % 360;
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <rect width="100" height="100" style={{ fill: `color-mix(in oklab, oklch(0.7 0.05 ${hue}) 28%, var(--card))` }} />
      {name ? (
        <text
          x="50"
          y="50"
          dy="0.35em"
          textAnchor="middle"
          fontSize={initialsOf(name).length > 1 ? 34 : 38}
          fontWeight={600}
          style={{ fill: `color-mix(in oklab, oklch(0.45 0.06 ${hue}) 55%, var(--foreground))`, fontFamily: "inherit", letterSpacing: "0.02em" }}
        >
          {initialsOf(name)}
        </text>
      ) : (
        // 沒有名字時用中性剪影
        <g style={{ fill: `color-mix(in oklab, oklch(0.45 0.06 ${hue}) 35%, var(--muted-foreground))` }} opacity="0.55">
          <circle cx="50" cy="40" r="16" />
          <path d="M20 96c0-18 13-28 30-28s30 10 30 28z" />
        </g>
      )}
    </svg>
  );
}

// 原專案的泡泡出現改成淡入加輕微放大：保留錯開延遲與 0.6s 時長，拿掉回彈與閃爍
const styles = `
@keyframes cf-bubble-in {
  0% { opacity: 0; transform: translate3d(0, 0, 0) scale(0.92); }
  100% { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .cf-bubble { animation: none !important; opacity: 1 !important; }
  .cf-modal-card { transition: none !important; }
}
`;

/** 原專案 UserCard.tsx：圓形頭像、泡泡出現、懸停資訊 */
function AvatarCell({ user, x, y, size, visible, onPick }: { user: AvatarGridUser; x: number; y: number; size: number; visible: boolean; onPick: (user: AvatarGridUser) => void }) {
  const delay = bubbleDelay(user.id);
  return (
    <button
      type="button"
      aria-label={`${user.name}, ${user.title}`}
      className="group absolute cursor-pointer select-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      style={{ left: x, top: y, width: size, height: size, transform: "translate3d(0, 0, 0)", willChange: "transform" }}
      onClick={(e) => {
        e.stopPropagation();
        onPick(user);
      }}
    >
      <span
        className="cf-bubble block h-full w-full overflow-hidden rounded-full border border-border bg-card shadow-sm transition-[transform,border-color] duration-200 group-hover:scale-105 group-hover:border-foreground/30 motion-reduce:transition-none"
        style={{ opacity: visible ? 1 : 0, animation: visible ? `cf-bubble-in 0.6s ${SPRING} ${delay}ms forwards` : "none" }}
      >
        {user.avatar ? (
          <img src={user.avatar} alt="" className="h-full w-full object-cover" loading="lazy" draggable={false} />
        ) : (
          <GeneratedAvatar seed={user.id} name={user.name} className="h-full w-full" />
        )}
      </span>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-card px-3 py-2 text-left text-xs font-medium text-foreground opacity-0 shadow-sm transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
        style={{ bottom: size + 8, zIndex: 9999 }}
      >
        <span className="block font-semibold text-foreground">{user.name}</span>
        <span className="mt-0.5 block text-xs text-muted-foreground">{user.title}</span>
      </span>
    </button>
  );
}

/** 原專案 UserCardModal.tsx：旋轉滑入的名片（漸層與光斑改成中性卡面） */
function UserCardModal({ user, onClose, fixed, skillsLabel }: { user: AvatarGridUser; onClose: () => void; fixed: boolean; skillsLabel: string }) {
  const [entered, setEntered] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);

  useEffect(() => {
    // 先畫出起始狀態再切換，確保進場轉場會播放
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setEntered(true));
    });
    const previous = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus({ preventScroll: true });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      previous?.focus?.({ preventScroll: true });
    };
  }, []);

  const handleClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setEntered(false);
    // 原本在 300ms 後卸載
    window.setTimeout(onClose, 300);
  }, [onClose]);

  return (
    <div
      className={cn(fixed ? "fixed" : "absolute", "inset-0 z-50 flex items-center justify-center overflow-hidden")}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${user.id}-name`}
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.stopPropagation();
            handleClose();
          }
        }}
        className={cn(
          "cf-modal-card relative z-10 outline-none transition-all duration-500 ease-out",
          entered ? "translate-y-0 rotate-0 scale-100 opacity-100" : "translate-y-full rotate-12 scale-75 opacity-0",
        )}
      >
        <div className="relative h-96 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-lg">
          <div className="relative z-10 flex h-full flex-col justify-between p-8">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-border bg-muted">
                {user.avatar ? (
                  <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                ) : (
                  <GeneratedAvatar seed={user.id} name={user.name} className="h-full w-full" />
                )}
              </div>
              <h2 id={`${user.id}-name`} className="mb-1 text-2xl font-semibold tracking-tight">
                {user.name}
              </h2>
              <p className="mb-4 text-base text-muted-foreground">{user.title}</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p className="flex items-center justify-center gap-2">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 21s7-6.2 7-11.5a7 7 0 1 0-14 0C5 14.8 12 21 12 21z" />
                    <circle cx="12" cy="9.5" r="2.5" />
                  </svg>
                  {user.location}
                </p>
              </div>
            </div>

            <div className="text-center">
              <div className="mb-2 border-t border-border pt-5">
                <h3 className="mb-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{skillsLabel}</h3>
                <ul className="flex flex-wrap justify-center gap-2">
                  {user.skills.map((skill, index) => (
                    <li key={index} className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs text-foreground">
                      {skill}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** 原專案 ZoomIndicator.tsx */
function ZoomIndicator({ scale, label }: { scale: number; label: string }) {
  return (
    <div
      role="status"
      aria-label={`${label} ${Math.round(scale * 100)}%`}
      className="pointer-events-none absolute bottom-6 right-6 z-40 rounded-lg border border-border bg-card px-4 py-2.5 text-foreground shadow-sm"
    >
      <div className="flex items-center gap-2">
        <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
        </svg>
        <span className="text-sm font-semibold tabular-nums">{Math.round(scale * 100)}%</span>
      </div>
    </div>
  );
}

export function InfiniteAvatarGrid({
  getUser: getUserProp,
  onSelect,
  showModal = true,
  visible = true,
  showZoomIndicator = true,
  fixed = false,
  cellSize = 150,
  avatarSize = 80,
  minScale = 0.3,
  maxScale = 2,
  onScaleChange,
  locale = "en",
  labels: labelsProp,
  className,
}: InfiniteAvatarGridProps) {
  const lang = resolveLocale(locale);
  const labels = { ...MESSAGES[lang], ...labelsProp };
  const fallbackGetUser = useCallback((x: number, y: number) => defaultGetUser(x, y, lang), [lang]);
  const getUser = getUserProp ?? fallbackGetUser;

  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);
  const [selected, setSelected] = useState<AvatarGridUser | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const downAtRef = useRef({ x: 0, y: 0 });
  const movedRef = useRef(false);
  const offsetRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const isDraggingRef = useRef(false);
  const stateTimeoutRef = useRef<number | null>(null);
  const onScaleChangeRef = useRef(onScaleChange);
  onScaleChangeRef.current = onScaleChange;

  // 拖拽與縮放期間直接改 DOM，不經過 React state
  const updateCanvasTransform = useCallback(() => {
    if (canvasRef.current) {
      canvasRef.current.style.transform = `translate(${offsetRef.current.x}px, ${offsetRef.current.y}px) scale(${scaleRef.current})`;
    }
    if (containerRef.current) {
      containerRef.current.style.backgroundPosition = `${offsetRef.current.x}px ${offsetRef.current.y}px`;
    }
  }, []);

  // 量測容器；第一次量到尺寸時把原點置中
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let first = true;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      setSize({ w: rect.width, h: rect.height });
      if (first) {
        first = false;
        offsetRef.current = { x: rect.width / 2, y: rect.height / 2 };
        scaleRef.current = 1;
        setOffset({ ...offsetRef.current });
        updateCanvasTransform();
      }
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateCanvasTransform]);

  // 只渲染可見範圍（加一格緩衝）
  const visibleUsers = useMemo(() => {
    if (!size) return [];
    const minX = Math.floor((-offset.x / scale - RENDER_BUFFER * cellSize) / cellSize);
    const maxX = Math.ceil((size.w - offset.x) / scale / cellSize + RENDER_BUFFER);
    const minY = Math.floor((-offset.y / scale - RENDER_BUFFER * cellSize) / cellSize);
    const maxY = Math.ceil((size.h - offset.y) / scale / cellSize + RENDER_BUFFER);
    const users: (AvatarGridUser & { gridX: number; gridY: number })[] = [];
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        users.push({ ...getUser(x, y), gridX: x, gridY: y });
      }
    }
    return users;
  }, [size, offset, scale, cellSize, getUser]);

  // 批次同步 React state（縮放結束後 100ms）
  const scheduleStateSync = useCallback(() => {
    if (stateTimeoutRef.current) clearTimeout(stateTimeoutRef.current);
    stateTimeoutRef.current = window.setTimeout(() => {
      setScale(scaleRef.current);
      setOffset({ ...offsetRef.current });
      onScaleChangeRef.current?.(scaleRef.current);
    }, 100);
  }, []);

  // 以指定點為中心縮放，該點在畫布上的位置保持不變
  const zoomAt = useCallback(
    (delta: number, anchorX: number, anchorY: number) => {
      const newScale = Math.max(minScale, Math.min(maxScale, scaleRef.current + delta));
      if (Math.abs(newScale - scaleRef.current) <= 0.01) return;
      const canvasX = (anchorX - offsetRef.current.x) / scaleRef.current;
      const canvasY = (anchorY - offsetRef.current.y) / scaleRef.current;
      scaleRef.current = newScale;
      offsetRef.current = { x: anchorX - canvasX * newScale, y: anchorY - canvasY * newScale };
      updateCanvasTransform();
      scheduleStateSync();
    },
    [minScale, maxScale, updateCanvasTransform, scheduleStateSync],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      zoomAt(e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP, e.clientX - rect.left, e.clientY - rect.top);
    };
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [zoomAt]);

  useEffect(
    () => () => {
      if (stateTimeoutRef.current) clearTimeout(stateTimeoutRef.current);
    },
    [],
  );

  const startDrag = (clientX: number, clientY: number) => {
    isDraggingRef.current = true;
    movedRef.current = false;
    setIsDragging(true);
    downAtRef.current = { x: clientX, y: clientY };
    dragStartRef.current = { x: clientX - offsetRef.current.x, y: clientY - offsetRef.current.y };
  };
  const moveDrag = (clientX: number, clientY: number) => {
    if (!isDraggingRef.current) return;
    if (Math.abs(clientX - downAtRef.current.x) + Math.abs(clientY - downAtRef.current.y) > 4) movedRef.current = true;
    offsetRef.current = { x: clientX - dragStartRef.current.x, y: clientY - dragStartRef.current.y };
    updateCanvasTransform();
  };
  const endDrag = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    setOffset({ ...offsetRef.current });
  };

  const handleMouseDown = (e: ReactMouseEvent) => {
    if (e.button !== 0) return;
    startDrag(e.clientX, e.clientY);
  };
  const handleTouchStart = (e: ReactTouchEvent) => startDrag(e.touches[0].clientX, e.touches[0].clientY);
  const handleTouchMove = (e: ReactTouchEvent) => moveDrag(e.touches[0].clientX, e.touches[0].clientY);

  // 鍵盤：方向鍵平移，加減號縮放
  const handleKeyDown = (e: ReactKeyboardEvent) => {
    movedRef.current = false;
    if (e.target !== e.currentTarget && !(e.target instanceof HTMLButtonElement)) return;
    const step = cellSize / 2;
    const moves: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    const move = moves[e.key];
    if (move) {
      e.preventDefault();
      offsetRef.current = { x: offsetRef.current.x + move[0], y: offsetRef.current.y + move[1] };
      updateCanvasTransform();
      setOffset({ ...offsetRef.current });
      return;
    }
    if ((e.key === "+" || e.key === "=" || e.key === "-") && size) {
      e.preventDefault();
      zoomAt(e.key === "-" ? -ZOOM_STEP : ZOOM_STEP, size.w / 2, size.h / 2);
    }
  };

  const pick = useCallback(
    (user: AvatarGridUser) => {
      // 拖拽結束時不當成點擊
      if (movedRef.current) return;
      onSelect?.(user);
      if (showModal) setSelected(user);
    },
    [onSelect, showModal],
  );

  return (
    <div className={cn("relative h-full w-full overflow-hidden", className)}>
      <style>{styles}</style>
      <div
        ref={containerRef}
        role="application"
        aria-label={labels.canvas}
        tabIndex={0}
        className="relative h-full w-full cursor-grab overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={(e) => moveDrag(e.clientX, e.clientY)}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={endDrag}
        onKeyDown={handleKeyDown}
        style={{
          touchAction: "none",
          backgroundColor: "var(--background)",
          backgroundImage: "radial-gradient(circle, color-mix(in oklab, var(--muted-foreground) 30%, transparent) 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          backgroundPosition: `${offset.x}px ${offset.y}px`,
        }}
      >
        <div
          ref={canvasRef}
          className="absolute left-0 top-0"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            transformOrigin: "0 0",
            willChange: isDragging ? "transform" : "auto",
          }}
        >
          {visibleUsers.map((user) => (
            <AvatarCell
              key={user.id}
              user={user}
              x={user.gridX * cellSize + (cellSize - avatarSize) / 2}
              y={user.gridY * cellSize + (cellSize - avatarSize) / 2}
              size={avatarSize}
              visible={visible}
              onPick={pick}
            />
          ))}
        </div>
      </div>

      {showZoomIndicator && <ZoomIndicator scale={scale} label={labels.zoom} />}

      {showModal && selected && <UserCardModal key={selected.id} user={selected} fixed={fixed} skillsLabel={labels.skills} onClose={() => setSelected(null)} />}
    </div>
  );
}

export default InfiniteAvatarGrid;
