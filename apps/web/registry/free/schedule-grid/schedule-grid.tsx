"use client";

import { useRef, useState, useSyncExternalStore, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

// 原專案（Schedary）的狀態色與品牌色，淺色與深色各一組，可用 CSS 變數覆寫
const TOKENS =
  "[--sg-brand:#4F46E5] [--sg-brand-fg:#FFFFFF] [--sg-warning:#B45309] dark:[--sg-brand:#818CF8] dark:[--sg-brand-fg:#09090B] dark:[--sg-warning:#FBBF24]";

export interface ScheduleShift {
  id: number | string;
  name: string;
  startTime: string;
  endTime: string;
  /** 班別識別色，只用在名稱前的細線 */
  color?: string;
  /** 預設需要人數，沒有傳 required 時使用 */
  requiredEmployees?: number;
}

export interface ScheduleAssignment {
  id: number | string;
  /** "YYYY-MM-DD" */
  date: string;
  shiftId: number | string;
  employeeId: number;
  employeeName: string;
  locked?: boolean;
  /** 異動過的班次 */
  changed?: boolean;
}

export interface ScheduleGridLabels {
  /** 以星期日為首的 7 個星期標籤 */
  weekdays: string[];
  shiftColumn: string;
  week: (n: number) => string;
  shortage: (n: number) => string;
  shortageAction: (dateLabel: string, shiftName: string, n: number) => string;
  locked: string;
  pickDate: string;
  today: string;
  noOne: string;
  headcount: (assigned: number, required: number) => string;
  dayTitle: (month: number, day: number, weekday: string) => string;
  dayTabLabel: (month: number, day: number, weekday: string, isToday: boolean) => string;
}

const defaultLabels: ScheduleGridLabels = {
  weekdays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  shiftColumn: "Shift",
  week: (n) => `Week ${n}`,
  shortage: (n) => `${n} short`,
  shortageAction: (d, s, n) => `${d} ${s} is ${n} short, fill`,
  locked: "Locked",
  pickDate: "Pick a date",
  today: "Today",
  noOne: "No one scheduled",
  headcount: (a, r) => `${a}/${r}`,
  dayTitle: (m, d, w) => `${m}/${d} ${w}`,
  dayTabLabel: (m, d, w, t) => `${w} ${m}/${d}${t ? " (today)" : ""}`,
};

export interface ScheduleGridProps {
  /** "YYYY-MM-DD"，每 7 天拆成一張週表 */
  dates: string[];
  shifts: ScheduleShift[];
  assignments: ScheduleAssignment[];
  onSelectAssignment?: (assignment: ScheduleAssignment) => void;
  /** 以琥珀色外框標示異動的班次 */
  highlightChanged?: boolean;
  /** 員工檢視：自己的班次強調、其他人淡化 */
  ownEmployeeId?: number | null;
  /** 側邊面板正在解釋的班次 */
  selectedAssignmentId?: number | string | null;
  /** 每天每班需要的人數，沒有傳入時用班別預設人數 */
  required?: { date: string; shiftId: number | string; required: number }[];
  /** 點「缺 N 人」補人，沒有傳入時缺額只顯示不可點 */
  onFillShortage?: (date: string, shift: ScheduleShift) => void;
  /** auto：小於 768px 改用單日檢視 */
  layout?: "auto" | "week" | "day";
  /** 覆寫今天（"YYYY-MM-DD"），預設取本地日期 */
  today?: string;
  /** 品牌色，用於今天的標示 */
  accent?: string;
  labels?: Partial<ScheduleGridLabels>;
  className?: string;
}

function parseDate(value: string) {
  const [y, m, d] = value.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

function toDateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function isWeekend(date: string) {
  const day = parseDate(date).getDay();
  return day === 0 || day === 6;
}

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === "undefined" || !window.matchMedia) return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => (typeof window !== "undefined" && !!window.matchMedia ? window.matchMedia(query).matches : false),
    () => false,
  );
}

// 固定的員工識別色盤，只用在標籤前的小圓點，用 id 取餘數決定顏色
const PALETTE = ["#2563EB", "#16A34A", "#D97706", "#DB2777", "#7C3AED", "#0891B2", "#E11D48", "#65A30D"];

function employeeColor(employeeId: number) {
  return PALETTE[((employeeId % PALETTE.length) + PALETTE.length) % PALETTE.length];
}

