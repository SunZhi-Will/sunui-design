"use client";

import { useState } from "react";

import { useDemoLocale, useDemoText } from "@/lib/demo-locale";

import { RedeemKeyInput, type LicenseState } from "./redeem-key-input";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Catalog card: one field takes either a redeem code or a license key, groups as you type and detects which kind it is. On a successful redeem the input row turns into a supporter card. Scrollable inside the frame. */
export default function RedeemKeyInputCard() {
  const locale = useDemoLocale();
  const haveKey = useDemoText({
    en: "License key or supporter code",
    "zh-TW": "授權碼或贊助兌換碼",
    "zh-CN": "许可证密钥或赞助兑换码",
    ja: "ライセンスキーまたはサポーターコード",
  });
  const [license, setLicense] = useState<LicenseState>({ tier: "trial", trialDaysLeft: 9 });

  return (
    <div className="mx-auto h-[230px] w-72 overflow-y-auto rounded-[14px]">
      <RedeemKeyInput
        className="w-full"
        state={license}
        locale={locale}
        labels={{ haveKey }}
        onActivate={async (_code, kind) => {
          await wait(700);
          // Demo only: any 12-character redeem code counts as valid, any UUID is reported as not found
          if (kind === "pro") return { ok: false, error: "not_found" };
          setLicense({ tier: "supporter" });
          return { ok: true };
        }}
      />
    </div>
  );
}
