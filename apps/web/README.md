# SunUI 官網與 Registry

型錄網站，同時也是兩個 shadcn registry：

| Registry | 網址 | 內容 | 驗證 |
|---|---|---|---|
| `@sunui`（公開） | `/r/<name>.json`、`/r/registry.json` | 免費 block，MIT | 無，靜態產生 |
| `@sunui-pro`（付費） | `/r/pro/<name>.json` | Pro block | `Authorization: Bearer <license key>`，經 Polar 驗證 |

```bash
cp .env.example .env.local   # 依註解填值
npm run web:dev              # 在 repo 根目錄執行，http://localhost:3100
```

## 新增一個 block

1. 原始碼放在 `registry/free/<name>/<name>.tsx`，Pro 放 `registry/pro/<name>/<name>.tsx`。
   - 檔案開頭寫 `"use client";`
   - `cn` 一律從 `@/lib/utils` 匯入，shadcn CLI 會改寫成使用者自己的路徑
   - 顏色用 shadcn tokens（`bg-card`、`text-muted-foreground`、`bg-primary`…），安裝後會吃使用者的主題
   - 動畫 variants 標註 `Variants` 型別；支援 `useReducedMotion`
2. 同一資料夾加 `demo.tsx`（預設匯出、不需要 props）。`predev` / `prebuild` 會自動註冊到預覽清單。
3. 在對應的 `registry.json`（免費：本資料夾；Pro：`registry/pro/registry.json`）加一筆 item。
   多人同時開發時，可改寫到 `registry/_incoming/<group>.json`，再執行 `node scripts/merge-incoming.mjs` 一次併入。
4. 截分享圖（OG）：網站跑著時執行 `node apps/web/scripts/capture-og.mjs --only <name>`，存成 `public/og/blocks/<name>.jpg` 並一起 commit。
   block 頁的 `opengraph-image.tsx` 會把這張畫面放進該 block 自己的分享圖；沒截的話退回純文字版，建置不會壞。
   demo 改過外觀後重截一次；`--missing` 只補還沒有圖的。

型錄、block 頁、`/preview/<name>`（iframe 預覽）和 registry 端點都會自動產生。

## Pro 原始碼

`registry/pro/` 是**獨立的私有 git repo**，被本 repo 的 `.gitignore` 排除。公開 repo 沒有它也能建置（只是沒有 Pro block）。

- 部署到 Vercel 時，需要在 build 前把私有 repo clone 到 `apps/web/registry/pro/`。
- Tailwind 預設不掃描 gitignore 的檔案，`app/globals.css` 已用 `@source` 明確加入。
- Pro 原始碼不會出現在網站頁面；只有帶有效授權碼的 registry 請求會拿到，檔頭會寫入授權 ID。

## 本機驗證安裝

```bash
# 免費
npx shadcn@latest add http://localhost:3100/r/<name>.json

# Pro：在測試專案的 components.json 加入 registries，.env.local 放 SUNUI_LICENSE_KEY
# 本機可用 SUNUI_DEV_LICENSE_KEYS 裡的測試 key（正式環境會忽略）
npx shadcn@latest add @sunui-pro/<name>
```

## 上線前需要的外部設定

| 項目 | 環境變數 | 狀態 |
|---|---|---|
| 正式網域 | `NEXT_PUBLIC_SITE_URL` | 待買網域 |
| Polar 組織 | `POLAR_ORGANIZATION_ID`（測試用 `POLAR_API_URL=https://sandbox-api.polar.sh`） | 待開戶與 KYC |
| Polar 結帳連結 | `NEXT_PUBLIC_CHECKOUT_*_URL` | 未設定時定價頁顯示 waitlist |
| Waitlist | `RESEND_API_KEY`、`RESEND_WAITLIST_SEGMENT_ID` | 未設定時本機寫到 `.data/waitlist.jsonl`，正式環境回 503 |

授權驗證的快取與限流目前存在單一 instance 記憶體；流量變大後改用 Redis。Team 方案的 5 席目前只靠授權條款與異常 IP 偵測，尚未做逐席 activation。