function LockIcon({ label }: { label: string }) {
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3 shrink-0 opacity-70"
    >
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

interface ChipProps {
  name: string;
  employeeId: number;
  highlighted?: boolean;
  emphasized?: boolean;
  locked?: boolean;
  selected?: boolean;
  muted?: boolean;
  onClick?: () => void;
  size?: "default" | "lg";
  lockedLabel: string;
}

function EmployeeChip({ name, employeeId, highlighted, emphasized, locked, selected, muted, onClick, size = "default", lockedLabel }: ChipProps) {
  const Comp = onClick ? "button" : "span";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      aria-pressed={onClick ? Boolean(selected) : undefined}
      onClick={onClick}
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-md border font-medium whitespace-nowrap",
        size === "lg" ? "h-8 px-2.5 text-sm" : "h-6 px-2 text-xs",
        emphasized ? "border-foreground bg-foreground text-background" : "border-border bg-card text-foreground",
        muted && "text-muted-foreground opacity-60",
        highlighted && "border-(--sg-warning)/60 ring-1 ring-(--sg-warning)",
        selected && "ring-2 ring-foreground ring-offset-1 ring-offset-card",
        onClick && "cursor-pointer transition-colors hover:border-foreground/30 hover:bg-muted motion-reduce:transition-none",
        onClick && emphasized && "hover:bg-foreground/90",
      )}
    >
      <span
        aria-hidden
        className="size-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: emphasized ? "currentColor" : employeeColor(employeeId) }}
      />
      {locked ? <LockIcon label={lockedLabel} /> : null}
      {name}
    </Comp>
  );
}

/** 缺額標示：管理者可以點它補人 */
function ShortageBadge({ text, size, onClick, label }: { text: string; size: "sm" | "lg"; onClick?: () => void; label: string }) {
  const className = cn(
    "inline-flex items-center rounded-md border border-dashed border-(--sg-warning)/50 text-xs text-(--sg-warning)",
    size === "sm" ? "h-6 px-2" : "h-8 px-2.5",
    onClick && "transition-colors hover:bg-(--sg-warning)/10",
  );
  if (!onClick) return <span className={className}>{text}</span>;
  return (
    <button type="button" className={className} onClick={onClick} aria-label={label}>
      {text}
    </button>
  );
}

/**
 * 週班表格線：每列一個班別、每欄一天，14 天拆成兩張堆疊的週表。
 * 窄螢幕改成上方日期列加當天班別清單，可左右滑動換日。
 */
