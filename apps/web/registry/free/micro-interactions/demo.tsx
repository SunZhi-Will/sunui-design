"use client";

import { useState, type ReactNode } from "react";

import { useDemoText } from "@/lib/demo-locale";

import {
  AnimatedCheckbox,
  ConfettiBurst,
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

const copy = {
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
  },
};

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
    </div>
  );
}
