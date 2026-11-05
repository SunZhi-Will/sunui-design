"use client";

import { useState } from "react";

import { RedeemKeyInput, type LicenseState } from "./redeem-key-input";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** 型錄卡片：同一格輸入兌換碼或授權碼，打字時即時判斷是哪一種，按啟用看結果，可在框內捲動。 */
export default function RedeemKeyInputCard() {
  const [license, setLicense] = useState<LicenseState>({ tier: "trial", trialDaysLeft: 9 });

  return (
    <div className="mx-auto h-[230px] w-72 overflow-y-auto rounded-[14px]">
      <RedeemKeyInput
        className="w-full"
        state={license}
        labels={{ haveKey: "License key or supporter code" }}
        onActivate={async (_code, kind) => {
          await wait(700);
          // 示範用：任何 12 碼兌換碼都算有效，UUID 一律查無此碼
          if (kind === "pro") return { ok: false, error: "not_found" };
          setLicense({ tier: "supporter" });
          return { ok: true };
        }}
      />
    </div>
  );
}
