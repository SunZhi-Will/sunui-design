#!/usr/bin/env bash
# 把 SunUI 正式環境變數設到 Cloud Run 服務 sunui，並把續訂排程（Cloud Scheduler）接上同一組 CRON_SECRET。
# 在自己的終端機跑（會問敏感值，輸入時不顯示）：
#   bash apps/web/scripts/cloudrun-env.sh
#
# 非敏感值從 Vercel 拉（vercel env pull）。Vercel 上標成 sensitive 的值讀不回來，這裡逐一詢問：
# 直接按 Enter 表示保留 Cloud Run 上現有的值（第一次設定時就是留空）。
# 暫存檔放在 mktemp 的位置，權限 600，結束時刪除。
set -euo pipefail

PROJECT="${PROJECT:-sunkoro}"
REGION="${REGION:-us-east4}"
SERVICE="${SERVICE:-sunui}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

PULLED="$(mktemp)"; OUT="$(mktemp)"; CURRENT="$(mktemp)"
chmod 600 "$PULLED" "$OUT" "$CURRENT"
trap 'rm -f "$PULLED" "$OUT" "$CURRENT"' EXIT

# Vercel 讀得回來的（非 sensitive）
PLAIN=(KV_REST_API_URL KV_REST_API_TOKEN RESEND_FROM RESEND_REPLY_TO)
# Vercel 上是 sensitive，要手動輸入
SECRET=(SHOPLINE_MERCHANT_ID SHOPLINE_API_KEY SHOPLINE_SIGN_KEY SHOPLINE_ENV RESEND_API_KEY RESEND_WAITLIST_SEGMENT_ID SUNUI_ADMIN_TOKEN SUNUI_ADMIN_EMAILS SUNUI_HASH_SALT GOOGLE_CLIENT_ID SUNUI_SALES_OPEN)

echo "[1/3] 從 Vercel 拉非敏感值"
(cd "$ROOT" && vercel env pull "$PULLED" --environment=production --yes >/dev/null)

yaml_line() { # 名稱 值：以 JSON 字串寫成 YAML（值裡有引號或冒號也安全）
  node -e 'process.stdout.write(process.argv[1] + ": " + JSON.stringify(process.argv[2]) + "\n")' "$1" "$2"
}

{
  yaml_line NEXT_PUBLIC_SITE_URL "https://sunui.synvize.com"
  yaml_line NEXT_PUBLIC_MEDIA_URL "https://media.synvize.com"
} >"$OUT"

for name in "${PLAIN[@]}"; do
  value="$(grep -E "^${name}=" "$PULLED" | head -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//')" || true
  if [ -n "$value" ]; then yaml_line "$name" "$value" >>"$OUT"; echo "  $name: 已從 Vercel 取得"; else echo "  $name: Vercel 沒有，略過"; fi
done

echo "[2/3] 輸入敏感值（不會顯示；Enter 跳過表示保留 Cloud Run 現有值）"
for name in "${SECRET[@]}"; do
  read -r -s -p "  $name: " value; echo
  [ -n "$value" ] && yaml_line "$name" "$value" >>"$OUT"
done

read -r -s -p "  CRON_SECRET（Enter 自動產生新的）: " cron; echo
[ -z "$cron" ] && cron="$(openssl rand -hex 24)"
yaml_line CRON_SECRET "$cron" >>"$OUT"

echo "[3/3] 更新 Cloud Run 與續訂排程"
# --env-vars-file 會先清空現有變數：把 Cloud Run 上現有的值併進來，這次沒輸入的才不會被清掉
gcloud run services describe "$SERVICE" --project "$PROJECT" --region "$REGION" --format=json >"$CURRENT"
node -e '
const fs = require("fs");
const [currentPath, outPath] = process.argv.slice(1);
const env = {};
for (const e of JSON.parse(fs.readFileSync(currentPath, "utf8")).spec.template.spec.containers[0].env ?? []) if ("value" in e) env[e.name] = e.value;
for (const line of fs.readFileSync(outPath, "utf8").split("\n").filter(Boolean)) {
  const i = line.indexOf(": ");
  env[line.slice(0, i)] = JSON.parse(line.slice(i + 2));
}
fs.writeFileSync(outPath, Object.entries(env).map(([k, v]) => k + ": " + JSON.stringify(v)).join("\n") + "\n");
' "$CURRENT" "$OUT"
gcloud run services update "$SERVICE" --project "$PROJECT" --region "$REGION" --env-vars-file "$OUT" --quiet >/dev/null
URL="$(gcloud run services describe "$SERVICE" --project "$PROJECT" --region "$REGION" --format="value(status.url)")/api/cron/renewals"
# 時間與原本 vercel.json 相同：每天 01:00 UTC
if gcloud scheduler jobs describe sunui-renewals --project "$PROJECT" --location "$REGION" >/dev/null 2>&1; then
  gcloud scheduler jobs update http sunui-renewals --project "$PROJECT" --location "$REGION" \
    --schedule "0 1 * * *" --time-zone "Etc/UTC" --uri "$URL" --http-method GET \
    --update-headers "Authorization=Bearer ${cron}" --attempt-deadline 300s --quiet >/dev/null
else
  gcloud scheduler jobs create http sunui-renewals --project "$PROJECT" --location "$REGION" \
    --schedule "0 1 * * *" --time-zone "Etc/UTC" --uri "$URL" --http-method GET \
    --headers "Authorization=Bearer ${cron}" --attempt-deadline 300s --quiet >/dev/null
fi
echo "完成。Cloud Run 的環境變數與排程 sunui-renewals 已更新。"
