# SunUI 官網與 Registry

型錄網站，同時也是 shadcn registry（`/r/<name>.json`）。

```bash
npm run web:dev   # http://localhost:3100
```

## 新增一個 block

1. 原始碼放在 `registry/free/<name>/<name>.tsx`（Pro 之後放 `registry/pro/`）。
   - 檔案開頭寫 `"use client";`
   - `cn` 一律從 `@/lib/utils` 匯入，shadcn CLI 會改寫成使用者自己的路徑
   - 動畫 variants 標註 `Variants` 型別，避免新版 framer-motion 型別錯誤
2. 在同一資料夾加 `demo.tsx`（預設匯出一個不需要 props 的展示元件）。
3. 在 `registry/previews.tsx` 註冊 demo。
4. 在 `registry.json` 的 `items` 加一筆：`name`、`title`、`description`、`dependencies`、`meta.tier`、`meta.interaction`、`files`。

型錄、block 頁、`/preview/<name>`（iframe 預覽）和 `/r/<name>.json` 都會自動產生。

## 本機驗證安裝

```bash
npx shadcn@latest add http://localhost:3100/r/<name>.json
```

正式站設定 `NEXT_PUBLIC_SITE_URL` 後，頁面上的安裝指令會改用正式網域。
