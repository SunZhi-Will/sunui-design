// 結帳頁與完成頁的文案（四語）。先放在獨立檔案：lib/messages.ts 同時有別的工作在改，之後再併進去。

import type { Locale } from "./i18n";

type Copy = {
  metaTitle: string;
  back: string;
  planName: Record<"founding" | "pro" | "team", string>;
  planNote: Record<"founding" | "pro" | "team", string>;
  chargedInTwd: (twd: string, usd: number) => string;
  emailLabel: string;
  emailHint: string;
  pay: string;
  paying: string;
  terms: string;
  secure: string;
  errors: { email: string; closed: string; soldOut: string; upstream: string; rate: string };
  done: {
    title: string;
    pendingTitle: string;
    pendingBody: string;
    pendingSlow: string;
    paidBody: string;
    keyLabel: string;
    copy: string;
    copied: string;
    keyPrivate: string;
    steps: string;
    step1: string;
    step2: string;
    step3: string;
    emailNote: (email: string) => string;
    otherBrowser: string;
    problemTitle: string;
    problemBody: string;
    browse: string;
  };
};

const en: Copy = {
  metaTitle: "Checkout",
  back: "Back to pricing",
  planName: { founding: "Founding member", pro: "Pro", team: "Team" },
  planNote: {
    founding: "Lifetime Pro at the founding price. Limited seats.",
    pro: "One-time payment. All Pro blocks and future updates.",
    team: "One-time payment for 5 people. All Pro blocks and future updates.",
  },
  chargedInTwd: (twd, usd) => `Charged in New Taiwan dollars: NT$${twd} (about US$${usd}). Your bank converts the amount.`,
  emailLabel: "Email",
  emailHint: "Your license key is sent here and shown on the next page.",
  pay: "Continue to payment",
  paying: "Opening payment…",
  terms: "By paying you agree to the SunUI license.",
  secure: "Card payment is handled by SHOPLINE Payments. SunUI never sees your card.",
  errors: {
    email: "Please enter a valid email address.",
    closed: "This plan is not on sale right now.",
    soldOut: "Founding seats are sold out.",
    upstream: "The payment page could not be opened. Please try again in a moment.",
    rate: "Too many attempts. Please try again later.",
  },
  done: {
    title: "You are in",
    pendingTitle: "Confirming your payment",
    pendingBody: "This usually takes a few seconds. Keep this page open.",
    pendingSlow: "Still waiting for the payment confirmation. If you were charged, your key will appear here and in your email shortly.",
    paidBody: "Your SunUI Pro license is ready.",
    keyLabel: "License key",
    copy: "Copy",
    copied: "Copied",
    keyPrivate: "Keep this key private. It is shown on this page only in the browser you paid with.",
    steps: "Set up in three steps",
    step1: "Add the key to .env.local",
    step2: "Add the Pro registry to components.json",
    step3: "Install a Pro block",
    emailNote: (email) => `A copy was sent to ${email}.`,
    otherBrowser: "Payment received. Open this page in the browser you paid with to see the key, or check your email.",
    problemTitle: "This order needs a closer look",
    problemBody: "Your payment did not complete normally. Reply to the receipt email or contact support with your order number.",
    browse: "Browse Pro blocks",
  },
};

const zhTW: Copy = {
  metaTitle: "結帳",
  back: "回到定價",
  planName: { founding: "創始會員", pro: "Pro", team: "Team" },
  planNote: {
    founding: "以創始價取得終身 Pro，名額有限。",
    pro: "一次付清，含全部 Pro 區塊與之後的更新。",
    team: "一次付清，5 人使用，含全部 Pro 區塊與之後的更新。",
  },
  chargedInTwd: (twd) => `以新台幣結帳：NT$${twd}。`,
  emailLabel: "Email",
  emailHint: "授權碼會寄到這裡，下一頁也會直接顯示。",
  pay: "前往付款",
  paying: "開啟付款頁中…",
  terms: "付款即表示同意 SunUI 授權條款。",
  secure: "信用卡付款由 SHOPLINE Payments 處理，SunUI 不會看到你的卡號。",
  errors: {
    email: "請輸入正確的 email。",
    closed: "這個方案目前沒有開放購買。",
    soldOut: "創始會員名額已售完。",
    upstream: "付款頁開不起來，請稍後再試。",
    rate: "嘗試次數太多，請稍後再試。",
  },
  done: {
    title: "購買完成",
    pendingTitle: "正在確認付款",
    pendingBody: "通常只要幾秒，請不要關閉這個頁面。",
    pendingSlow: "還在等付款確認。如果已經扣款，授權碼很快會出現在這裡和你的信箱。",
    paidBody: "你的 SunUI Pro 授權已經可以使用。",
    keyLabel: "授權碼",
    copy: "複製",
    copied: "已複製",
    keyPrivate: "請妥善保管授權碼。這一頁只有在你付款的瀏覽器才看得到授權碼。",
    steps: "三步驟完成設定",
    step1: "把授權碼加到 .env.local",
    step2: "在 components.json 加入 Pro registry",
    step3: "安裝 Pro 區塊",
    emailNote: (email) => `授權碼也已寄到 ${email}。`,
    otherBrowser: "已收到付款。請用付款時的瀏覽器開啟這一頁查看授權碼，或到信箱收信。",
    problemTitle: "這筆訂單需要人工確認",
    problemBody: "付款沒有正常完成。請回覆收據信，或附上訂單編號聯絡我們。",
    browse: "瀏覽 Pro 區塊",
  },
};

