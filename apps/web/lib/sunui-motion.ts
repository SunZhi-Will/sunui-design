// 型錄內部的匯入路徑。block 寫 `@/lib/sunui-motion`，shadcn 安裝 /r/sunui-motion.json 時會放到買家的 lib/sunui-motion.ts；
// 在這個 repo 裡轉接到 registry 的原始檔，兩邊只有一份程式。
export * from "@/registry/lib/sunui-motion/motion";
