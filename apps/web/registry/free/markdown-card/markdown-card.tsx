"use client";

import { useEffect, useId, useRef, useState, type ComponentPropsWithoutRef, type FocusEvent, type JSX, type MouseEvent } from "react";
import ReactMarkdown, { type Components } from "react-markdown";

import { cn } from "@/lib/utils";

export interface MarkdownCardProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** 受控選取狀態；不給時點擊卡片即選取，點外面取消 */
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  /** 套用 CardFlow 畫布卡片外框（白底、圓角、陰影） */
  framed?: boolean;
  labels?: Partial<typeof defaultLabels>;
  className?: string;
}

const defaultLabels = {
  placeholder: "Type Markdown...\n\nFor example:\n# Heading\n**Bold** *Italic*\n- List item\n\nPress ESC to stop editing",
  emptySelected: "Click to start typing Markdown...",
  emptyIdle: "Select this card to start editing",
  editor: "Markdown editor",
  editHint: "Press Enter to edit",
};

type Strip<T extends keyof JSX.IntrinsicElements> = ComponentPropsWithoutRef<T> & { node?: unknown };

// 依字級產生 Notion 風格的元素樣式
function markdownComponents(fontSize: number): Components {
  const heading = (scale: number, marginTop: string, lineHeight: number) => ({
    fontSize: `${fontSize * scale}px`,
    fontWeight: 600,
    marginTop,
    marginBottom: "0.5em",
    lineHeight,
  });
  return {
    h1: ({ node: _n, ...p }: Strip<"h1">) => <h1 style={heading(1.875, "0.75em", 1.3)} {...p} />,
    h2: ({ node: _n, ...p }: Strip<"h2">) => <h2 style={heading(1.5, "0.75em", 1.3)} {...p} />,
    h3: ({ node: _n, ...p }: Strip<"h3">) => <h3 style={heading(1.25, "0.75em", 1.4)} {...p} />,
    h4: ({ node: _n, ...p }: Strip<"h4">) => <h4 style={heading(1.125, "0.5em", 1.4)} {...p} />,
    p: ({ node: _n, ...p }: Strip<"p">) => <p style={{ marginTop: "0.5em", marginBottom: "0.5em", lineHeight: "1.6" }} {...p} />,
    ul: ({ node: _n, ...p }: Strip<"ul">) => (
      <ul style={{ marginTop: "0.5em", marginBottom: "0.5em", paddingLeft: "1.5em", listStyleType: "disc" }} {...p} />
    ),
    ol: ({ node: _n, ...p }: Strip<"ol">) => (
      <ol style={{ marginTop: "0.5em", marginBottom: "0.5em", paddingLeft: "1.5em", listStyleType: "decimal" }} {...p} />
    ),
    li: ({ node: _n, ...p }: Strip<"li">) => <li style={{ marginTop: "0.25em", marginBottom: "0.25em", lineHeight: "1.6" }} {...p} />,
    strong: ({ node: _n, ...p }: Strip<"strong">) => <strong style={{ fontWeight: 600 }} {...p} />,
    em: ({ node: _n, ...p }: Strip<"em">) => <em style={{ fontStyle: "italic" }} {...p} />,
    // react-markdown v10 不再提供 inline，改以「沒有語言 class 且不含換行」判斷行內程式碼
    code: ({ node: _n, className, children, ...p }: Strip<"code">) => {
      const inline = !className && !String(children ?? "").includes("\n");
      return inline ? (
        <code
          style={{
            backgroundColor: "rgba(0,0,0,0.08)",
            padding: "0.125em 0.375em",
            borderRadius: "0.25em",
            fontFamily: "monospace",
            fontSize: "0.9em",
          }}
          {...p}
        >
          {children}
        </code>
      ) : (
        <code
          className={className}
          style={{
            display: "block",
            backgroundColor: "rgba(0,0,0,0.06)",
            padding: "0.75em",
            borderRadius: "0.375em",
            fontFamily: "monospace",
            fontSize: "0.875em",
            overflow: "auto",
            marginTop: "0.5em",
            marginBottom: "0.5em",
          }}
          {...p}
        >
          {children}
        </code>
      );
    },
    a: ({ node: _n, ...p }: Strip<"a">) => (
      <a style={{ color: "#2563eb", textDecoration: "underline", cursor: "pointer" }} {...p} />
    ),
    blockquote: ({ node: _n, ...p }: Strip<"blockquote">) => (
      <blockquote
        style={{
          borderLeft: "3px solid #e0e0e0",
          paddingLeft: "1em",
          marginLeft: "0",
          marginTop: "0.75em",
          marginBottom: "0.75em",
          color: "#666",
          fontStyle: "italic",
        }}
        {...p}
      />
    ),
  };
}

