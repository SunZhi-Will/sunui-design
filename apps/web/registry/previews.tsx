"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

// 每個 block 的展示元件。新增 block 時在這裡註冊 demo。
export const previews: Record<string, ComponentType> = {
  "countdown-banner": dynamic(() => import("./free/countdown-banner/demo")),
};
