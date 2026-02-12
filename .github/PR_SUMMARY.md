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
3. 已 push 至 `origin/master`。

## 手動處理掉所有 PR（約 30 秒）
目前 API 用 token 會回 404/403（需 **Classic PAT 的 `repo`** 或 **Fine-grained 的 Pull requests + Issues 寫入**）。請直接到 GitHub 操作：

1. **[PR #25](https://github.com/SunZhi-Will/sunui-design/pull/25)** → 點綠色 **Merge pull request** → 確認合併  
2. **[PR #26](https://github.com/SunZhi-Will/sunui-design/pull/26)** → 點 **Close pull request**

## 一鍵腳本（需 Token 具備寫入權限）
若使用 **Classic PAT** 請勾選 `repo`；若為 **Fine-grained** 請勾選此 repo 的 **Pull requests: Read and write**、**Issues: Read and write**。然後執行：
```powershell
$env:GITHUB_TOKEN = "your_github_token"
.\scripts\close-open-prs.ps1
```
