"use client";

import { usePathname } from "next/navigation";

/**
 * 在指定路徑底下不顯示 children。
 * 用在創始會員公告條：定價頁已經有創始會員卡（重複），結帳與完成頁是付款的那一刻（不該推別的方案）。
 * 見 reports/購買流程 UIUX 分析-2026-11-15.md 第 2、3 項。
 */
export function HideOnPaths({ prefixes, children }: { prefixes: string[]; children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  if (prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return null;
  return children;
}
