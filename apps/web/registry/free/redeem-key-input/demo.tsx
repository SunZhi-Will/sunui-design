"use client";

import { useRef, useState } from "react";

import { useDemoAutoplay } from "@/lib/demo-autoplay";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { RedeemKeyInput, type LicenseState, type RedeemOutcome } from "./redeem-key-input";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// 模擬的授權後端：12 碼兌換碼本機比對，UUID 交給 Lemon Squeezy
const SUPPORTER_CODES = new Set(["K7QM4XPR2HND"]);
const PRO_KEYS: Record<string, RedeemOutcome> = {
  "3f2a9c1e-7b4d-4e8a-9c21-5d6e7f8a9b0c": { ok: true },
};

const pricing = { current: "$59", strike: "$89", basic: "$19", earlyBird: true, competitorYearly: "$229" };

const copy = {
  en: { customer: "Lin Wei", version: "Version v1.8.2", upToDate: "Up to date", hint: "Codes from the order email", supporter: "Supporter code", pro: "Pro key" },
  "zh-TW": { customer: "林偉", version: "版本 v1.8.2", upToDate: "已是最新版本", hint: "訂單信裡的代碼", supporter: "贊助兌換碼", pro: "Pro 授權碼" },
  "zh-CN": { customer: "林伟", version: "版本 v1.8.2", upToDate: "已是最新版本", hint: "订单邮件里的代码", supporter: "赞助兑换码", pro: "Pro 许可证密钥" },
  ja: { customer: "林 偉", version: "バージョン v1.8.2", upToDate: "最新です", hint: "注文メールに記載のコード", supporter: "サポーターコード", pro: "Pro キー" },
};

export default function RedeemKeyInputDemo() {
  const locale = useDemoLocale();
  const t = useDemoText(copy);
  const [license, setLicense] = useState<LicenseState>({ tier: "trial", trialDaysLeft: 9 });
  const ref = useRef<HTMLDivElement>(null);

  // 預覽自己演：先打錯一組兌換碼被退回，再逐字打 Pro 金鑰並啟用
  const cursor = useDemoAutoplay(ref, async (d) => {
    const input = () => d.find("input[type=text]");
    const activate = () => input().parentElement?.parentElement?.querySelector<HTMLElement>(":scope > button");
    await d.click(input);
    await d.type(input, "K7QM4XPR2HNX");
    await d.wait(400);
    await d.click(activate);
    await d.wait(1600);
    await d.click(input);
    await d.clear(input);
    await d.type(input, "3f2a9c1e7b4d4e8a9c215d6e7f8a9b0c", { cps: 22 });
    await d.wait(500);
    await d.click(activate);
  });

  return (
    <div ref={ref} className="relative flex w-full min-w-0 flex-col items-center gap-4 rounded-xl bg-[#111111] p-3 sm:p-6">
      <RedeemKeyInput
        locale={locale}
        state={license}
        pricing={pricing}
        onActivate={async (code, kind) => {
          await wait(800);
          if (kind === "supporter") {
            if (!SUPPORTER_CODES.has(code)) return { ok: false, error: "invalid" };
            setLicense({ tier: "supporter" });
            return { ok: true };
          }
          const r = PRO_KEYS[code.toLowerCase()] ?? { ok: false, error: "not_found" };
          if (r.ok) setLicense({ tier: "pro", hasKey: true, status: "active", maskedKey: "3F2A····9B0C", customerName: t.customer });
          return r;
        }}
        onDeactivate={async () => {
          await wait(600);
          setLicense({ tier: "free", freeExportsRemaining: 2, freeExportLimit: 3 });
        }}
        footer={
          <div className="mt-1 flex items-center gap-2 border-t border-white/[0.06] pt-3">
            <span className="text-[11px] text-[#8a8a8a]">{t.version}</span>
            <span className="ml-auto text-[11px] text-[#a3a3a3]">{t.upToDate}</span>
          </div>
        }
      />
      {/* 示範用的兩組碼放在面板外，像使用者手邊的訂單信；可以整段選取貼上 */}
      <div className="w-[440px] max-w-full space-y-1.5 px-1 text-[11px] text-[#8a8a8a]">
        <p className="text-[#a3a3a3]">{t.hint}</p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
          <dt>{t.supporter}</dt>
          <dd className="font-mono tracking-[0.04em] break-all text-[#ededed] select-all">K7QM4XPR2HND</dd>
          <dt>{t.pro}</dt>
          <dd className="font-mono tracking-[0.04em] break-all text-[#ededed] select-all">3f2a9c1e-7b4d-4e8a-9c21-5d6e7f8a9b0c</dd>
        </dl>
      </div>
      {cursor}
    </div>
  );
}
