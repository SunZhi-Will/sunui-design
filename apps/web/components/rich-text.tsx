import Link from "next/link";
import { Fragment } from "react";

// 把字典字串裡的 `code` 與 [文字](連結) 轉成元素，其餘維持純文字
const TOKEN = /`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)/g;

export function RichText({ text, codeClassName }: { text: string; codeClassName?: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(TOKEN)) {
    const index = match.index ?? 0;
    if (index > last) parts.push(text.slice(last, index));
    if (match[1] !== undefined) {
      parts.push(
        <code key={index} className={codeClassName}>
          {match[1]}
        </code>,
      );
    } else {
      const href = match[3];
      parts.push(
        href.startsWith("/") && !href.startsWith("//") && !href.endsWith(".txt") ? (
          <Link key={index} href={href}>
            {match[2]}
          </Link>
        ) : (
          <a key={index} href={href}>
            {match[2]}
          </a>
        ),
      );
    }
    last = index + match[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <Fragment>{parts}</Fragment>;
}
