"use client";

import { useId, useRef, type InputHTMLAttributes, type KeyboardEvent } from "react";

import { at, lines, paletteOf, puff } from "@/components/ui/anime-fx";
import { cn } from "@/lib/utils";

export type AnimeInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "children"> & {
  label: string;
  /** Help text under the field */
  hint?: string;
  /** Error text; marks the field invalid */
  error?: string;
};

const SHELL = "border-[3px] border-foreground bg-card shadow-[4px_5px_0_color-mix(in_oklch,var(--sunui-spot,var(--primary))_38%,var(--card))]";

let measurer: CanvasRenderingContext2D | null = null;

/**
 * A text field where every key kicks up a little dust where the caret is, and a deletion leaves two short speed lines.
 * Nothing fires while an input method is composing (Chinese, Japanese), only when the character is committed.
 * A plain input underneath: label, hint, error and every input attribute work as usual.
 */
export function AnimeInput({ label, hint, error, id, className, onKeyDown, onCompositionEnd, ...rest }: AnimeInputProps) {
  const auto = useId();
  const fieldId = id ?? auto;
  const ref = useRef<HTMLInputElement>(null);
  const composing = useRef(false);

  // Where the caret is, in page coordinates: text width up to the caret, from the field's own font
  const caret = () => {
    const el = ref.current!;
    const cs = getComputedStyle(el);
    measurer ??= document.createElement("canvas").getContext("2d");
    if (!measurer) return at(el, 0.5, 0.5);
    measurer.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const text = el.type === "password" ? "•".repeat(el.selectionStart ?? el.value.length) : el.value.slice(0, el.selectionStart ?? el.value.length);
    const box = at(el, 0, 0.5);
    const x = box.x + parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth) + measurer.measureText(text).width - el.scrollLeft;
    return { x: Math.min(x, box.x + box.w - 10), y: box.y, h: box.h };
  };

  const kick = (deleting: boolean) => {
    const el = ref.current;
    if (!el) return;
    // Wait one frame so the character is in the field and the caret has moved
    requestAnimationFrame(() => {
      const c = caret();
      const P = paletteOf(el);
      if (deleting) lines(P, c.x + 6, c.y, { n: 2, dir: 0, len: 14, spread: 5, life: 0.22 });
      else puff(P, c.x, c.y + c.h / 2 - 2, { size: 4 + Math.random() * 2, n: 3, vx: (Math.random() - 0.5) * 30, vy: -16, life: 0.5 });
    });
  };

  const key = (e: KeyboardEvent<HTMLInputElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || composing.current || e.nativeEvent.isComposing || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === "Backspace" || e.key === "Delete") kick(true);
    else if (e.key.length === 1) kick(false);
  };

  return (
    <div className={cn("w-full max-w-xs", className)}>
      <label htmlFor={fieldId} className="mb-2 block text-[13px] font-bold">
        {label}
      </label>
      <input
        ref={ref}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${fieldId}-d` : undefined}
        onKeyDown={key}
        onCompositionStart={() => (composing.current = true)}
        onCompositionEnd={(e) => {
          composing.current = false;
          onCompositionEnd?.(e);
          kick(false);
        }}
        className={cn(
          "h-11 w-full rounded-[12px] px-3.5 text-[15px] outline-none placeholder:text-muted-foreground disabled:opacity-60",
          "focus-visible:ring-[3px] focus-visible:ring-[var(--sunui-spot,var(--primary))] focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          SHELL,
          error && "border-[var(--sunui-like,#dc3d43)]",
        )}
        {...rest}
      />
      {(error || hint) && (
        <p id={`${fieldId}-d`} className={cn("mt-2 text-[13px]", error ? "font-medium text-[var(--sunui-like,#dc3d43)]" : "text-muted-foreground")}>
          {error || hint}
        </p>
      )}
    </div>
  );
}
