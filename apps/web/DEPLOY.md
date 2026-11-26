# 部署 SunUI 網站（Google Cloud Run）

2026-11-26 起，正式站 `sunui.synvize.com` 跑在 Google Cloud Run，不再用 Vercel。
原因與成本估算：`reports/部署平台流量爆量與是否換平台深度分析-2026-11-26.md`、`reports/SunUI部署平台CP值與用戶規模預估-2026-11-26.md`。

| 項目 | 值 |
|---|---|
| GCP 專案 | `sunkoro`（和 sunkoro.com 的 beacon 共用帳單與免費額度） |
| 區域 | `us-east4` |
| Cloud Run 服務 | `sunui` |
| 映像 | `us-east4-docker.pkg.dev/sunkoro/sunui/web` |
| 媒體 | Cloudflare R2 bucket `sunui-media`，網址 `https://media.synvize.com`（`lib/media.ts`） |
| 續訂排程 | Cloud Scheduler `sunui-renewals`，每天 01:00 UTC 打服務本身的 run.app 網址 `/api/cron/renewals`，帶 `Authorization: Bearer $CRON_SECRET` |
| 網域 | Cloud Run 網域對應；Cloudflare DNS 的 `sunui` 是 CNAME 到 `ghs.googlehosted.com`（灰雲，只做 DNS） |

## 部署新版本

從 repo 根目錄執行：

```bash
gcloud builds submit --project sunkoro --config apps/web/cloudbuild.yaml
```

```bash
gcloud run deploy sunui --project sunkoro --region us-east4 --image us-east4-docker.pkg.dev/sunkoro/sunui/web:latest
```

第一條在 Cloud Build 建映像（約 10 分鐘，8 核機器，每次約 0.2 美元）。第二條換上新版，流量在新版健康後才切過去，失敗時舊版照常服務。

建置來源由 `.gcloudignore` 決定。`apps/web/registry/pro`（私有 Pro 原始碼）會上傳，只用在建置階段，不會進最後的映像（`apps/web/Dockerfile` 是多階段建置）。本機沒有 `registry/pro` 時建出來的是沒有 Pro 的版本，部署前先確認它在。

## 環境變數

```bash
bash apps/web/scripts/cloudrun-env.sh
```

非敏感值從 Vercel 拉；Vercel 上標成 sensitive 的值讀不回來，腳本會逐一詢問（輸入不顯示，按 Enter 保留 Cloud Run 現有值）。同時更新續訂排程的 `CRON_SECRET`。

只改一個值時：

```bash
gcloud run services update sunui --project sunkoro --region us-east4 --update-env-vars SUNUI_SALES_OPEN=1
```

`NEXT_PUBLIC_*` 是建置時寫進 JS 的，在 `apps/web/Dockerfile` 的 `ARG` 設定，改了要重新建映像。

## 媒體

重錄卡片影片、重截海報之後：

```bash
node apps/web/scripts/sync-media.mjs
```

只上傳內容有變的檔，雜湊記在 `content/media-manifest.json`（要 commit）。

## 服務設定與理由

- 1 vCPU、1GiB、每個實例同時 80 個請求、開啟啟動時 CPU 加速（降低冷啟動）。
- 最少 0 個實例：沒流量時不收費，代價是閒置後第一個請求慢 2 到 4 秒。開最少 1 個實例每月會多約 10 美元，現階段不划算。
- 最多 3 個實例：擋住異常流量把帳單衝高。PH 上線當天如果實例常常滿載，再調高。
- 逾時 300 秒：續訂排程可能跑比較久（Vercel Hobby 時是 60 秒上限）。

## 本機模擬正式環境

`.claude/launch.json` 的 `web-standalone`：用和 Docker 相同的 standalone 輸出建置並跑在 3118 埠，媒體讀 R2。
