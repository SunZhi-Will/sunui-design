// 結帳頁與完成頁的文案（四語）。先放在獨立檔案：lib/messages.ts 同時有別的工作在改，之後再併進去。

import type { Locale } from "./i18n";
import type { Plan } from "./site";

type Copy = {
  metaTitle: string;
  back: string;
  planName: Record<Plan, string>;
  planNote: Record<Plan, string>;
  /** 訂閱方案結帳頁：之前訂過（已取消或預付制）的人用同一個 email，授權碼不變 */
  renewHint: string;
  /** 訂閱方案結帳頁的自動續扣揭露：今天付多少、之後每期哪天扣、怎麼取消 */
  autoRenewNote: (price: string, period: "month" | "year", firstRenewal: string) => string;
  /** 定價頁的訂閱區塊 */
  subscribe: {
    title: string;
    lead: string;
    perMonth: string;
    perYear: string;
    monthlyNote: string;
    yearlyNote: string;
    yearlySave: (pct: number) => string;
    features: string[];
    cta: string;
    /** Pro 卡上連到訂閱區的一行 */
    orMonthly: (price: string) => string;
  };
  /** 結帳頁條款連結的文字 */
  termsLink: string;
  /** 幣別選擇：新台幣走 SHOPLINE，美金走 Polar */
  payWith: { label: string; twd: string; twdHint: string; usd: string; usdHint: string };
  /** 選美金時，價格下方的說明 */
  chargedInUsd: string;
  /** 定價頁：兩種幣別都能付時的說明 */
  billedBoth: string;
  /** Pro 買斷在創始會員開賣前：保證可退差價 */
  priceGuard: (date: string, founding: string) => string;
  chargedInTwd: (twd: string, usd: number) => string;
  /** 定價頁方案卡下方：說明以台幣收款、美金只是參考 */
  billedInTwd: string;
  emailLabel: string;
  emailHint: string;
  pay: string;
  paying: string;
  /** 結帳頁「用 Google 繼續」：帶入 Google 驗證過的 email */
  google: {
    button: string;
    pending: string;
    loadError: string;
    failed: string;
    divider: string;
    filled: string;
    change: string;
  };
  terms: string;
  secure: string;
  secureUsd: string;
  errors: { email: string; closed: string; soldOut: string; upstream: string; rate: string; alreadySubscribed: string; card: string };
  /** 新台幣訂閱的內嵌式刷卡頁（SHOPLINE SDK，綁卡並付款） */
  card: {
    metaTitle: string;
    title: string;
    loading: string;
    loadError: string;
    pay: (price: string) => string;
    paying: string;
    secure: string;
  };
  /** /account：用 email 連結管理訂閱 */
  account: {
    metaTitle: string;
    title: string;
    lead: string;
    emailLabel: string;
    send: string;
    sending: string;
    sent: string;
    invalidLink: string;
    noSubscription: string;
    plan: string;
    key: string;
    status: string;
    renews: (date: string, price: string) => string;
    ends: (date: string) => string;
    pastDue: (date: string) => string;
    ended: (date: string) => string;
    prepaid: (date: string) => string;
    cancel: string;
    cancelNote: (date: string) => string;
    canceled: string;
    resume: string;
    resumed: string;
    updateCard: string;
    updateCardLead: string;
    saveCard: string;
    cardSaved: string;
    portal: string;
    portalLead: string;
    failed: string;
    resubscribe: string;
    emailPlaceholder: string;
    sentTitle: string;
    sentNote: string;
    resend: string;
    noPro: string;
    seePlans: string;
    howToUse: string;
    cancelConfirm: string;
    cancelConfirmYes: string;
    keep: string;
    badge: { active: string; canceled: string; pastDue: string; ended: string; prepaid: string; none: string };
    eyebrow: string;
    welcome: string;
    loginEyebrow: string;
    memberSince: string;
    validThrough: string;
    lifetime: string;
    perksTitle: string;
    billingTitle: string;
    lifetimeNote: string;
  };
  done: {
    title: string;
    renewedTitle: string;
    seatsTitle: string;
    seatsBody: string;
    seatLabel: (n: number) => string;
    seatPlaceholder: string;
    renewedBody: (date: string) => string;
    subscriptionUntil: (date: string) => string;
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
  planName: { founding: "Founding member", pro: "Pro", team: "Team", monthly: "Pro monthly", yearly: "Pro yearly" },
  planNote: {
    founding: "Lifetime Pro at the founding price. Limited seats.",
    pro: "One-time payment. All Pro blocks and future updates.",
    team: "One-time payment, 5 license keys (one per developer). All Pro blocks and future updates.",
    monthly: "Pro for 1 developer, billed every month until you cancel.",
    yearly: "Pro for 1 developer, billed every year until you cancel.",
  },
  renewHint: "Subscribed before? Use the same email and you keep the same key. Nothing to change in your project.",
  autoRenewNote: (price, period, date) =>
    `Renews automatically: ${price} today, then ${price} every ${period} starting ${date}, until you cancel. We email you 7 days before each charge. Cancel anytime from your account page; Pro stays active until the end of the period you paid for. No partial refunds.`,
  subscribe: {
    title: "Or subscribe",
    lead: "Pro by the month or the year. It renews automatically, we email you a week before each charge, and you can cancel anytime. The blocks you installed stay yours.",
    perMonth: "/ month",
    perYear: "/ year",
    monthlyNote: "1 developer, billed monthly",
    yearlyNote: "1 developer, billed yearly",
    yearlySave: (pct) => `Save ${pct}% over monthly`,
    features: ["Every Pro block while active", "Renews automatically, cancel anytime", "Installed blocks keep working after you cancel"],
    cta: "Subscribe",
    orMonthly: (price) => `Or subscribe from ${price} / month`,
  },
  termsLink: "Read the license",
  payWith: {
    label: "Pay in",
    twd: "NT$",
    twdHint: "Taiwan cards",
    usd: "US$",
    usdHint: "International cards",
  },
  chargedInUsd: "Charged in US dollars through Polar, our reseller. Sales tax or VAT is added at checkout where your country requires it.",
  billedBoth: "International cards pay in US dollars; Taiwan cards can pay in New Taiwan dollars at checkout.",
  priceGuard: (date, founding) => `Buying before ${date}? If you would rather have the ${founding} founding price, ask for the difference back once founding opens.`,

  chargedInTwd: (twd, usd) => `Charged in New Taiwan dollars: NT$${twd} (about US$${usd}). Your bank converts the amount.`,
  billedInTwd: "Paid in New Taiwan dollars. US$ prices are approximate; your bank converts the amount.",
  emailLabel: "Email",
  emailHint: "Your license key is sent here and shown on the next page.",
  pay: "Continue to payment",
  paying: "Opening payment…",
  google: {
    button: "Continue with Google",
    pending: "Checking your Google account…",
    loadError: "Google sign-in could not load. Type your email below instead.",
    failed: "Could not read your Google email. Type it below instead.",
    divider: "or type your email",
    filled: "Verified by Google",
    change: "Use another email",
  },
  terms: "By paying you agree to the SunUI license.",
  secure: "Card payment is handled by SHOPLINE Payments. SunUI never sees your card.",
  secureUsd: "Payment is handled by Polar, our reseller and merchant of record. SunUI never sees your card.",
  errors: {
    email: "Please enter a valid email address.",
    closed: "This plan is not on sale right now.",
    soldOut: "Founding seats are sold out.",
    upstream: "The payment page could not be opened. Please try again in a moment.",
    rate: "Too many attempts. Please try again later.",
    alreadySubscribed: "This email already has a subscription that renews automatically. Manage it from your account page instead of buying a second one.",
    card: "The card payment did not go through. Check the card details and try again, or use another card.",
  },
  card: {
    metaTitle: "Card payment",
    title: "Pay by card",
    loading: "Loading the secure card form…",
    loadError: "The card form could not load. Refresh the page or try again later.",
    pay: (price) => `Pay ${price} and subscribe`,
    paying: "Processing…",
    secure: "Card details go straight to SHOPLINE Payments and are saved there for renewals. SunUI never sees your card number.",
  },
  account: {
    metaTitle: "Manage subscription",
    title: "Manage your subscription",
    lead: "Enter the email you subscribed with. We will send you a link to see your plan, cancel it, or change your card.",
    emailLabel: "Email",
    send: "Email me a link",
    sending: "Sending…",
    sent: "If that email has a SunUI subscription, a link is on its way. It works for 24 hours.",
    invalidLink: "This link has expired or is not valid. Ask for a new one below.",
    noSubscription: "There is no subscription on this license.",
    plan: "Plan",
    key: "License key",
    status: "Status",
    renews: (date, price) => `Renews automatically on ${date} for ${price}.`,
    ends: (date) => `Canceled. Active until ${date}, nothing more will be charged.`,
    pastDue: (date) => `The last payment failed. Pro keeps working until ${date} while we retry. Update your card to keep it.`,
    ended: (date) => `Ended on ${date}.`,
    prepaid: (date) => `Paid in advance until ${date}. It does not renew by itself.`,
    cancel: "Cancel renewal",
    cancelNote: (date) => `Pro stays active until ${date}. You will not be charged again, and installed blocks keep working.`,
    canceled: "Renewal canceled.",
    resume: "Turn renewal back on",
    resumed: "Renewal is back on.",
    updateCard: "Change card",
    updateCardLead: "Your new card is checked with a NT$1 authorization that is released right away. Future renewals use the new card.",
    saveCard: "Save card",
    cardSaved: "Card saved. It may take a minute to show here.",
    portal: "Open billing portal",
    portalLead: "Change your card or download receipts on Polar, our reseller. Sign in with this email.",
    failed: "That did not work. Please try again, or reply to any SunUI email for help.",
    resubscribe: "Subscribe again",
    emailPlaceholder: "you@example.com",
    sentTitle: "Check your inbox",
    sentNote: "Not there after a few minutes? Check spam, or send it again.",
    resend: "Send again",
    noPro: "No Pro yet?",
    seePlans: "See plans",
    howToUse: "How to use your key",
    cancelConfirm: "Cancel automatic renewal?",
    cancelConfirmYes: "Yes, cancel renewal",
    keep: "Keep it",
    badge: { active: "Active", canceled: "Canceled", pastDue: "Payment failed", ended: "Ended", prepaid: "Prepaid", none: "No subscription" },
    eyebrow: "SunUI Pro member",
    welcome: "Welcome back",
    loginEyebrow: "Members",
    memberSince: "Member since",
    validThrough: "Valid through",
    lifetime: "Lifetime",
    perksTitle: "Included with your plan",
    billingTitle: "Billing and renewal",
    lifetimeNote: "Lifetime license. Nothing to renew, and every future Pro block is included.",
  },
  done: {
    title: "You are in",
    renewedTitle: "Subscription renewed",
    seatsTitle: "5 license keys, one per developer",
    seatsBody: "Give each person their own key. If someone leaves, contact us and we replace just that key.",
    seatLabel: (n) => `Seat ${n}`,
    seatPlaceholder: "<your seat key>",
    renewedBody: (date) => `Your license now runs until ${date}. The key stays the same, so there is nothing to change in your project.`,
    subscriptionUntil: (date) => `Next renewal on ${date}. We email you a week before; cancel anytime from your account page.`,
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
  planName: { founding: "創始會員", pro: "Pro", team: "Team", monthly: "Pro 月訂", yearly: "Pro 年訂" },
  planNote: {
    founding: "以創始價取得終身 Pro，名額有限。",
    pro: "一次付清，含全部 Pro 區塊與之後的更新。",
    team: "一次付清，5 把授權碼，每位開發者一把，含全部 Pro 區塊與之後的更新。",
    monthly: "Pro，1 位開發者，每月自動扣款直到取消。",
    yearly: "Pro，1 位開發者，每年自動扣款直到取消。",
  },
  renewHint: "以前訂閱過嗎？用同一個 email 購買，授權碼不變，專案裡不用改任何設定。",
  autoRenewNote: (price, period, date) =>
    `自動續扣：今天付 ${price}，從 ${date} 起每${period === "year" ? "年" : "月"}扣 ${price}，直到你取消為止。每次扣款前 7 天會寄信通知。隨時可以在帳戶頁取消，取消後用到已付期間結束，不按比例退款。`,
  subscribe: {
    title: "或是用訂閱",
    lead: "按月或按年訂閱 Pro。到期自動續扣，每次扣款前一週寄信通知，隨時可以取消。已經裝進專案的區塊都可以繼續用。",
    perMonth: "/ 月",
    perYear: "/ 年",
    monthlyNote: "1 位開發者，每月自動扣款",
    yearlyNote: "1 位開發者，每年自動扣款",
    yearlySave: (pct) => `比月訂省 ${pct}%`,
    features: ["訂閱期間可用所有 Pro 區塊", "自動續扣，隨時可以取消", "取消後已安裝的區塊照常可用"],
    cta: "訂閱",
    orMonthly: (price) => `或訂閱：${price} / 月起`,
  },
  termsLink: "查看授權條款",
  payWith: {
    label: "付款幣別",
    twd: "新台幣",
    twdHint: "台灣發卡",
    usd: "美金",
    usdHint: "海外發卡",
  },
  chargedInUsd: "以美金結帳，由 Polar 代收。部分國家會依法在結帳時加上當地消費稅。",
  billedBoth: "以新台幣結帳；海外發卡可在結帳頁改用美金付款。",
  priceGuard: (date, founding) => `${date}前購買 Pro，創始會員開賣後可申請退差價（創始價 ${founding}）。`,

  chargedInTwd: (twd) => `以新台幣結帳：NT$${twd}。`,
  billedInTwd: "以新台幣結帳，美金價格僅供參考。",
  emailLabel: "Email",
  emailHint: "授權碼會寄到這裡，下一頁也會直接顯示。",
  pay: "前往付款",
  paying: "開啟付款頁中…",
  google: {
    button: "使用 Google 帳號繼續",
    pending: "確認 Google 帳號中…",
    loadError: "無法載入 Google 登入，請直接在下方輸入 email。",
    failed: "讀不到 Google 帳號的 email，請直接在下方輸入。",
    divider: "或輸入 email",
    filled: "已由 Google 驗證",
    change: "改用其他 email",
  },
  terms: "付款即表示同意 SunUI 授權條款。",
  secure: "信用卡付款由 SHOPLINE Payments 處理，SunUI 不會看到你的卡號。",
  secureUsd: "美金付款由 Polar 處理（代收並開立收據），SunUI 不會看到你的卡號。",
  errors: {
    email: "請輸入正確的 email。",
    closed: "這個方案目前沒有開放購買。",
    soldOut: "創始會員名額已售完。",
    upstream: "付款頁開不起來，請稍後再試。",
    rate: "嘗試次數太多，請稍後再試。",
    alreadySubscribed: "這個 email 已經有自動續扣中的訂閱，不用再買一份，到帳戶頁管理即可。",
    card: "刷卡沒有成功。請確認卡片資料後再試一次，或換一張卡。",
  },
  card: {
    metaTitle: "信用卡付款",
    title: "信用卡付款",
    loading: "正在載入安全刷卡表單…",
    loadError: "刷卡表單載入失敗，請重新整理頁面或稍後再試。",
    pay: (price) => `付款 ${price} 並訂閱`,
    paying: "處理中…",
    secure: "卡片資料直接送到 SHOPLINE Payments，並由它保存供續扣使用。SunUI 不會看到你的卡號。",
  },
  account: {
    metaTitle: "管理訂閱",
    title: "管理你的訂閱",
    lead: "輸入訂閱時用的 email，我們會寄一個連結給你，可以查看方案、取消續扣或更換信用卡。",
    emailLabel: "Email",
    send: "寄連結給我",
    sending: "寄送中…",
    sent: "如果這個 email 有 SunUI 訂閱，連結已經寄出，24 小時內有效。",
    invalidLink: "這個連結已過期或無效，請在下面重新索取。",
    noSubscription: "這把授權沒有訂閱。",
    plan: "方案",
    key: "授權碼",
    status: "狀態",
    renews: (date, price) => `將於 ${date} 自動扣款 ${price}。`,
    ends: (date) => `已取消。可以用到 ${date}，之後不會再扣款。`,
    pastDue: (date) => `上一次扣款失敗。重試期間 Pro 可以用到 ${date}，請更換信用卡以免中斷。`,
    ended: (date) => `已於 ${date} 結束。`,
    prepaid: (date) => `預付到 ${date}，不會自動續扣。`,
    cancel: "取消自動續扣",
    cancelNote: (date) => `Pro 可以用到 ${date}，之後不會再扣款，已安裝的區塊照常可用。`,
    canceled: "已取消自動續扣。",
    resume: "恢復自動續扣",
    resumed: "已恢復自動續扣。",
    updateCard: "更換信用卡",
    updateCardLead: "新卡會先做一筆 NT$1 的授權驗證，隨即取消，不會真的扣款。之後的續扣都用新卡。",
    saveCard: "儲存信用卡",
    cardSaved: "信用卡已儲存，可能要一分鐘才會顯示在這裡。",
    portal: "開啟帳單入口",
    portalLead: "在 Polar（我們的代收商）更換信用卡或下載收據，用這個 email 登入。",
    failed: "操作沒有成功，請再試一次，或回覆任何一封 SunUI 的信尋求協助。",
    resubscribe: "重新訂閱",
    emailPlaceholder: "you@example.com",
    sentTitle: "請到信箱收信",
    sentNote: "幾分鐘後還沒收到？看看垃圾郵件，或再寄一次。",
    resend: "再寄一次",
    noPro: "還沒有 Pro？",
    seePlans: "查看方案",
    howToUse: "怎麼使用授權碼",
    cancelConfirm: "確定要取消自動續扣？",
    cancelConfirmYes: "確定取消",
    keep: "先保留",
    badge: { active: "續訂中", canceled: "已取消續扣", pastDue: "扣款失敗", ended: "已結束", prepaid: "預付", none: "無訂閱" },
    eyebrow: "SunUI Pro 會員",
    welcome: "歡迎回來",
    loginEyebrow: "會員專區",
    memberSince: "會員起始",
    validThrough: "有效期至",
    lifetime: "終身",
    perksTitle: "你的方案包含",
    billingTitle: "帳單與續訂",
    lifetimeNote: "終身授權，不需要續訂，之後所有新的 Pro 區塊都包含在內。",
  },
  done: {
    title: "購買完成",
    renewedTitle: "續訂完成",
    seatsTitle: "5 把授權碼，每位開發者一把",
    seatsBody: "請分給每位成員各自一把。有人離職時聯絡我們，只換掉那一把，其他人不受影響。",
    seatLabel: (n) => `席位 ${n}`,
    seatPlaceholder: "<你的席位授權碼>",
    renewedBody: (date) => `授權已延長到 ${date}。授權碼不變，專案裡不用改任何設定。`,
    subscriptionUntil: (date) => `下次扣款日 ${date}，扣款前一週會寄信通知，隨時可以在帳戶頁取消。`,
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
  planName: { founding: "创始会员", pro: "Pro", team: "Team", monthly: "Pro 月付", yearly: "Pro 年付" },
  planNote: {
    founding: "以创始价获得终身 Pro，名额有限。",
    pro: "一次付清，含全部 Pro 区块与之后的更新。",
    team: "一次付清，5 把授权码，每位开发者一把，含全部 Pro 区块与之后的更新。",
    monthly: "Pro，1 位开发者，每月自动扣费直到取消。",
    yearly: "Pro，1 位开发者，每年自动扣费直到取消。",
  },
  renewHint: "以前订阅过？用同一个 email 购买，授权码不变，项目里不用改任何设置。",
  autoRenewNote: (price, period, date) =>
    `自动续费：今天支付 ${price}，从 ${date} 起每${period === "year" ? "年" : "月"}扣 ${price}，直到你取消为止。每次扣费前 7 天会发邮件通知。随时可以在账户页取消，取消后用到已付期间结束，不按比例退款。`,
  subscribe: {
    title: "或者订阅",
    lead: "按月或按年订阅 Pro。到期自动续费，每次扣费前一周发邮件通知，随时可以取消。已经装进项目的区块都可以继续用。",
    perMonth: "/ 月",
    perYear: "/ 年",
    monthlyNote: "1 位开发者，每月自动扣费",
    yearlyNote: "1 位开发者，每年自动扣费",
    yearlySave: (pct) => `比月付省 ${pct}%`,
    features: ["订阅期间可用所有 Pro 区块", "自动续费，随时可以取消", "取消后已安装的区块照常可用"],
    cta: "订阅",
    orMonthly: (price) => `或订阅：${price} / 月起`,
  },
  termsLink: "查看授权条款",
  payWith: {
    label: "付款币种",
    twd: "新台币",
    twdHint: "台湾发卡",
    usd: "美元",
    usdHint: "海外发卡",
  },
  chargedInUsd: "以美元结账，由 Polar 代收。部分国家会依法在结账时加上当地消费税。",
  billedBoth: "海外发卡以美元结账；台湾发卡可在结账页改用新台币付款。",
  priceGuard: (date, founding) => `${date}前购买 Pro，创始会员开售后可申请退差价（创始价 ${founding}）。`,

  chargedInTwd: (twd, usd) => `以新台币结账：NT$${twd}（约 US$${usd}），由你的银行换算。`,
  billedInTwd: "以新台币结账，美元价格仅供参考，由你的银行换算。",
  emailHint: "授权码会寄到这里，下一页也会直接显示。",
  pay: "前往付款",
  paying: "正在打开付款页…",
  google: {
    button: "使用 Google 账号继续",
    pending: "正在确认 Google 账号…",
    loadError: "无法加载 Google 登录，请直接在下方输入邮箱。",
    failed: "读取不到 Google 账号的邮箱，请直接在下方输入。",
    divider: "或输入邮箱",
    filled: "已由 Google 验证",
    change: "改用其他邮箱",
  },
  terms: "付款即表示同意 SunUI 授权条款。",
  secure: "信用卡付款由 SHOPLINE Payments 处理，SunUI 不会看到你的卡号。",
  secureUsd: "美元付款由 Polar 处理（代收并开具收据），SunUI 不会看到你的卡号。",
  errors: {
    email: "请输入正确的 email。",
    closed: "这个方案目前没有开放购买。",
    soldOut: "创始会员名额已售完。",
    upstream: "付款页打不开，请稍后再试。",
    rate: "尝试次数太多，请稍后再试。",
    alreadySubscribed: "这个 email 已经有自动续费中的订阅，不用再买一份，到账户页管理即可。",
    card: "刷卡没有成功。请确认卡片信息后再试一次，或换一张卡。",
  },
  card: {
    metaTitle: "信用卡支付",
    title: "信用卡支付",
    loading: "正在加载安全刷卡表单…",
    loadError: "刷卡表单加载失败，请刷新页面或稍后再试。",
    pay: (price) => `支付 ${price} 并订阅`,
    paying: "处理中…",
    secure: "卡片信息直接发送到 SHOPLINE Payments，并由它保存用于续费。SunUI 不会看到你的卡号。",
  },
  account: {
    metaTitle: "管理订阅",
    title: "管理你的订阅",
    lead: "输入订阅时使用的 email，我们会发一个链接给你，可以查看方案、取消续费或更换信用卡。",
    emailLabel: "Email",
    send: "把链接发给我",
    sending: "发送中…",
    sent: "如果这个 email 有 SunUI 订阅，链接已经发出，24 小时内有效。",
    invalidLink: "这个链接已过期或无效，请在下面重新获取。",
    noSubscription: "这个授权没有订阅。",
    plan: "方案",
    key: "授权码",
    status: "状态",
    renews: (date, price) => `将于 ${date} 自动扣费 ${price}。`,
    ends: (date) => `已取消。可以用到 ${date}，之后不会再扣费。`,
    pastDue: (date) => `上一次扣费失败。重试期间 Pro 可以用到 ${date}，请更换信用卡以免中断。`,
    ended: (date) => `已于 ${date} 结束。`,
    prepaid: (date) => `预付到 ${date}，不会自动续费。`,
    cancel: "取消自动续费",
    cancelNote: (date) => `Pro 可以用到 ${date}，之后不会再扣费，已安装的区块照常可用。`,
    canceled: "已取消自动续费。",
    resume: "恢复自动续费",
    resumed: "已恢复自动续费。",
    updateCard: "更换信用卡",
    updateCardLead: "新卡会先做一笔 NT$1 的授权验证，随即撤销，不会真的扣费。之后的续费都用新卡。",
    saveCard: "保存信用卡",
    cardSaved: "信用卡已保存，可能要一分钟才会显示在这里。",
    portal: "打开账单入口",
    portalLead: "在 Polar（我们的代收商）更换信用卡或下载收据，用这个 email 登录。",
    failed: "操作没有成功，请再试一次，或回复任何一封 SunUI 的邮件寻求帮助。",
    resubscribe: "重新订阅",
    emailPlaceholder: "you@example.com",
    sentTitle: "请到邮箱查收",
    sentNote: "几分钟后还没收到？看看垃圾邮件，或再发一次。",
    resend: "再发一次",
    noPro: "还没有 Pro？",
    seePlans: "查看方案",
    howToUse: "如何使用授权码",
    cancelConfirm: "确定要取消自动续费？",
    cancelConfirmYes: "确定取消",
    keep: "先保留",
    badge: { active: "续订中", canceled: "已取消续费", pastDue: "扣款失败", ended: "已结束", prepaid: "预付", none: "无订阅" },
    eyebrow: "SunUI Pro 会员",
    welcome: "欢迎回来",
    loginEyebrow: "会员专区",
    memberSince: "会员起始",
    validThrough: "有效期至",
    lifetime: "终身",
    perksTitle: "你的方案包含",
    billingTitle: "账单与续订",
    lifetimeNote: "终身授权，无需续订，以后所有新的 Pro 区块都包含在内。",
  },
  done: {
    title: "购买完成",
    renewedTitle: "续订完成",
    seatsTitle: "5 把授权码，每位开发者一把",
    seatsBody: "请分给每位成员各自一把。有人离职时联系我们，只换掉那一把，其他人不受影响。",
    seatLabel: (n) => `席位 ${n}`,
    seatPlaceholder: "<你的席位授权码>",
    renewedBody: (date) => `授权已延长到 ${date}。授权码不变，项目里不用改任何设置。`,
    subscriptionUntil: (date) => `下次扣费日 ${date}，扣费前一周会发邮件通知，随时可以在账户页取消。`,
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
  planName: { founding: "ファウンディングメンバー", pro: "Pro", team: "Team", monthly: "Pro 月額", yearly: "Pro 年額" },
  planNote: {
    founding: "創設価格で生涯 Pro。席数限定。",
    pro: "買い切り。すべての Pro ブロックと今後のアップデート。",
    team: "買い切り、ライセンスキー 5 本（開発者 1 名につき 1 本）。すべての Pro ブロックと今後のアップデート。",
    monthly: "開発者 1 名の Pro。停止するまで毎月請求します。",
    yearly: "開発者 1 名の Pro。停止するまで毎年請求します。",
  },
  renewHint: "以前登録していましたか？同じメールアドレスで購入すればキーはそのままです。プロジェクト側の変更は不要です。",
  autoRenewNote: (price, period, date) =>
    `自動更新：本日 ${price}、${date} から${period === "year" ? "毎年" : "毎月"} ${price} を、停止するまで請求します。各請求の 7 日前にメールでお知らせします。アカウントページからいつでも停止でき、停止後も支払い済みの期間の終わりまで使えます。日割りの返金はありません。`,
  subscribe: {
    title: "期間プランもあります",
    lead: "Pro を月額または年額で。自動更新で、各請求の 1 週間前にメールでお知らせし、いつでも停止できます。インストール済みのブロックはそのまま使えます。",
    perMonth: "/ 月",
    perYear: "/ 年",
    monthlyNote: "開発者 1 名、毎月自動更新",
    yearlyNote: "開発者 1 名、毎年自動更新",
    yearlySave: (pct) => `月額より ${pct}% お得`,
    features: ["期間中はすべての Pro ブロック", "自動更新、いつでも停止できる", "停止後もインストール済みのブロックは使える"],
    cta: "申し込む",
    orMonthly: (price) => `月額 ${price} からのプランもあります`,
  },
  termsLink: "ライセンスを読む",
  payWith: {
    label: "支払い通貨",
    twd: "新台湾ドル",
    twdHint: "台湾発行のカード",
    usd: "米ドル",
    usdHint: "海外発行のカード",
  },
  chargedInUsd: "米ドルで決済され、販売代理の Polar が受け付けます。国によっては決済時に消費税や VAT が加算されます。",
  billedBoth: "海外発行のカードは米ドルで決済されます。台湾発行のカードは決済ページで新台湾ドルを選べます。",
  priceGuard: (date, founding) => `${date}より前に Pro を購入した方は、創設メンバーの販売開始後に差額の返金を申請できます（創設価格 ${founding}）。`,

  chargedInTwd: (twd, usd) => `新台湾ドルで決済されます：NT$${twd}（約 US$${usd}）。換算はカード会社が行います。`,
  billedInTwd: "お支払いは新台湾ドルです。米ドル表示は目安で、換算はカード会社が行います。",
  emailLabel: "メールアドレス",
  emailHint: "ライセンスキーはここに届き、次のページにも表示されます。",
  pay: "支払いへ進む",
  paying: "支払いページを開いています…",
  google: {
    button: "Google で続ける",
    pending: "Google アカウントを確認しています…",
    loadError: "Google ログインを読み込めませんでした。下にメールアドレスを入力してください。",
    failed: "Google アカウントのメールアドレスを取得できませんでした。下に入力してください。",
    divider: "またはメールアドレスを入力",
    filled: "Google で確認済み",
    change: "別のメールアドレスにする",
  },
  terms: "お支払いにより SunUI ライセンスに同意したものとみなされます。",
  secure: "カード決済は SHOPLINE Payments が処理します。SunUI がカード番号を見ることはありません。",
  secureUsd: "米ドルの決済は販売代理の Polar が処理し、領収書も発行します。SunUI がカード番号を見ることはありません。",
  errors: {
    email: "正しいメールアドレスを入力してください。",
    closed: "このプランは現在販売していません。",
    soldOut: "ファウンディングメンバーの席は完売しました。",
    upstream: "支払いページを開けませんでした。しばらくしてからもう一度お試しください。",
    rate: "試行回数が多すぎます。しばらくしてからお試しください。",
    alreadySubscribed: "このメールアドレスにはすでに自動更新中のサブスクリプションがあります。2 つ目を購入せず、アカウントページから管理してください。",
    card: "カード決済が完了しませんでした。カード情報を確認してもう一度お試しいただくか、別のカードをご利用ください。",
  },
  card: {
    metaTitle: "カード決済",
    title: "カードで支払う",
    loading: "安全なカード入力フォームを読み込んでいます…",
    loadError: "カード入力フォームを読み込めませんでした。ページを再読み込みするか、しばらくしてからお試しください。",
    pay: (price) => `${price} を支払って登録`,
    paying: "処理中…",
    secure: "カード情報は SHOPLINE Payments に直接送られ、更新時の決済用に保管されます。SunUI がカード番号を見ることはありません。",
  },
  account: {
    metaTitle: "サブスクリプションの管理",
    title: "サブスクリプションの管理",
    lead: "登録したメールアドレスを入力してください。プランの確認、自動更新の停止、カードの変更ができるリンクをお送りします。",
    emailLabel: "メールアドレス",
    send: "リンクを送る",
    sending: "送信中…",
    sent: "このメールアドレスに SunUI のサブスクリプションがあれば、リンクを送信しました。有効期限は 24 時間です。",
    invalidLink: "このリンクは期限切れか無効です。下から新しいリンクをリクエストしてください。",
    noSubscription: "このライセンスにはサブスクリプションがありません。",
    plan: "プラン",
    key: "ライセンスキー",
    status: "状態",
    renews: (date, price) => `${date} に ${price} で自動更新されます。`,
    ends: (date) => `停止済みです。${date} まで使え、以降の請求はありません。`,
    pastDue: (date) => `前回の決済に失敗しました。再試行の間、Pro は ${date} まで使えます。中断を避けるためカードを変更してください。`,
    ended: (date) => `${date} に終了しました。`,
    prepaid: (date) => `${date} まで前払い済みです。自動更新はありません。`,
    cancel: "自動更新を停止",
    cancelNote: (date) => `Pro は ${date} まで使えます。以降の請求はなく、インストール済みのブロックはそのまま使えます。`,
    canceled: "自動更新を停止しました。",
    resume: "自動更新を再開",
    resumed: "自動更新を再開しました。",
    updateCard: "カードを変更",
    updateCardLead: "新しいカードは NT$1 のオーソリで確認し、すぐに取り消します。以降の更新は新しいカードで決済されます。",
    saveCard: "カードを保存",
    cardSaved: "カードを保存しました。ここに表示されるまで 1 分ほどかかることがあります。",
    portal: "請求ポータルを開く",
    portalLead: "販売代理の Polar でカードの変更や領収書のダウンロードができます。このメールアドレスでログインしてください。",
    failed: "うまくいきませんでした。もう一度お試しいただくか、SunUI からのメールに返信してお問い合わせください。",
    resubscribe: "もう一度登録",
    emailPlaceholder: "you@example.com",
    sentTitle: "メールを確認してください",
    sentNote: "数分たっても届かない場合は、迷惑メールを確認するか、もう一度送信してください。",
    resend: "もう一度送る",
    noPro: "まだ Pro をお持ちでない方",
    seePlans: "プランを見る",
    howToUse: "ライセンスキーの使い方",
    cancelConfirm: "自動更新を停止しますか？",
    cancelConfirmYes: "停止する",
    keep: "続ける",
    badge: { active: "有効", canceled: "更新停止済み", pastDue: "支払い失敗", ended: "終了", prepaid: "前払い", none: "サブスクなし" },
    eyebrow: "SunUI Pro メンバー",
    welcome: "おかえりなさい",
    loginEyebrow: "メンバー",
    memberSince: "メンバー登録日",
    validThrough: "有効期限",
    lifetime: "生涯",
    perksTitle: "プランに含まれるもの",
    billingTitle: "請求と更新",
    lifetimeNote: "生涯ライセンスです。更新は不要で、今後の Pro ブロックもすべて含まれます。",
  },
  done: {
    title: "購入が完了しました",
    renewedTitle: "更新が完了しました",
    seatsTitle: "ライセンスキー 5 本、開発者 1 名につき 1 本",
    seatsBody: "メンバーごとに 1 本ずつ渡してください。退職者が出たらご連絡ください。その 1 本だけを差し替え、他の人には影響しません。",
    seatLabel: (n) => `シート ${n}`,
    seatPlaceholder: "<あなたのシートのキー>",
    renewedBody: (date) => `ライセンスは ${date} まで延長されました。キーは変わらないので、プロジェクト側の変更は不要です。`,
    subscriptionUntil: (date) => `次回の更新日は ${date} です。1 週間前にメールでお知らせし、アカウントページからいつでも停止できます。`,
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