export function ScheduleGrid({
  dates,
  shifts,
  assignments,
  onSelectAssignment,
  highlightChanged = true,
  ownEmployeeId = null,
  selectedAssignmentId = null,
  required,
  onFillShortage,
  layout = "auto",
  today: todayProp,
  accent,
  labels: labelsProp,
  className,
}: ScheduleGridProps) {
  const labels = { ...defaultLabels, ...labelsProp };
  const requiredByCell = required ? new Map(required.map((r) => [`${r.date}__${r.shiftId}`, r.required])) : null;
  const requiredFor = (date: string, shift: ScheduleShift) =>
    requiredByCell ? (requiredByCell.get(`${date}__${shift.id}`) ?? 0) : (shift.requiredEmployees ?? 0);

  const weeks: string[][] = [];
  for (let i = 0; i < dates.length; i += 7) weeks.push(dates.slice(i, i + 7));

  const byCell = new Map<string, ScheduleAssignment[]>();
  for (const a of assignments) {
    const key = `${a.date}__${a.shiftId}`;
    const list = byCell.get(key) ?? [];
    list.push(a);
    byCell.set(key, list);
  }

  const today = todayProp ?? toDateString(new Date());
  const isNarrow = useMediaQuery("(max-width: 767px)");
  const isMobile = layout === "day" || (layout === "auto" && isNarrow);
  const weekday = (date: string) => labels.weekdays[parseDate(date).getDay()] ?? "";
  const dateLabel = (date: string) => {
    const d = parseDate(date);
    return `${d.getMonth() + 1}/${d.getDate()} (${weekday(date)})`;
  };
  const style = accent ? ({ "--sg-brand": accent } as CSSProperties) : undefined;

  const chipFor = (a: ScheduleAssignment, size: "default" | "lg") => {
    const isOwn = ownEmployeeId != null && a.employeeId === ownEmployeeId;
    return (
      <EmployeeChip
        key={a.id}
        size={size}
        name={a.employeeName}
        employeeId={a.employeeId}
        locked={a.locked}
        highlighted={highlightChanged && a.changed}
        selected={a.id === selectedAssignmentId}
        emphasized={isOwn}
        muted={ownEmployeeId != null && !isOwn}
        lockedLabel={labels.locked}
        onClick={onSelectAssignment ? () => onSelectAssignment(a) : undefined}
      />
    );
  };

  if (isMobile) {
    return (
      <MobileDayView
        className={className}
        style={style}
        dates={dates}
        shifts={shifts}
        byCell={byCell}
        today={today}
        ownEmployeeId={ownEmployeeId}
        requiredFor={requiredFor}
        onFillShortage={onFillShortage}
        labels={labels}
        weekday={weekday}
        dateLabel={dateLabel}
        chipFor={chipFor}
      />
    );
  }

  return (
    <div className={cn(TOKENS, "flex flex-col gap-6", className)} style={style}>
      {weeks.map((weekDates, weekIndex) => (
        <section key={weekDates[0] ?? weekIndex} className="overflow-hidden rounded-xl border border-border bg-card">
          {weeks.length > 1 ? (
            <div className="border-b border-border px-4 py-2.5 text-xs font-medium text-muted-foreground">{labels.week(weekIndex + 1)}</div>
          ) : null}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] table-fixed border-collapse text-sm">
              <colgroup>
                <col className="w-32" />
                {weekDates.map((date) => (
                  <col key={date} />
                ))}
              </colgroup>
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="sticky left-0 z-10 bg-card px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    {labels.shiftColumn}
                  </th>
                  {weekDates.map((date) => {
                    const isToday = date === today;
                    const d = parseDate(date);
                    return (
                      <th
                        key={date}
                        scope="col"
                        aria-current={isToday ? "date" : undefined}
                        className={cn("px-2 py-3 text-center font-normal", isToday && "bg-(--sg-brand)/[0.04]")}
                      >
                        <span className={cn("block text-xs", isWeekend(date) ? "text-muted-foreground/70" : "text-muted-foreground")}>
                          {weekday(date)}
                        </span>
                        <span
                          className={cn(
                            "mt-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-sm font-medium tabular-nums",
                            isToday ? "bg-(--sg-brand) text-(--sg-brand-fg)" : "text-foreground",
                          )}
                        >
                          {`${d.getMonth() + 1}/${d.getDate()}`}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {shifts.map((shift) => (
                  <tr key={shift.id} className="border-b border-border last:border-b-0">
                    <th scope="row" className="sticky left-0 z-10 bg-card px-4 py-3 text-left align-top font-normal">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <span
                          aria-hidden
                          className="h-3 w-0.5 rounded-full"
                          style={{ backgroundColor: shift.color || "var(--muted-foreground)" }}
                        />
                        {shift.name}
                      </div>
                      <div className="mt-0.5 pl-2.5 text-xs text-muted-foreground tabular-nums">
                        {shift.startTime}-{shift.endTime}
                      </div>
                    </th>
                    {weekDates.map((date) => {
                      const list = byCell.get(`${date}__${shift.id}`) ?? [];
                      const shortage = Math.max(0, requiredFor(date, shift) - list.length);
                      return (
                        <td
                          key={date}
                          className={cn("border-l border-border/60 px-1.5 py-2 align-top", date === today && "bg-(--sg-brand)/[0.04]")}
                        >
                          <div className="flex min-h-14 flex-col gap-1">
                            {list.map((a) => chipFor(a, "default"))}
                            {shortage > 0 ? (
                              <ShortageBadge
                                text={labels.shortage(shortage)}
                                size="sm"
                                label={labels.shortageAction(dateLabel(date), shift.name, shortage)}
                                onClick={onFillShortage ? () => onFillShortage(date, shift) : undefined}
                              />
                            ) : null}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

interface MobileDayViewProps {
  className?: string;
  style?: CSSProperties;
  dates: string[];
  shifts: ScheduleShift[];
  byCell: Map<string, ScheduleAssignment[]>;
  today: string;
  ownEmployeeId: number | null;
  requiredFor: (date: string, shift: ScheduleShift) => number;
  onFillShortage?: (date: string, shift: ScheduleShift) => void;
  labels: ScheduleGridLabels;
  weekday: (date: string) => string;
  dateLabel: (date: string) => string;
  chipFor: (a: ScheduleAssignment, size: "default" | "lg") => ReactNode;
}

/** 手機版：上方橫向日期選擇器，下方列出當天各班別，左右滑動 60px 以上換日 */
function MobileDayView({
  className,
  style,
  dates,
  shifts,
  byCell,
  today,
  ownEmployeeId,
  requiredFor,
  onFillShortage,
  labels,
  weekday,
  dateLabel,
  chipFor,
}: MobileDayViewProps) {
  const [selected, setSelected] = useState(() => (dates.includes(today) ? today : (dates[0] ?? "")));
  const touchStartX = useRef<number | null>(null);
  const current = dates.includes(selected) ? selected : (dates[0] ?? "");
  const currentIndex = dates.indexOf(current);

  function dayFlags(date: string) {
    let shortage = false;
    let own = false;
    for (const shift of shifts) {
      const list = byCell.get(`${date}__${shift.id}`) ?? [];
      if (list.length < requiredFor(date, shift)) shortage = true;
      if (ownEmployeeId != null && list.some((a) => a.employeeId === ownEmployeeId)) own = true;
    }
    return { shortage, own };
  }

  function go(offset: number) {
    const next = dates[currentIndex + offset];
    if (next) setSelected(next);
  }

  const currentDate = current ? parseDate(current) : null;

  return (
    <section className={cn(TOKENS, "flex flex-col gap-3", className)} style={style}>
      <div role="tablist" aria-label={labels.pickDate} className="flex snap-x gap-1 overflow-x-auto pb-1 [scrollbar-width:none]">
        {dates.map((date) => {
          const d = parseDate(date);
          const active = date === current;
          const isToday = date === today;
          const { shortage, own } = dayFlags(date);
          return (
            <button
              key={date}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={labels.dayTabLabel(d.getMonth() + 1, d.getDate(), weekday(date), isToday)}
              onClick={() => setSelected(date)}
              className={cn(
                "flex min-w-10 flex-1 snap-start flex-col items-center gap-0.5 rounded-xl border py-2 transition-colors motion-reduce:transition-none",
                active ? "border-foreground bg-foreground text-background" : "border-border bg-card text-foreground",
              )}
            >
              <span className={cn("text-[11px]", active ? "text-background/70" : "text-muted-foreground")}>{weekday(date)}</span>
              <span className="text-base font-semibold tabular-nums">{d.getDate()}</span>
              <span className="flex h-1.5 items-center gap-0.5" aria-hidden>
                {isToday ? <span className={cn("size-1 rounded-full", active ? "bg-background" : "bg-(--sg-brand)")} /> : null}
                {own ? <span className={cn("size-1 rounded-full", active ? "bg-background" : "bg-foreground")} /> : null}
                {shortage ? <span className="size-1 rounded-full bg-(--sg-warning)" /> : null}
              </span>
            </button>
          );
        })}
      </div>

      <div
        className="overflow-hidden rounded-xl border border-border bg-card"
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          const start = touchStartX.current;
          const end = e.changedTouches[0]?.clientX;
          touchStartX.current = null;
          if (start == null || end == null) return;
          const dx = end - start;
          if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
        }}
      >
        {currentDate ? (
          <div className="flex items-baseline justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">
              {currentDate.getMonth() + 1}/{currentDate.getDate()}
              <span className="ml-1.5 font-normal text-muted-foreground">{weekday(current)}</span>
            </p>
            {current === today ? <span className="text-xs font-medium text-(--sg-brand)">{labels.today}</span> : null}
          </div>
        ) : null}
        <ul className="divide-y divide-border">
          {shifts.map((shift) => {
            const list = byCell.get(`${current}__${shift.id}`) ?? [];
            const req = requiredFor(current, shift);
            const shortage = Math.max(0, req - list.length);
            return (
              <li key={shift.id} className="px-4 py-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden
                      className="h-3.5 w-0.5 shrink-0 rounded-full"
                      style={{ backgroundColor: shift.color || "var(--muted-foreground)" }}
                    />
                    <span className="text-sm font-medium text-foreground">{shift.name}</span>
                    <span className="truncate text-xs text-muted-foreground tabular-nums">
                      {shift.startTime}-{shift.endTime}
                    </span>
                  </div>
                  <span className={cn("shrink-0 text-xs tabular-nums", shortage > 0 ? "text-(--sg-warning)" : "text-muted-foreground")}>
                    {labels.headcount(list.length, req)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {list.map((a) => chipFor(a, "lg"))}
                  {shortage > 0 ? (
                    <ShortageBadge
                      text={labels.shortage(shortage)}
                      size="lg"
                      label={labels.shortageAction(dateLabel(current), shift.name, shortage)}
                      onClick={onFillShortage ? () => onFillShortage(current, shift) : undefined}
                    />
                  ) : null}
                  {list.length === 0 && shortage === 0 ? <span className="text-xs text-muted-foreground">{labels.noOne}</span> : null}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
