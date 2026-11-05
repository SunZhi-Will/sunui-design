// 部署時把私有 Pro repo 拉進 registry/pro。本機已經有就跳過；沒設定環境變數也跳過（公開 clone 照樣能建置）。
// 需要：SUNUI_PRO_REPO（例如 SunZhi-Will/sunui-design-pro）與 SUNUI_PRO_TOKEN（只讀該 repo 的 fine-grained token）。
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const target = path.join(process.cwd(), "registry", "pro");
const repo = process.env.SUNUI_PRO_REPO;
const token = process.env.SUNUI_PRO_TOKEN;

if (existsSync(path.join(target, "registry.json"))) {
  console.log("[fetch-pro] registry/pro already present, skipping");
} else if (!repo || !token) {
  console.log("[fetch-pro] SUNUI_PRO_REPO / SUNUI_PRO_TOKEN not set, building without Pro");
} else {
  const ref = process.env.SUNUI_PRO_REF ?? "master";
  execFileSync(
    "git",
    ["clone", "--depth", "1", "--branch", ref, `https://x-access-token:${token}@github.com/${repo}.git`, target],
    { stdio: ["ignore", "ignore", "inherit"] },
  );
  console.log(`[fetch-pro] cloned ${repo}@${ref}`);
}
