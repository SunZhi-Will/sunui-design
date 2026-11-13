import { NextResponse, type NextFetchEvent, type NextRequest } from "next/server";

import { recordInstall } from "@/lib/installs";

// /r/<name>.json 是靜態輸出，route 本身不會執行，所以在這裡計數。
// 不等待寫入完成，Redis 慢或失敗都不影響安裝。
// （定價頁瀏覽不在這裡計：middleware 看不到 Next 的 prefetch 標頭，會把預先載入也算進去，改由頁面上的 beacon 回報。）
const NOT_BLOCKS = new Set(["registry", "sunui-skill"]);

export function middleware(request: NextRequest, event: NextFetchEvent) {
  const match = request.nextUrl.pathname.match(/^\/r\/([a-z0-9-]+)\.json$/);
  const name = match?.[1];
  if (name && !NOT_BLOCKS.has(name)) {
    event.waitUntil(recordInstall(name, request.headers.get("user-agent")).catch(() => {}));
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/r/:name*",
};