export function MarkdownCard({
  value: valueProp,
  defaultValue = "",
  onValueChange,
  selected: selectedProp,
  onSelectedChange,
  fontSize = 16,
  color = "#000000",
  fontFamily = "Arial",
  framed = true,
  labels: labelsProp,
  className,
}: MarkdownCardProps) {
  const labels = { ...defaultLabels, ...labelsProp };
  const [innerValue, setInnerValue] = useState(defaultValue);
  const [innerSelected, setInnerSelected] = useState(false);
  const content = valueProp ?? innerValue;
  const isSelected = selectedProp ?? innerSelected;
  const [isEditing, setIsEditing] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const escaped = useRef(false);
  const hintId = useId();

  const setSelected = (next: boolean) => {
    if (selectedProp === undefined) setInnerSelected(next);
    onSelectedChange?.(next);
  };

  // 非受控時：點卡片外面取消選取
  useEffect(() => {
    if (selectedProp !== undefined || !innerSelected) return;
    const onDown = (e: PointerEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setInnerSelected(false);
        onSelectedChange?.(false);
      }
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [selectedProp, innerSelected, onSelectedChange]);

  // Notion 風格：選取後 100ms 自動進入編輯，取消選取即退出
  useEffect(() => {
    if (isSelected) {
      const timer = setTimeout(() => setIsEditing(true), 100);
      return () => clearTimeout(timer);
    }
    setIsEditing(false);
  }, [isSelected]);

  // 進入編輯時聚焦並把游標移到最後，不全選
  useEffect(() => {
    const ta = textareaRef.current;
    if (isEditing && ta) {
      ta.focus();
      ta.setSelectionRange(ta.value.length, ta.value.length);
    }
  }, [isEditing]);

  // ESC 退出後把焦點還給預覽區，鍵盤使用者不會迷路
  useEffect(() => {
    if (!isEditing && escaped.current) {
      escaped.current = false;
      previewRef.current?.focus();
    }
  }, [isEditing]);

  // ESC 退出編輯
  useEffect(() => {
    if (!isEditing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        escaped.current = true;
        setIsEditing(false);
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isEditing]);

  // 已選取時點內容即可編輯（點連結或按鈕除外）
  const handlePreviewClick = (e: MouseEvent) => {
    if (isEditing || !isSelected) return;
    const target = e.target as HTMLElement;
    if (!target.closest("a") && !target.closest("button")) {
      e.preventDefault();
      e.stopPropagation();
      setIsEditing(true);
    }
  };

  // 焦點移到卡片外才退出編輯
  const handleBlur = (e: FocusEvent) => {
    if (!containerRef.current?.contains(e.relatedTarget as Node | null)) setIsEditing(false);
  };

  const handleChange = (next: string) => {
    if (valueProp === undefined) setInnerValue(next);
    onValueChange?.(next);
  };

  const textStyle = { fontSize: `${fontSize}px`, color, fontFamily };

  return (
    <div
      ref={containerRef}
      className={cn(
        "h-full w-full overflow-auto bg-white p-4 transition-all duration-150 motion-reduce:transition-none",
        framed && "rounded-lg shadow-lg",
        className,
      )}
      onMouseDown={(e) => {
        // 編輯中阻止冒泡，讓文字選取正常
        if (isEditing) e.stopPropagation();
      }}
      onClick={() => {
        if (!isSelected) setSelected(true);
      }}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      style={{ userSelect: "text" }}
    >
      {isEditing ? (
        <textarea
          ref={textareaRef}
          data-textarea="true"
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          aria-label={labels.editor}
          className="h-full w-full resize-none border-none bg-transparent font-mono outline-none"
          style={{ ...textStyle, pointerEvents: "auto", lineHeight: "1.6", minHeight: "1.5em" }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          placeholder={labels.placeholder}
        />
      ) : (
        <div
          className={cn(
            "h-full w-full break-words outline-none transition-opacity duration-150 focus-visible:ring-2 focus-visible:ring-blue-500 motion-reduce:transition-none",
            isHovering && isSelected ? "opacity-90" : "opacity-100",
          )}
          style={{ ...textStyle, cursor: isSelected ? "text" : "default" }}
          ref={previewRef}
          onClick={handlePreviewClick}
          // 鍵盤使用者：聚焦後按 Enter 進入編輯
          tabIndex={0}
          aria-describedby={hintId}
          onKeyDown={(e) => {
            if (e.target !== e.currentTarget || e.key !== "Enter") return;
            e.preventDefault();
            if (!isSelected) setSelected(true);
            else setIsEditing(true);
          }}
        >
          <span id={hintId} className="sr-only">
            {labels.editHint}
          </span>
          {content.trim() ? (
            <ReactMarkdown components={markdownComponents(fontSize)}>{content}</ReactMarkdown>
          ) : (
            <div className={cn("italic text-gray-400 transition-opacity motion-reduce:transition-none", isSelected ? "opacity-70" : "opacity-50")}>
              {isSelected ? labels.emptySelected : labels.emptyIdle}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
