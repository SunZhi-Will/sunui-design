// 部署時把私有 Pro repo 拉進 registry/pro。本機已經有就跳過；沒設定環境變數也跳過（公開 clone 照樣能建置）。
// 需要：SUNUI_PRO_REPO（例如 SunZhi-Will/sunui-design-pro）與 SUNUI_PRO_TOKEN（只讀該 repo 的 fine-grained token）。
// Vercel 正式環境設了 SUNUI_PRO_REPO 卻缺 token 或拉不下來時，直接讓建置失敗：
// 安靜地部署成「全部免費」的版本比部署失敗更糟，失敗時線上會保留上一版。
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const target = path.join(process.cwd(), "registry", "pro");
const repo = process.env.SUNUI_PRO_REPO;
const token = process.env.SUNUI_PRO_TOKEN;
const production = process.env.VERCEL_ENV === "production";

function fail(message) {
  console.error(`[fetch-pro] ERROR: ${message}`);
  process.exit(1);
}

if (existsSync(path.join(target, "registry.json"))) {
  console.log("[fetch-pro] registry/pro already present, skipping");
} else if (!repo && !token) {
  console.log("[fetch-pro] SUNUI_PRO_REPO / SUNUI_PRO_TOKEN not set, building without Pro");
} else if (!repo || !token) {
  const missing = repo ? "SUNUI_PRO_TOKEN" : "SUNUI_PRO_REPO";
  if (production) fail(`${missing} is not set, so Pro would be missing from production. Add it in Vercel and redeploy.`);
  console.log(`[fetch-pro] ${missing} not set, building without Pro`);
} else {
  const ref = process.env.SUNUI_PRO_REF ?? "master";
  try {
    execFileSync(
      "git",
      ["clone", "--depth", "1", "--branch", ref, `https://x-access-token:${token}@github.com/${repo}.git`, target],
      { stdio: ["ignore", "ignore", "inherit"] },
    );
  } catch {
    fail(`could not clone ${repo}@${ref}. Check that SUNUI_PRO_TOKEN can read that repo and has not expired.`);
  }
  if (!existsSync(path.join(target, "registry.json"))) fail(`${repo}@${ref} has no registry.json`);
  console.log(`[fetch-pro] cloned ${repo}@${ref}`);
}
