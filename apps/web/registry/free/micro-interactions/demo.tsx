"use client";

import { useState, type ReactNode } from "react";

import { useDemoText } from "@/lib/demo-locale";

import {
  AnimatedCheckbox,
  ClearInput,
  ConfettiBurst,
  CropFrame,
  FaceScan,
  FocusLock,
  FolderDrop,
  ListToGrid,
  MuteSwitch,
  PermissionGate,
  PinToggle,
  QuickReply,
  RadioSelect,
  ReactionTray,
  ResizeFrame,
  SortHandle,
  CopyFeedback,
  FloatingLabelInput,
  HoldToConfirm,
  LikeBurst,
  NotificationBadge,
  PasswordToggle,
  SendPlaneButton,
  SlideToConfirm,
  SuccessCheck,
  SwipeToDelete,
  ToggleSwitch,
  type MicroInteractionId,
} from "./micro-interactions";

export const copy = {
  en: {
    replay: "Replay",
    like: "Like",
    celebrate: "Celebrate",
    paid: "Payment complete",
    task: "Pack the travel case",
    switchLabel: "Order updates",
    copy: "Copy",
    copied: "Copied",
    notifications: "Notifications",
    addOne: "Add a notification",
    clear: "Clear",
    email: "Email address",
    slide: "Slide to pay",
    confirmed: "Paid",
    hold: "Hold to delete",
    deleted: "Deleted",
    rows: ["Order #1042 shipped", "Coupon expires Friday", "New review on your item"],
    delete: "Delete",
    restore: "Restore rows",
    send: "Send",
    sent: "Sent",
    password: "Password",
    show: "Show password",
    hide: "Hide password",
    fieldName: "Name",
    fieldValue: "Alex",
    clearField: "Clear name",
    digest: "Order digest",
    daily: "Daily",
    weekly: "Weekly",
    saveFolder: "Save to folder",
    savedFolder: "Saved to Receipts",
    replies: ["On my way", "Thanks!", "Call you later"],
    replyPlaceholder: "Reply…",
    mute: "Mute microphone",
    react: "React",
    reactions: ["Love", "Like", "Smile", "Brilliant"],
    lock: "Lock",
    unlock: "Unlock",
    pin: "Pin to top",
    layoutItems: ["Inbox", "Drafts", "Sent", "Archive"],
    list: "List",
    grid: "Grid",
    layout: "Layout",
    allow: "Allow camera",
    allowed: "Camera allowed",
    scanFace: "Scan face",
    scanning: "Scanning",
    verified: "Verified",
    ratio: "Aspect ratio",
    ratioFree: "Free",
    sortItems: ["Shipping address", "Payment", "Review order"],
    move: "Move",
    resize: "Resize",
  },
  "zh-TW": {
    replay: "重播",
    like: "喜歡",
    celebrate: "慶祝一下",
    paid: "付款完成",
    task: "把旅行收納盒裝好",
    switchLabel: "訂單通知",
    copy: "複製",
    copied: "已複製",
    notifications: "通知",
    addOne: "新增一則通知",
    clear: "清除",
    email: "電子郵件",
    slide: "滑動以付款",
    confirmed: "已付款",
    hold: "按住以刪除",
    deleted: "已刪除",
    rows: ["訂單 #1042 已出貨", "優惠券週五到期", "你的商品有新評價"],
    delete: "刪除",
    restore: "還原列表",
    send: "送出",
    sent: "已送出",
    password: "密碼",
    show: "顯示密碼",
    hide: "隱藏密碼",
    fieldName: "名字",
    fieldValue: "小安",
    clearField: "清除名字",
    digest: "訂單摘要",
    daily: "每天",
    weekly: "每週",
    saveFolder: "存到資料夾",
    savedFolder: "已存到收據",
    replies: ["在路上了", "謝謝！", "晚點打給你"],
    replyPlaceholder: "回覆…",
    mute: "麥克風靜音",
    react: "回應",
    reactions: ["愛心", "讚", "微笑", "太棒了"],
    lock: "鎖定",
    unlock: "解鎖",
    pin: "置頂",
    layoutItems: ["收件匣", "草稿", "已寄出", "封存"],
    list: "清單",
    grid: "格狀",
    layout: "版面",
    allow: "允許相機",
    allowed: "已允許相機",
    scanFace: "掃描臉部",
    scanning: "掃描中",
    verified: "已驗證",
    ratio: "比例",
    ratioFree: "自由",
    sortItems: ["收件地址", "付款方式", "確認訂單"],
    move: "移動",
    resize: "調整大小",
  },
  "zh-CN": {
    replay: "重播",
    like: "喜欢",
    celebrate: "庆祝一下",
    paid: "付款完成",
    task: "把旅行收纳盒装好",
    switchLabel: "订单通知",
    copy: "复制",
    copied: "已复制",
    notifications: "通知",
    addOne: "新增一条通知",
    clear: "清除",
    email: "电子邮箱",
    slide: "滑动以付款",
    confirmed: "已付款",
    hold: "按住以删除",
    deleted: "已删除",
    rows: ["订单 #1042 已发货", "优惠券周五到期", "你的商品有新评价"],
    delete: "删除",
    restore: "恢复列表",
    send: "发送",
    sent: "已发送",
    password: "密码",
    show: "显示密码",
    hide: "隐藏密码",
    fieldName: "名字",
    fieldValue: "小安",
    clearField: "清除名字",
    digest: "订单摘要",
    daily: "每天",
    weekly: "每周",
    saveFolder: "存到文件夹",
    savedFolder: "已存到收据",
    replies: ["在路上了", "谢谢！", "晚点打给你"],
    replyPlaceholder: "回复…",
    mute: "麦克风静音",
    react: "回应",
    reactions: ["爱心", "赞", "微笑", "太棒了"],
    lock: "锁定",
    unlock: "解锁",
    pin: "置顶",
    layoutItems: ["收件箱", "草稿", "已发送", "归档"],
    list: "列表",
    grid: "网格",
    layout: "布局",
    allow: "允许相机",
    allowed: "已允许相机",
    scanFace: "扫描面部",
    scanning: "扫描中",
    verified: "已验证",
    ratio: "比例",
    ratioFree: "自由",
    sortItems: ["收货地址", "付款方式", "确认订单"],
    move: "移动",
    resize: "调整大小",
  },
  ja: {
    replay: "再生",
    like: "いいね",
    celebrate: "お祝いする",
    paid: "お支払いが完了しました",
    task: "トラベルケースを詰める",
    switchLabel: "注文の通知",
    copy: "コピー",
    copied: "コピーしました",
    notifications: "通知",
    addOne: "通知を追加",
    clear: "クリア",
    email: "メールアドレス",
    slide: "スライドして支払う",
    confirmed: "支払い済み",
    hold: "長押しで削除",
    deleted: "削除しました",
    rows: ["注文 #1042 を発送しました", "クーポンは金曜日まで", "商品に新しいレビュー"],
    delete: "削除",
    restore: "リストを戻す",
    send: "送信",
    sent: "送信済み",
    password: "パスワード",
    show: "パスワードを表示",
    hide: "パスワードを隠す",
    fieldName: "名前",
    fieldValue: "アレックス",
    clearField: "名前をクリア",
    digest: "注文のまとめ",
    daily: "毎日",
    weekly: "毎週",
    saveFolder: "フォルダに保存",
    savedFolder: "領収書に保存しました",
    replies: ["向かってます", "ありがとう！", "あとで電話します"],
    replyPlaceholder: "返信…",
    mute: "マイクをミュート",
    react: "リアクション",
    reactions: ["ラブ", "いいね", "スマイル", "すごい"],
    lock: "ロック",
    unlock: "ロック解除",
    pin: "ピン留め",
    layoutItems: ["受信箱", "下書き", "送信済み", "アーカイブ"],
    list: "リスト",
    grid: "グリッド",
    layout: "レイアウト",
    allow: "カメラを許可",
    allowed: "カメラを許可しました",
    scanFace: "顔をスキャン",
    scanning: "スキャン中",
    verified: "確認しました",
    ratio: "縦横比",
    ratioFree: "フリー",
    sortItems: ["お届け先", "お支払い", "注文の確認"],
    move: "移動",
    resize: "サイズ変更",
  },
};

