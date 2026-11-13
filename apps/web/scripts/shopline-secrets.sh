#!/usr/bin/env bash
# 把 SHOPLINE 的機密設到 Vercel（sunui 專案的 Production）。做法照萬寶箱的 scripts/shopline-secrets.sh：
# 每一項會請你貼上值，輸入時不會顯示，值不會出現在任何檔案或對話裡。
# 來源：SHOPLINE Payments 商家後台 > 設定 > 開發者管理：
#   SHOPLINE_API_KEY   金鑰管理 > API Key（sk_ 開頭，跟萬寶箱、PostVault 同一把）
#   SHOPLINE_SIGN_KEY  Webhook 管理 > 新增 https://sunui.synvize.com/api/shopline/webhook 之後，那一列自己的 Sign Key
#                      （每個 Webhook 各有一把，不能用萬寶箱、PostVault 或課程平台那列的）
# 商家編號與 SHOPLINE_ENV 不是機密，由 Claude 直接設定。
# 用法（在 apps/web 底下）：./scripts/shopline-secrets.sh [只設定這幾項]
# 設定完要重新部署才會生效：vercel redeploy <最新的 production 網址> --target production
set -euo pipefail
cd "$(dirname "$0")/.."
[ $# -gt 0 ] || set -- SHOPLINE_API_KEY SHOPLINE_SIGN_KEY
for name in "$@"; do
  printf '→ %s（貼上後按 Enter，輸入不會顯示）：' "$name"
  IFS= read -rs value
  echo
  if [ -z "$value" ]; then
    echo "  略過（沒有輸入）"
    continue
  fi
  # 已經有的先移除，重跑這支腳本就能換值
  vercel env rm "$name" production -y >/dev/null 2>&1 || true
  printf '%s' "$value" | vercel env add "$name" production >/dev/null
  unset value
  echo "  已設定 $name"
done
echo "完成。接著重新部署，然後到 /admin/orders 按「測試 SHOPLINE 連線」。"
