# GitHub PR 處理摘要

## 開放中的 PR（已處理）

### PR #25 — [Snyk] Security upgrade next from 15.3.2 to 15.3.8
- **狀態**：已納入本機
- **變更**：`package.json` 已為 `next: "^15.3.8"`，`package-lock.json` 根依賴已改為 `^15.3.8`，`eslint-config-next` 已改為 `^15.3.8`
- **建議**：在 GitHub 上可合併此 PR，或若已從本機 push 相同變更則可關閉 PR #25
- **注意**：請在本機執行一次 `npm install`，以將 lockfile 內實際解析版本更新至 15.3.8（並更新 integrity）

### PR #26 — [Snyk] Security upgrade next from 15.3.2 to 16.1.5
- **狀態**：建議暫不合併
- **原因**：
  - Next.js 16 為 major 升級，含 breaking changes（Turbopack 預設、快取模型、Node 20.9+ 等）
  - `@storybook/nextjs` 目前支援為 `^13.5.0 || ^14.0.0 || ^15.0.0`，尚未宣告支援 Next 16
  - Snyk 亦標記此升級為 breaking change，且未更新 package-lock.json
- **建議**：在 GitHub 上關閉 PR #26，並可留言說明暫不升級至 Next 16，待 Storybook 與生態系支援後再考慮；目前以 PR #25 的 15.3.8 修補安全問題即可

## 已執行的本機變更
1. `package.json`：`next` 維持 `^15.3.8`，`eslint-config-next` 改為 `^15.3.8`
2. `package-lock.json`：根依賴中 `next` 由 `^15.2.4` 改為 `^15.3.8`
3. 請在本機執行 `npm install` 以完整更新 lockfile 與 `node_modules`
