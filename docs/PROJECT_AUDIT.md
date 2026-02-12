# SunUI Design 專案檢視報告

本文件為專案結構與檔案組織的全面檢視結果，包含問題說明與整理建議。

---

## 一、專案概覽

- **類型**：Monorepo（Lerna + npm workspaces）
- **用途**：React UI 組件庫，含多個獨立 package 與整合包
- **根目錄**：Next.js 文檔/展示、Storybook、共用設定與腳本

---

## 二、發現的問題與建議

### 1. 設定檔重複／衝突

| 項目 | 說明 | 建議 |
|------|------|------|
| **ESLint 雙重設定** | 同時存在 `.eslintrc.json`（Next + Storybook）與 `eslint.config.mjs`（flat config，無 Next/Storybook）。`npm run lint` 使用 `next lint`，實際可能以 Next 的 ESLint 為主。 | 擇一為準：若以 Next 為主，可考慮刪除或精簡 `eslint.config.mjs`，並在 `.eslintrc.json` 中保留規則；若要以 flat config 為主，需在 `eslint.config.mjs` 中整合 `eslint-config-next` 與 `eslint-plugin-storybook`。 |
| **PostCSS** | 根目錄有 `postcss.config.mjs`，`packages/core` 有 `postcss.config.ts`。 | 屬合理分工（根給 Next/Storybook，core 給該 package）。可於 `.cursorrules/project-structure.md` 註明兩者用途，避免誤會。 |
| **Tailwind** | 根目錄與 `packages/core` 各有 `tailwind.config.*`。 | 同上，合理；在文檔中說明即可。 |

### 2. 文件與實際不符

| 位置 | 問題 | 建議 |
|------|------|------|
| **README.md / README.zh.md** | 組件連結使用錯誤路徑：`packages/filter/`、`packages/floating/`、`packages/gradient/`、`packages/social/`，實際資料夾為 `filter-grid`、`floating-button`、`gradient-background`、`social-button`。 | 已建議修正為實際路徑（見下方「已修正項目」）。 |
| **.cursorrules/project-structure.md** | 記載 `.storybook` 為 `main.js`、`preview.js`、`theme.js`，實際為 `main.ts`、`preview.ts`、`manager.ts`（無 theme.js）。 | 更新為目前檔名與用途。 |
| **.cursorrules/project-structure.md** | 記載 `scripts/` 含 `build.js`、`publish.js`、`create-package.js`，實際為 `changelog.js`、`version.js`、`pack-all.js`、`close-open-prs.ps1`。 | 更新為現有腳本並簡述用途。 |
| **.cursorrules/project-structure.md** | 記載 `src/app/`（Next App Router），目前專案 `src/` 下僅有 `stories/` 與 `styles/`。 | 若未使用 App Router 或結構已改，請依現況修正或刪除不存在的目錄說明。 |

### 3. 套件與依賴不一致

| 項目 | 說明 | 建議 |
|------|------|------|
| **根 package.json 依賴** | 根目錄未列出 `@sunui-design/file-upload`，但 `src/stories/FileUpload.stories.tsx` 有使用；workspace 會解析到 `packages/file-upload`。 | 若希望依賴明確、CI 與部署一致，建議在根 `package.json` 的 `dependencies` 中加入 `@sunui-design/file-upload`（版本與其他 @sunui-design 一致）。 |
| **packages/all 導出** | `packages/all`（對外為 `@sunui-design/react`）僅導出 core、floating、social、gradient、filter，未導出 card、file-upload、countdown-banner、side-panel。 | 若「all」預期為全組件入口，應在 `packages/all/src/index.ts` 補上其餘組件導出；否則在 README 明確說明「all 僅包含部分組件」。 |
| **Lerna 版本** | `lerna.json` 為 `0.0.54`，根 `package.json` 為 `0.0.53`。 | 統一版本號（通常以 lerna 為準做 release，可將 root 改為 0.0.54 或在下一次 release 時一併統一）。 |

### 4. 檔案與資料夾組織

