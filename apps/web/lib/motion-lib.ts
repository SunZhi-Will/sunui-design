import { readRegistryFile } from "@/lib/registry";

// sunui-motion：三種彈簧與少數允許的動態，給 block 和買家共用同一套節奏。
// 和 sunui-skill 一樣不是 block，不列進型錄與 registry.json，只在 /r/sunui-motion.json 提供。

export const motionLibName = "sunui-motion";

const file = { path: "registry/lib/sunui-motion/motion.ts", type: "registry:lib", target: "lib/sunui-motion.ts" };

export async function motionRegistryItem() {
  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json",
    name: motionLibName,
    type: "registry:lib",
    title: "SunUI Motion",
    description:
      "The three SunUI springs (snappy, gentle, stamp) and the few motions the design rules allow: press, stamp, error shake, drawer panels, list collapse and number roll. Every helper has a reduced-motion path. There is deliberately no fade-up, blur-in, pulse or confetti; see /docs/motion.",
    dependencies: ["framer-motion"],
    files: [{ ...file, content: await readRegistryFile(file) }],
  };
}
