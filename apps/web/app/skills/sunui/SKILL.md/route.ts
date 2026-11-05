import { skillMarkdown } from "@/lib/agent/skill";

export const dynamic = "force-static";

// 不用 shadcn CLI 時，可以直接下載這份放進 .claude/skills/sunui/SKILL.md
export function GET() {
  return new Response(skillMarkdown(), { headers: { "Content-Type": "text/markdown; charset=utf-8" } });
}