/** The everyday moments added 2026-11-26, shared by the demo grid and the catalog cards */
export const moments = [
  "clear-input",
  "radio-select",
  "folder-drop",
  "quick-reply",
  "mute-switch",
  "reaction-tray",
  "focus-lock",
  "pin-toggle",
  "list-to-grid",
  "permission-gate",
  "face-scan",
  "crop-frame",
  "sort-handle",
  "resize-frame",
] as const satisfies readonly MicroInteractionId[];

export type MomentId = (typeof moments)[number];

export function Moment({ id, t }: { id: MomentId; t: (typeof copy)["en"] }): ReactNode {
  switch (id) {
    case "clear-input":
      return <ClearInput label={t.fieldName} defaultValue={t.fieldValue} clearLabel={t.clearField} />;
    case "radio-select":
      return <RadioSelect label={t.digest} defaultValue="weekly" options={[{ value: "daily", label: t.daily }, { value: "weekly", label: t.weekly }]} />;
    case "folder-drop":
      return <FolderDrop label={t.saveFolder} doneLabel={t.savedFolder} />;
    case "quick-reply":
      return <QuickReply suggestions={t.replies} placeholder={t.replyPlaceholder} sendLabel={t.send} />;
    case "mute-switch":
      return <MuteSwitch label={t.mute} />;
    case "reaction-tray":
      return (
        <ReactionTray
          label={t.react}
          reactions={(["heart", "like", "smile", "spark"] as const).map((r, i) => ({ id: r, label: t.reactions[i] }))}
        />
      );
    case "focus-lock":
      return <FocusLock lockLabel={t.lock} unlockLabel={t.unlock} />;
    case "pin-toggle":
      return <PinToggle label={t.pin} />;
    case "list-to-grid":
      return <ListToGrid items={t.layoutItems} listLabel={t.list} gridLabel={t.grid} label={t.layout} />;
    case "permission-gate":
      return <PermissionGate label={t.allow} grantedLabel={t.allowed} />;
    case "face-scan":
      return <FaceScan label={t.scanFace} scanningLabel={t.scanning} doneLabel={t.verified} />;
    case "crop-frame":
      return <CropFrame label={t.ratio} ratios={[{ label: t.ratioFree, value: null }, { label: "1:1", value: 1 }, { label: "4:5", value: 4 / 5 }, { label: "16:9", value: 16 / 9 }]} />;
    case "sort-handle":
      return <SortHandle items={t.sortItems} moveLabel={t.move} />;
    case "resize-frame":
      return <ResizeFrame label={t.resize} />;
  }
}

