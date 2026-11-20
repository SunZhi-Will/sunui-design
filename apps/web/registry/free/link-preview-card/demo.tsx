"use client";

import { useState } from "react";

import { useDemoText } from "@/lib/demo-locale";
import { productPhoto, type ProductKind } from "@/registry/_demo/product-art";

import { LinkPreviewCard, normalizeUrl, type LinkMeta } from "./link-preview-card";

type Page = { siteName: string; title: string; description: string };

// Sample URLs all use fictional domains; the mock returns data locally and calls no external service
const PAGES: Record<string, ProductKind> = {
  "journal.example.com/packing-light": "headphones",
  "outfitters.example.org/field-watch": "watch",
  "store.example.net/stoneware-mug": "mug",
};

export const demoCopy = {
  en: {
    crumbs: ["Notes", "Trip planning"],
    heading: "Spring field trip",
    intro: "Sources for the packing list. Paste a link on its own line and it unfurls.",
    comment: "Add a comment",
    placeholder: "Paste a link",
    commentValue: "https://store.example.net/stoneware-mug",
    labels: {
      empty: "Paste a link to preview it",
      invalid: "That does not look like a link",
      invalidHint: "Try a full address, like https://example.com",
      loading: "Loading preview",
      remove: "Remove preview",
    },
    pages: {
      "journal.example.com/packing-light": { siteName: "Trail Journal", title: "Packing light for three days outdoors", description: "One rucksack, a short list, and the few things we always end up glad we brought." },
      "outfitters.example.org/field-watch": { siteName: "Northside Outfitters", title: "Field Watch 38 mm", description: "Hand wound, sapphire crystal, canvas strap. Ships in two days." },
      "store.example.net/stoneware-mug": { siteName: "Kiln & Co.", title: "Stoneware Mug", description: "Wheel thrown, 350 ml, glazed inside. Holds heat on cold mornings." },
    } as Record<string, Page>,
  },
  "zh-TW": {
    crumbs: ["筆記", "行程規劃"],
    heading: "春季郊遊",
    intro: "打包清單的參考資料。把連結單獨貼成一行，就會展開成預覽。",
    comment: "新增留言",
    placeholder: "貼上連結",
    commentValue: "https://store.example.net/stoneware-mug",
    labels: { empty: "貼上連結即可預覽", invalid: "這看起來不是連結", invalidHint: "請輸入完整網址，例如 https://example.com", loading: "正在載入預覽", remove: "移除預覽" },
    pages: {
      "journal.example.com/packing-light": { siteName: "步道日誌", title: "三天戶外的輕量打包", description: "一個後背包、一張短清單，還有那幾樣每次都慶幸有帶的東西。" },
      "outfitters.example.org/field-watch": { siteName: "北岸裝備", title: "野戰錶 38 mm", description: "手上鍊、藍寶石鏡面、帆布錶帶。兩天內出貨。" },
      "store.example.net/stoneware-mug": { siteName: "窯與器", title: "石陶馬克杯", description: "手拉坯，350 ml，內側上釉。冷天早上也保溫。" },
    } as Record<string, Page>,
  },
  "zh-CN": {
    crumbs: ["笔记", "行程规划"],
    heading: "春季郊游",
    intro: "打包清单的参考资料。把链接单独粘贴成一行，就会展开成预览。",
    comment: "添加评论",
    placeholder: "粘贴链接",
    commentValue: "https://store.example.net/stoneware-mug",
    labels: { empty: "粘贴链接即可预览", invalid: "这看起来不是链接", invalidHint: "请输入完整网址，例如 https://example.com", loading: "正在加载预览", remove: "移除预览" },
    pages: {
      "journal.example.com/packing-light": { siteName: "步道日志", title: "三天户外的轻量打包", description: "一个双肩包、一张短清单，还有那几样每次都庆幸带上的东西。" },
      "outfitters.example.org/field-watch": { siteName: "北岸装备", title: "野战表 38 mm", description: "手动上链、蓝宝石镜面、帆布表带。两天内发货。" },
      "store.example.net/stoneware-mug": { siteName: "窑与器", title: "石陶马克杯", description: "手工拉坯，350 ml，内侧上釉。冷天早上也保温。" },
    } as Record<string, Page>,
  },
  ja: {
    crumbs: ["ノート", "旅の計画"],
    heading: "春のフィールドトリップ",
    intro: "持ち物リストの参考資料。リンクを一行で貼ると、プレビューに展開されます。",
    comment: "コメントを追加",
    placeholder: "リンクを貼り付け",
    commentValue: "https://store.example.net/stoneware-mug",
    labels: { empty: "リンクを貼るとプレビューします", invalid: "リンクではないようです", invalidHint: "https://example.com のような完全な URL を入力してください", loading: "プレビューを読み込み中", remove: "プレビューを削除" },
    pages: {
      "journal.example.com/packing-light": { siteName: "トレイルジャーナル", title: "三日間のアウトドアを身軽に", description: "リュックひとつと短いリスト、そして毎回持ってきてよかったと思うもの。" },
      "outfitters.example.org/field-watch": { siteName: "ノースサイド アウトフィッターズ", title: "フィールドウォッチ 38 mm", description: "手巻き、サファイアガラス、キャンバスストラップ。2日以内に発送。" },
      "store.example.net/stoneware-mug": { siteName: "窯と器", title: "ストーンウェアマグ", description: "ろくろ成形、350 ml、内側に釉薬。寒い朝も冷めにくい。" },
    } as Record<string, Page>,
  },
};