const zhCN: Copy = {
  ...zhTW,
  metaTitle: "结账",
  back: "回到定价",
  planName: { founding: "创始会员", pro: "Pro", team: "Team" },
  planNote: {
    founding: "以创始价获得终身 Pro，名额有限。",
    pro: "一次付清，含全部 Pro 区块与之后的更新。",
    team: "一次付清，5 人使用，含全部 Pro 区块与之后的更新。",
  },
  chargedInTwd: (twd, usd) => `以新台币结账：NT$${twd}（约 US$${usd}），由你的银行换算。`,
  emailHint: "授权码会寄到这里，下一页也会直接显示。",
  pay: "前往付款",
  paying: "正在打开付款页…",
  terms: "付款即表示同意 SunUI 授权条款。",
  secure: "信用卡付款由 SHOPLINE Payments 处理，SunUI 不会看到你的卡号。",
  errors: {
    email: "请输入正确的 email。",
    closed: "这个方案目前没有开放购买。",
    soldOut: "创始会员名额已售完。",
    upstream: "付款页打不开，请稍后再试。",
    rate: "尝试次数太多，请稍后再试。",
  },
  done: {
    title: "购买完成",
    pendingTitle: "正在确认付款",
    pendingBody: "通常只要几秒，请不要关闭这个页面。",
    pendingSlow: "还在等付款确认。如果已经扣款，授权码很快会出现在这里和你的邮箱。",
    paidBody: "你的 SunUI Pro 授权已经可以使用。",
    keyLabel: "授权码",
    copy: "复制",
    copied: "已复制",
    keyPrivate: "请妥善保管授权码。这一页只有在你付款的浏览器才看得到授权码。",
    steps: "三步完成设置",
    step1: "把授权码加到 .env.local",
    step2: "在 components.json 加入 Pro registry",
    step3: "安装 Pro 区块",
    emailNote: (email) => `授权码也已寄到 ${email}。`,
    otherBrowser: "已收到付款。请用付款时的浏览器打开这一页查看授权码，或去邮箱收信。",
    problemTitle: "这笔订单需要人工确认",
    problemBody: "付款没有正常完成。请回复收据邮件，或附上订单编号联系我们。",
    browse: "浏览 Pro 区块",
  },
};

const ja: Copy = {
  metaTitle: "お支払い",
  back: "料金ページに戻る",
  planName: { founding: "ファウンディングメンバー", pro: "Pro", team: "Team" },
  planNote: {
    founding: "創設価格で生涯 Pro。席数限定。",
    pro: "買い切り。すべての Pro ブロックと今後のアップデート。",
    team: "5 人分の買い切り。すべての Pro ブロックと今後のアップデート。",
  },
  chargedInTwd: (twd, usd) => `新台湾ドルで決済されます：NT$${twd}（約 US$${usd}）。換算はカード会社が行います。`,
  emailLabel: "メールアドレス",
  emailHint: "ライセンスキーはここに届き、次のページにも表示されます。",
  pay: "支払いへ進む",
  paying: "支払いページを開いています…",
  terms: "お支払いにより SunUI ライセンスに同意したものとみなされます。",
  secure: "カード決済は SHOPLINE Payments が処理します。SunUI がカード番号を見ることはありません。",
  errors: {
    email: "正しいメールアドレスを入力してください。",
    closed: "このプランは現在販売していません。",
    soldOut: "ファウンディングメンバーの席は完売しました。",
    upstream: "支払いページを開けませんでした。しばらくしてからもう一度お試しください。",
    rate: "試行回数が多すぎます。しばらくしてからお試しください。",
  },
  done: {
    title: "購入が完了しました",
    pendingTitle: "お支払いを確認しています",
    pendingBody: "通常は数秒で終わります。このページを開いたままにしてください。",
    pendingSlow: "お支払いの確認を待っています。請求済みの場合、まもなくこことメールにキーが表示されます。",
    paidBody: "SunUI Pro ライセンスの準備ができました。",
    keyLabel: "ライセンスキー",
    copy: "コピー",
    copied: "コピーしました",
    keyPrivate: "キーは他人に教えないでください。このページでは、支払いに使ったブラウザでのみキーが表示されます。",
    steps: "3 ステップで設定",
    step1: ".env.local にキーを追加",
    step2: "components.json に Pro レジストリを追加",
    step3: "Pro ブロックをインストール",
    emailNote: (email) => `${email} にも送信しました。`,
    otherBrowser: "お支払いを受け付けました。キーは支払いに使ったブラウザでこのページを開くか、メールでご確認ください。",
    problemTitle: "この注文は確認が必要です",
    problemBody: "お支払いが正常に完了しませんでした。領収メールに返信するか、注文番号を添えてお問い合わせください。",
    browse: "Pro ブロックを見る",
  },
};

const COPY: Record<Locale, Copy> = { en, "zh-TW": zhTW, "zh-CN": zhCN, ja };

export function checkoutCopy(locale: Locale) {
  return COPY[locale];
}