function Tile({ name, children, onReplay, replayLabel }: { name: MicroInteractionId; children: ReactNode; onReplay?: () => void; replayLabel: string }) {
  return (
    <div className="relative flex flex-col rounded-md border border-border bg-card text-card-foreground">
      {onReplay && (
        <button
          type="button"
          onClick={onReplay}
          aria-label={`${replayLabel}: ${name}`}
          className="absolute right-2 top-2 z-10 grid size-7 place-items-center rounded-md border border-border bg-background text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2.5 8a5.5 5.5 0 1 0 1.6-3.9M2.5 2.5v2.6h2.6" />
          </svg>
        </button>
      )}
      <div className="flex min-h-44 flex-1 items-center justify-center px-5 py-8">{children}</div>
      <p className="border-t border-border px-3 py-2 font-mono text-xs text-muted-foreground">{name}</p>
    </div>
  );
}

export default function MicroInteractionsDemo() {
  const t = useDemoText(copy);
  const [checkRun, setCheckRun] = useState(0);
  const [count, setCount] = useState(2);
  const [rows, setRows] = useState<number[]>([0, 1, 2]);

  return (
    <div className="grid w-full max-w-5xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Tile name="like-burst" replayLabel={t.replay}>
        <LikeBurst label={t.like} />
      </Tile>

      <Tile name="confetti" replayLabel={t.replay}>
        <ConfettiBurst>{t.celebrate}</ConfettiBurst>
      </Tile>

      <Tile name="success-check" replayLabel={t.replay} onReplay={() => setCheckRun((n) => n + 1)}>
        <SuccessCheck key={checkRun} message={t.paid} />
      </Tile>

      <Tile name="checkbox-draw" replayLabel={t.replay}>
        <AnimatedCheckbox label={t.task} />
      </Tile>

      <Tile name="toggle-switch" replayLabel={t.replay}>
        <ToggleSwitch label={t.switchLabel} defaultChecked />
      </Tile>

      <Tile name="copy-feedback" replayLabel={t.replay}>
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-1.5 font-mono text-xs">
          <span className="truncate">SUN-2026-OFF</span>
          <CopyFeedback text="SUN-2026-OFF" label={t.copy} copiedLabel={t.copied} />
        </div>
      </Tile>

      <Tile name="notification-badge" replayLabel={t.replay}>
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label={t.addOne}
            onClick={() => setCount((c) => c + 1)}
            className="grid size-11 place-items-center rounded-md border border-border bg-background focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <NotificationBadge count={count} label={t.notifications}>
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16ZM10 20.5a2 2 0 0 0 4 0" />
              </svg>
            </NotificationBadge>
          </button>
          <button type="button" onClick={() => setCount(0)} className="text-xs text-muted-foreground underline-offset-2 hover:underline">
            {t.clear}
          </button>
        </div>
      </Tile>

      <Tile name="floating-label" replayLabel={t.replay}>
        <FloatingLabelInput label={t.email} type="email" autoComplete="email" className="max-w-60" />
      </Tile>

      <Tile name="slide-to-confirm" replayLabel={t.replay}>
        <SlideToConfirm label={t.slide} confirmedLabel={t.confirmed} resetAfter={2200} />
      </Tile>

      <Tile name="hold-to-confirm" replayLabel={t.replay}>
        <HoldToConfirm label={t.hold} doneLabel={t.deleted} />
      </Tile>

      <Tile name="swipe-to-delete" replayLabel={t.replay}>
        <div className="w-full">
          <div className="divide-y divide-border overflow-hidden rounded-md border border-border">
            {rows.map((i) => (
              <SwipeToDelete key={i} deleteLabel={t.delete} onDelete={() => setRows((xs) => xs.filter((x) => x !== i))}>
                {t.rows[i]}
              </SwipeToDelete>
            ))}
          </div>
          {rows.length < 3 && (
            <button type="button" onClick={() => setRows([0, 1, 2])} className="mt-2 text-xs text-muted-foreground underline-offset-2 hover:underline">
              {t.restore}
            </button>
          )}
        </div>
      </Tile>

      <Tile name="send-plane" replayLabel={t.replay}>
        <SendPlaneButton label={t.send} sentLabel={t.sent} />
      </Tile>

      <Tile name="password-reveal" replayLabel={t.replay}>
        <PasswordToggle label={t.password} showLabel={t.show} hideLabel={t.hide} defaultValue="sunui-demo" className="max-w-60" />
      </Tile>

      {moments.map((id) => (
        <Tile key={id} name={id} replayLabel={t.replay}>
          <Moment id={id} t={t} />
        </Tile>
      ))}
    </div>
  );
}