type Copy = (typeof demoCopy)["en"];

/** Local mock: returns data after a short delay. In a real project call your own /api/unfurl */
export function useMockResolver(t: Copy) {
  return (href: string, signal: AbortSignal) =>
    new Promise<LinkMeta>((resolve) => {
      const u = normalizeUrl(href)!;
      const key = u.hostname.replace(/^www\./, "") + u.pathname.replace(/\/$/, "");
      const page = t.pages[key];
      const kind = PAGES[key];
      const meta: LinkMeta = page
        ? { ...page, image: kind && productPhoto(kind) }
        : { title: decodeURIComponent(u.pathname.split("/").filter(Boolean).pop() ?? u.hostname).replace(/[-_]/g, " ") };
      const timer = setTimeout(() => resolve(meta), 900);
      signal.addEventListener("abort", () => clearTimeout(timer));
    });
}

const surface =
  "rounded-xl bg-background shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.05)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_1px_rgb(255_255_255/0.08)]";

/** Notes page: pasted links expand into preview cards; paste a URL into the comment box below to watch it go from loading to card. */
export default function LinkPreviewCardDemo() {
  const t = useDemoText(demoCopy);
  const resolve = useMockResolver(t);
  const [comment, setComment] = useState<string | null>(null);
  const value = comment ?? t.commentValue;

  return (
    <article className={`w-full max-w-xl px-5 py-6 sm:px-8 ${surface}`}>
      <p className="text-xs text-muted-foreground">{t.crumbs.join(" / ")}</p>
      <h1 className="mt-3 text-xl font-semibold tracking-tight">{t.heading}</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.intro}</p>

      <div className="mt-5 space-y-3">
        <LinkPreviewCard url="https://journal.example.com/packing-light" fetchMeta={resolve} labels={t.labels} />
        <LinkPreviewCard url="https://outfitters.example.org/field-watch" fetchMeta={resolve} labels={t.labels} />
      </div>

      <div className="mt-6 border-t border-foreground/10 pt-5">
        <label htmlFor="lp-comment" className="text-xs font-medium text-muted-foreground">
          {t.comment}
        </label>
        <input
          id="lp-comment"
          value={value}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t.placeholder}
          className="mt-2 h-10 w-full rounded-md bg-muted px-3 text-sm text-foreground shadow-[inset_0_1px_2px_rgb(0_0_0/0.06)] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="mt-3">
          <LinkPreviewCard url={value} fetchMeta={resolve} labels={t.labels} onRemove={() => setComment("")} />
        </div>
      </div>
    </article>
  );
}
