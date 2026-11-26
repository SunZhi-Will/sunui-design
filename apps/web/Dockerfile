# SunUI 網站的 Cloud Run 映像。建置環境是 repo 根目錄（monorepo，相依套件裝在根目錄）：
#   gcloud builds submit --config apps/web/cloudbuild.yaml   （見 apps/web/DEPLOY.md）
# 只有最後一層會推上去：前兩層的原始碼、registry/pro 都不在映像裡，只留建好的 standalone 輸出。

FROM node:22-slim AS deps
WORKDIR /repo
COPY package.json package-lock.json ./
COPY packages ./packages
COPY apps/web/package.json ./apps/web/package.json
RUN npm ci -w @sunui-design/web --ignore-scripts --no-audit --no-fund

FROM deps AS build
COPY apps/web ./apps/web
# 用戶端會看到的網址要在建置時寫死進 JS（NEXT_PUBLIC_*）
ARG NEXT_PUBLIC_SITE_URL=https://sunui.synvize.com
ARG NEXT_PUBLIC_MEDIA_URL=https://media.synvize.com
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_MEDIA_URL=$NEXT_PUBLIC_MEDIA_URL \
    NEXT_OUTPUT_STANDALONE=1 \
    NEXT_TELEMETRY_DISABLED=1
RUN npm run build -w @sunui-design/web \
 && rm -f apps/web/.next/standalone/apps/web/.env*

FROM node:22-slim AS run
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=8080 \
    HOSTNAME=0.0.0.0
COPY --from=build --chown=node:node /repo/apps/web/.next/standalone ./
COPY --from=build --chown=node:node /repo/apps/web/.next/static ./apps/web/.next/static
# public 要整包帶上：目錄頁在執行期用 public/og 判斷有沒有海報（媒體本身由 R2 送，不從這裡讀）
COPY --from=build --chown=node:node /repo/apps/web/public ./apps/web/public
USER node
EXPOSE 8080
CMD ["node", "apps/web/server.js"]