| 項目 | 說明 | 建議 |
|------|------|------|
| **.cursorrules 目錄** | 專案使用 `.cursorrules/` 存放設計與流程文件（非 Cursor 預設的 `.cursor/rules/`）。內容有價值，但易被當成「多餘文件」。 | 保留；可在根 README 加一節「專案文檔」，連結到 `.cursorrules/README.md`，並在 `.cursorrules/README.md` 註明「專案設計與協作說明，供開發與貢獻者使用」。 |
| **.github/PR_SUMMARY.md** | 為 PR 處理摘要（含 PR #25/#26、本機變更、手動步驟）。 | 屬營運紀錄，可保留在 `.github/`；若 PR 已處理完，可精簡為「已處理」摘要或移入 `docs/` 並在檔名標註日期。 |
| **文件分散** | 根目錄有 README、README.zh、CHANGELOG、CONTRIBUTING、CODE_OF_CONDUCT、SECURITY、LICENSE；.github 有 ISSUE_TEMPLATE、workflows、CODEOWNERS 等。 | 結構合理。建議在 README 開頭或結尾加「專案文件索引」：列出上述文件與 `.cursorrules`、`docs/` 的用途與連結，減少「好多文件、好亂」的感覺。 |
| **docs 目錄** | 目前僅有本檢視報告（`docs/PROJECT_AUDIT.md`）。 | 後續可將「僅供內部/貢獻者」的說明（如 PR 摘要、審計、決策紀錄）集中到 `docs/`，根目錄與 .github 維持對外與 CI 用。 |

### 5. 各 package 之間不一致

| 項目 | 說明 | 建議 |
|------|------|------|
| **.npmignore** | 僅部分 package 有（filter-grid、floating-button、gradient-background、social-button），其餘沒有。 | 若發布到 npm，建議每個 package 要麼有 `.npmignore`，要麼在 `package.json` 用 `files` 欄位控制發布內容，並在 `.cursorrules` 或 CONTRIBUTING 中寫明規則。 |
| **LICENSE** | 多數 package 內有 LICENSE 檔案。 | 可接受；若希望單一來源，可改為在根目錄說明「全 repo 依根 LICENSE」，各 package 不重複放（需符合授權慣例）。 |
| **pnpm-lock.yaml** | 僅 `packages/core`、`packages/side-panel` 有 `pnpm-lock.yaml`，其餘與根目錄使用 npm。 | 若全 repo 使用 npm workspaces，可考慮刪除子 package 的 pnpm-lock，避免混用；若未來要全面改用 pnpm，再在根目錄統一。 |

### 6. 其他

| 項目 | 說明 | 建議 |
|------|------|------|
| **CHANGELOG** | [Unreleased] 與 [0.1.0] 內容重複，且目前版本已到 0.0.53。 | 整理 CHANGELOG，使版本與 lerna/package.json 對齊，並避免重複段落。 |
| **README 連結** | 兩份 README 中 `main/LICENSE` 的連結為 `yourusername/sun-ui-design`。 | 改為實際 org/repo（例如 `SunZhi-Will/sunui-design`）。 |

---

## 三、建議的目錄與文件分工（整理後）

```
sunui-design/
├── .cursorrules/          # 專案設計與協作說明（架構、主題、組件設計、流程）
│   └── README.md          # 文檔索引（已有）
├── .github/               # GitHub 用：workflows、Issue/PR 模板、CODEOWNERS 等
├── docs/                  # 專案內部/審計文件（如本 PROJECT_AUDIT.md）
├── packages/              # 各組件與 core、all
├── scripts/               # 建構、版本、changelog、一次性腳本
├── src/                   # 根應用（stories、styles；若無 app 則在文檔中說明）
├── README.md, README.zh.md, CHANGELOG.md, CONTRIBUTING.md, ...
└── 各類設定檔（擇一或明確分工，見上表）
```

- **對外**：README、CONTRIBUTING、CHANGELOG、LICENSE、SECURITY、CODE_OF_CONDUCT。
- **貢獻者/維護者**：`.cursorrules/`、`docs/`、`.github/` 的說明與模板。

---

## 四、已修正項目（可一併提交）

1. **README.md / README.zh.md**：組件連結已改為實際路徑  
   - `packages/filter/` → `packages/filter-grid/`  
   - `packages/floating/` → `packages/floating-button/`  
   - `packages/gradient/` → `packages/gradient-background/`  
   - `packages/social/` → `packages/social-button/`

（其餘如 .cursorrules 內容更新、根依賴補齊、packages/all 導出、CHANGELOG 與 README 連結，可依優先級分次處理。）

---

## 五、優先級建議

| 優先級 | 項目 | 理由 |
|--------|------|------|
| 高 | 修正 README 組件連結與 repo 連結 | 使用者與貢獻者第一眼會看到的文件 |
| 高 | 統一/釐清 ESLint 設定 | 避免 lint 結果與預期不符 |
| 中 | 更新 .cursorrules/project-structure.md | 與實際目錄、檔名、腳本一致 |
| 中 | 根 package.json 補上 file-upload、packages/all 補齊導出或更新說明 | 依賴與「all」語意一致 |
| 低 | CHANGELOG 與版本對齊、.github/PR_SUMMARY 精簡或歸檔 | 維護與歷史紀錄清晰 |
| 低 | 各 package .npmignore/files、pnpm-lock 取捨 | 發布與套件管理一致 |

---

*本報告撰寫日期：2025-02-12。後續可依實際變更再更新此文件。*
