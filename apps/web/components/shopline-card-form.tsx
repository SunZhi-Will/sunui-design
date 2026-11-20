"use client";

import { useEffect, useRef, useState } from "react";

// SHOPLINE Payments 內嵌式刷卡表單（綁卡）。SDK 從 SHOPLINE 的 CDN 載入，卡號只在 SHOPLINE 的 iframe 裡。
// 流程：createPayment() 拿 paySession → 交給伺服器呼叫 payment/create → 伺服器回 nextAction → pay(nextAction)
// 完成付款（需要 3D 驗證時 SDK 會自己導去發卡行，再回到 returnUrl）。文件：docs.shoplinepayments.com/guide/quick/

const SDK_URL = "https://cdn.shoplinepayments.com/sdk/v1/payment-web.js";

type SdkError = { code?: string; message?: string };
type SdkPayment = {
  createPayment: () => Promise<{ paySession?: string; error?: SdkError }>;
  pay: (nextAction: unknown) => Promise<{ error?: SdkError } | undefined>;
  destroy?: () => void;
};
type SdkFactory = (options: Record<string, unknown>) => Promise<{ payment?: SdkPayment; error?: SdkError }>;

declare global {
  interface Window {
    ShoplinePayments?: SdkFactory;
  }
}

let loading: Promise<SdkFactory> | null = null;

function loadSdk() {
  if (typeof window !== "undefined" && window.ShoplinePayments) return Promise.resolve(window.ShoplinePayments);
  loading ??= new Promise<SdkFactory>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SDK_URL;
    script.async = true;
    script.onload = () => (window.ShoplinePayments ? resolve(window.ShoplinePayments) : reject(new Error("sdk")));
    script.onerror = () => {
      loading = null;
      reject(new Error("sdk"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

export type CardSubmitResult = { nextAction?: unknown; done?: boolean; error?: string };

export function ShoplineCardForm({
  config,
  amountMinor,
  language,
  onPaySession,
  doneUrl,
  labels,
}: {
  config: { clientKey: string; merchantId: string; sandbox: boolean };
  /** 新台幣 × 100 */
  amountMinor: number;
  language: string;
  /** 把 paySession 交給伺服器（server action），回 nextAction 或錯誤 */
  onPaySession: (paySession: string) => Promise<CardSubmitResult>;
  /** 不需要 nextAction 就完成時要去的頁面 */
  doneUrl: string;
  labels: { loading: string; loadError: string; submit: string; pending: string; failed: string };
}) {
  const container = useRef<HTMLDivElement>(null);
  const payment = useRef<SdkPayment | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let cancelled = false;
    loadSdk()
      .then(async (factory) => {
        if (cancelled || !container.current) return;
        const { payment: instance, error: initError } = await factory({
          clientKey: config.clientKey,
          merchantId: config.merchantId,
          paymentMethod: "CreditCard",
          currency: "TWD",
          amount: amountMinor,
          element: "#slp-card",
          language,
          ...(config.sandbox ? { env: "sandbox" } : {}),
          // 訂閱一定要存卡：不給勾選框（switchVisible false 代表強制綁卡），顯示信用卡與定期扣款協議
          paymentInstrument: {
            bindCard: {
              enable: true,
              protocol: { switchVisible: false, textType: { paymentAgreement: true, subscribeAgreement: true } },
            },
          },
        });
        if (cancelled) return instance?.destroy?.();
        if (!instance || initError) return setState("error");
        payment.current = instance;
        setState("ready");
      })
      .catch(() => !cancelled && setState("error"));
    return () => {
      cancelled = true;
      payment.current?.destroy?.();
      payment.current = null;
    };
  }, [config.clientKey, config.merchantId, config.sandbox, amountMinor, language]);

  async function submit() {
    const instance = payment.current;
    if (!instance || pending) return;
    setError(undefined);
    setPending(true);
    try {
      // createPayment 要在點擊當下呼叫（文件：不然部分付款方式會失敗）
      const { paySession, error: createError } = await instance.createPayment();
      if (createError || !paySession) {
        setPending(false);
        // 欄位沒填好時 SDK 會在表單上標出來，這裡不重複顯示原始訊息
        return;
      }
      const result = await onPaySession(paySession);
      if (result.error) {
        setError(result.error);
        setPending(false);
        return;
      }
      if (result.nextAction) {
        const payResult = await instance.pay(result.nextAction);
        if (payResult?.error) {
          setError(labels.failed);
          setPending(false);
        }
        // 成功時 SDK 會導到 returnUrl
        return;
      }
      window.location.assign(doneUrl);
    } catch {
      setError(labels.failed);
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div id="slp-card" ref={container} className="min-h-24" />
      {state === "loading" && <p className="text-sm text-subtle">{labels.loading}</p>}
      {state === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {labels.loadError}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={submit}
        disabled={state !== "ready" || pending}
        className="h-11 w-full rounded-md px-4 text-sm font-medium disabled:opacity-50 btn-primary"
      >
        {pending ? labels.pending : labels.submit}
      </button>
    </div>
  );
}
