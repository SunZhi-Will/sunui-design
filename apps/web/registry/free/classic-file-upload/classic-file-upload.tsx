"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type DragEvent,
  type ReactNode,
} from "react";

import { cn } from "@/lib/utils";

export type FileUploadTheme = "violet" | "cyan" | "orange" | "custom";

export interface FilePreview {
  url: string;
  name: string;
  type?: string;
}

/** 主題色票：primary 50/100/300/500/600/700 與 secondary 500 */
export interface FileUploadPalette {
  p50: string;
  p100: string;
  p300: string;
  p500: string;
  p600: string;
  p700: string;
  s500: string;
}

// 舊版每個 theme 是一整組彩色色票；現在介面一律用 shadcn token，theme 只決定唯一強調色（進度條）
// violet 已停用（紫色不符合視覺規範），會改用預設朱紅
const THEME_ACCENT: Record<Exclude<FileUploadTheme, "custom">, string | undefined> = {
  violet: undefined,
  cyan: "#0e7490",
  orange: undefined,
};

export interface FileUploadLabels {
  placeholder?: string;
  /** 拖曳中央提示 */
  release?: string;
  uploading?: string;
  /** 依 accept 自動產生的格式說明 */
  supportedTypes?: (types: string) => string;
  maxSize?: (mb: string) => string;
  tooLarge?: (name: string, mb: number) => string;
  unsupported?: (name: string) => string;
  failed?: string;
  remove?: (name: string) => string;
  dismiss?: string;
}

type SunLocale = "en" | "zh-TW" | "zh-CN" | "ja";

/** 任意語言標籤歸到內建的四種語言之一，其他一律用英文 */
function resolveLocale(tag?: string): SunLocale {
  const t = (tag ?? "en").toLowerCase();
  if (t.startsWith("zh")) return /hant|tw|hk|mo/.test(t) ? "zh-TW" : "zh-CN";
  if (t.startsWith("ja")) return "ja";
  return "en";
}

const MESSAGES: Record<SunLocale, Required<FileUploadLabels>> = {
  en: {
    placeholder: "Drop files here or click to upload",
    release: "Release to upload files",
    uploading: "Uploading...",
    supportedTypes: (types) => `Supported file types: ${types}`,
    maxSize: (mb) => `Maximum file size: ${mb} MB`,
    tooLarge: (name, mb) => `File ${name} exceeds size limit of ${mb}MB`,
    unsupported: (name) => `File type ${name} is not supported`,
    failed: "Upload failed. Please try again.",
    remove: (name) => `Remove ${name}`,
    dismiss: "Dismiss error",
  },
  "zh-TW": {
    placeholder: "將檔案拖曳到這裡，或點擊上傳",
    release: "放開即可上傳檔案",
    uploading: "上傳中...",
    supportedTypes: (types) => `支援的檔案類型：${types}`,
    maxSize: (mb) => `檔案大小上限：${mb} MB`,
    tooLarge: (name, mb) => `檔案 ${name} 超過 ${mb}MB 的大小上限`,
    unsupported: (name) => `不支援 ${name} 的檔案類型`,
    failed: "上傳失敗，請再試一次。",
    remove: (name) => `移除 ${name}`,
    dismiss: "關閉錯誤訊息",
  },
  "zh-CN": {
    placeholder: "将文件拖放到这里，或点击上传",
    release: "松开即可上传文件",
    uploading: "上传中...",
    supportedTypes: (types) => `支持的文件类型：${types}`,
    maxSize: (mb) => `文件大小上限：${mb} MB`,
    tooLarge: (name, mb) => `文件 ${name} 超过 ${mb}MB 的大小限制`,
    unsupported: (name) => `不支持 ${name} 的文件类型`,
    failed: "上传失败，请重试。",
    remove: (name) => `移除 ${name}`,
    dismiss: "关闭错误提示",
  },
  ja: {
    placeholder: "ファイルをドロップ、またはクリックしてアップロード",
    release: "離すとアップロードします",
    uploading: "アップロード中...",
    supportedTypes: (types) => `対応ファイル形式：${types}`,
    maxSize: (mb) => `最大ファイルサイズ：${mb} MB`,
    tooLarge: (name, mb) => `${name} はサイズ上限の ${mb}MB を超えています`,
    unsupported: (name) => `${name} のファイル形式には対応していません`,
    failed: "アップロードに失敗しました。もう一度お試しください。",
    remove: (name) => `${name} を削除`,
    dismiss: "エラーを閉じる",
  },
};

export interface ClassicFileUploadProps {
  onFileSelect?: (files: File[]) => void;
  /** 上傳函式；第二個參數可回報真實進度（0 到 100），搭配 simulateProgress={false} */
  onFileUpload?: (files: File[], onProgress: (percent: number) => void) => Promise<void>;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  className?: string;
  dragActiveClassName?: string;
  /** 取代預設的空狀態內容 */
  children?: ReactNode;
  showProgress?: boolean;
  /** 舊版配色。現在只影響強調色：orange 與 violet 用預設朱紅，cyan 用深青，custom 用 customColors.p500 */
  theme?: FileUploadTheme;
  /** theme="custom" 時使用；只會讀 p500 當強調色，其餘欄位保留相容 */
  customColors?: Partial<FileUploadPalette>;
  /** 唯一的強調色，只用在上傳進度條；預設朱紅 #c8361d（暗色 #ec6a4f），優先於 theme */
  accent?: string;
  showPreview?: boolean;
  previewGridClassName?: string;
  onRemovePreview?: (index: number) => void;
  placeholder?: string;
  description?: string;
  /** 原本先跑一段 0 到 100 的假進度再等待上傳完成；設為 false 改由 onProgress 驅動 */
  simulateProgress?: boolean;
  /** PDF 第一頁縮圖產生器（例如以 pdfjs-dist 繪製），回傳圖片網址；未提供時顯示檔案圖示 */
  renderPdfPreview?: (file: File) => Promise<string>;
  /** 介面語言：en、zh-TW、zh-CN、ja，也接受 zh-Hant-HK、ja-JP 這類標籤 */
  locale?: string;
  /** 覆寫內建字串，優先於 locale */
  labels?: FileUploadLabels;
}

const FILE_PATH = "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z";

function FileIcon({ type, isPreview = true }: { type: string; isPreview?: boolean }) {
  const size = isPreview ? "size-10" : "size-6";
  if (type.startsWith("image/")) return null;
  const extra = type.includes("pdf") ? "M9 13h6m-3-3v6" : type.includes("word") || type.includes("document") ? "M9 12h6" : null;
  return (
    <svg className={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={FILE_PATH} />
      {extra && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d={extra} />}
    </svg>
  );
}

/** 上傳圖示：待機靜止；上傳中箭頭下方落下雨線，表示真的在處理 */
function UploadIcon({ isUploading, reduce }: { isUploading: boolean; reduce: boolean }) {
  return (
    <div className="mb-4 flex size-12 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
      <svg className="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
        {isUploading &&
          !reduce &&
          [6, 12, 18].map((x, index) => (
            <motion.line
              key={x}
              x1={x}
              y1="8"
              x2={x}
              y2="12"
              strokeLinecap="round"
              strokeWidth={1}
              initial={{ opacity: 0, y: 0 }}
              animate={{
                opacity: [0, 0.6, 0],
                y: [0, 10],
                transition: { duration: 0.5, repeat: Infinity, ease: "easeInOut", delay: index * 0.08 },
              }}
            />
          ))}
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 20V4m-7 7l7-7l7 7" />
      </svg>
    </div>
  );
}

function ProgressBar({ progress, reduce }: { progress: number; reduce: boolean }) {
  return (
    <>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
        className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-muted"
      >
        {/* 唯一的強調色 */}
        <motion.div
          className="absolute top-0 left-0 h-full rounded-full bg-[var(--fu-accent)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={reduce ? { duration: 0 } : undefined}
        />
      </div>
      <p className="mt-2 text-sm text-muted-foreground tabular-nums">{progress}%</p>
    </>
  );
}

export function ClassicFileUpload({
  onFileSelect,
  onFileUpload,
  accept,
  multiple = false,
  maxSize,
  className,
  dragActiveClassName,
  children,
  showProgress = true,
  theme = "orange",
  customColors,
  accent,
  showPreview = true,
  previewGridClassName,
  onRemovePreview,
  placeholder,
  description,
  simulateProgress = true,
  renderPdfPreview,
  locale = "en",
  labels,
}: ClassicFileUploadProps) {
  const reduce = useReducedMotion() ?? false;
  const t = { ...MESSAGES[resolveLocale(locale)], ...labels };
  const placeholderText = placeholder ?? t.placeholder;
  const descId = useId();

  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // 強調色：accent 優先，其次 theme；都沒有就交給 class 裡的朱紅預設（含暗色）
  const accentColor = useMemo(
    () => accent ?? (theme === "custom" ? customColors?.p500 : THEME_ACCENT[theme]),
    [accent, theme, customColors],
  );
  const vars = (accentColor ? { "--fu-accent": accentColor } : undefined) as CSSProperties | undefined;

  // 驗證大小與類型，不符的檔案剔除並顯示最後一個錯誤
  const validateFiles = useCallback(
    (files: File[]): File[] => {
      setError(null);
      return files.filter((file) => {
        if (maxSize && file.size > maxSize) {
          setError(t.tooLarge(file.name, Math.round(maxSize / 1024 / 1024)));
          return false;
        }
        if (accept) {
          const acceptedTypes = accept.split(",").map((type) => type.trim());
          const ext = file.name.split(".").pop()?.toLowerCase();
          const ok = acceptedTypes.some((type) =>
            type.startsWith(".") ? `.${ext}` === type : new RegExp(type.replace("*", ".*")).test(file.type),
          );
          if (!ok) {
            setError(t.unsupported(file.name));
            return false;
          }
        }
        return true;
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [maxSize, accept, labels, locale],
  );

  const handleDrag = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      // 只在真正離開區塊時取消，避免經過子元素時閃爍
      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setIsDragActive(false);
    }
  }, []);

  const runSimulatedProgress = useCallback(async () => {
    setIsUploading(true);
    setUploadProgress(0);
    for (let i = 0; i <= 100; i += 10) {
      await new Promise((resolve) => setTimeout(resolve, 30));
      setUploadProgress(i);
    }
  }, []);

  const handlePreview = useCallback(
    async (files: File[]) => {
      for (const file of files) {
        const fallback: FilePreview = { url: "", name: file.name, type: file.type };
        try {
          if (file.type.startsWith("image/")) {
            const url = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            });
            setPreviews((prev) => [...prev, { ...fallback, url }]);
          } else if (file.type === "application/pdf" && renderPdfPreview) {
            const url = await renderPdfPreview(file);
            setPreviews((prev) => [...prev, { ...fallback, url }]);
          } else {
            setPreviews((prev) => [...prev, fallback]);
          }
        } catch {
          setPreviews((prev) => [...prev, fallback]);
        }
      }
    },
    [renderPdfPreview],
  );

  const handleFileUploadProcess = useCallback(
    async (files: File[]) => {
      await handlePreview(files);
      onFileSelect?.(files);
      if (!onFileUpload) return;
      if (simulateProgress) {
        await runSimulatedProgress();
      } else {
        setIsUploading(true);
        setUploadProgress(0);
      }
      try {
        await onFileUpload(files, (p) => setUploadProgress(Math.max(0, Math.min(100, Math.round(p)))));
        setUploadProgress(100);
        setTimeout(() => setIsUploading(false), 300);
      } catch {
        setError(t.failed);
        setIsUploading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onFileSelect, onFileUpload, handlePreview, runSimulatedProgress, simulateProgress, labels, locale],
  );

  const handleDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
      const valid = validateFiles(Array.from(e.dataTransfer.files));
      if (valid.length > 0) await handleFileUploadProcess(valid);
    },
    [validateFiles, handleFileUploadProcess],
  );

  const handleFileSelect = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const list = e.target.files;
      if (!list) return;
      const valid = validateFiles(Array.from(list));
      // 清空 value，讓同一個檔案可以再選一次
      e.target.value = "";
      if (valid.length > 0) await handleFileUploadProcess(valid);
    },
    [validateFiles, handleFileUploadProcess],
  );

  const removePreview = useCallback(
    (index: number) => {
      setPreviews((prev) => {
        const next = prev.filter((_item, i) => i !== index);
        if (next.length === 0) {
          // 移除所有檔案時重置狀態
          setUploadProgress(0);
          setError(null);
        }
        return next;
      });
      onRemovePreview?.(index);
    },
    [onRemovePreview],
  );

  const hint = description || (accept && t.supportedTypes(accept.split(",").map((type) => type.replace("/*", "")).join(", ")));

  const defaultContent = (
    <div className="relative flex h-full min-h-[160px] w-full flex-col items-center justify-center text-center">
      {/* 拖曳中的提示 */}
      <div
        aria-hidden={!isDragActive}
        className={cn(
          "pointer-events-none absolute inset-0 flex items-center justify-center transition-opacity duration-200",
          isDragActive ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="rounded-md border border-border bg-card px-5 py-3 shadow-sm">
          <p className="text-sm font-medium text-foreground">{t.release}</p>
        </div>
      </div>
      <div className={cn("flex w-full flex-col items-center transition-opacity duration-200", isDragActive && "opacity-0")}>
        <UploadIcon isUploading={false} reduce={reduce} />
        <div className="w-full max-w-[300px]">
          <p className="text-base font-medium text-foreground">{placeholderText}</p>
          <div id={descId}>
            {hint && <p className="mt-2 text-sm text-muted-foreground">{hint}</p>}
            {maxSize && <p className="mt-1 text-sm text-muted-foreground tabular-nums">{t.maxSize((maxSize / 1024 / 1024).toFixed(0))}</p>}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex w-full flex-col items-center [--fu-accent:#c8361d] dark:[--fu-accent:#ec6a4f]" style={vars}>
      <motion.div
        className={cn(
          "relative min-h-[200px] w-full max-w-[600px] rounded-xl border border-dashed border-border bg-card p-8 text-foreground transition-colors duration-200",
          "hover:border-foreground/30 hover:bg-muted/40",
          className,
          isDragActive && (dragActiveClassName || "border-foreground/40 bg-muted/60"),
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.24 }}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelect}
          accept={accept}
          multiple={multiple}
          tabIndex={-1}
          aria-hidden="true"
        />

        <div
          role="button"
          tabIndex={0}
          aria-label={placeholderText}
          aria-describedby={descId}
          aria-busy={isUploading}
          className="relative flex h-full min-h-[200px] cursor-pointer flex-col items-start justify-start rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
        >
          {previews.length > 0 && (
            <ul className={cn("grid w-full grid-cols-4 gap-3 px-4", previewGridClassName)}>
              {previews.map((preview, index) => {
                const hasThumb = (preview.type?.startsWith("image/") || preview.type === "application/pdf") && preview.url;
                return (
                  <motion.li
                    key={`${preview.name}-${index}`}
                    className={cn(
                      "group relative overflow-hidden rounded-md border border-border bg-muted",
                      showPreview ? "aspect-square" : "col-span-2 h-12",
                    )}
                    initial={reduce ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.18 }}
                  >
                    {showPreview ? (
                      hasThumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={preview.url} alt={preview.name} className="size-full object-cover" />
                      ) : (
                        <div className="flex size-full flex-col items-center justify-center text-muted-foreground">
                          <FileIcon type={preview.type || ""} />
                          <p className="mt-1 line-clamp-1 px-2 text-center text-xs">{preview.name}</p>
                        </div>
                      )
                    ) : (
                      <div className="flex size-full items-center gap-2 px-3">
                        <div className="size-6 shrink-0 text-muted-foreground">
                          <FileIcon type={preview.type || ""} isPreview={false} />
                        </div>
                        <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{preview.name}</p>
                      </div>
                    )}
                    {/* 滑過時的深色遮罩與移除鈕 */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                      <button
                        type="button"
                        aria-label={t.remove(preview.name)}
                        onClick={(e) => {
                          e.stopPropagation();
                          removePreview(index);
                        }}
                        onKeyDown={(e) => e.stopPropagation()}
                        className="rounded-md border border-border bg-card p-1.5 text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-white"
                      >
                        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          )}

          {/* 上傳中覆蓋層：不透明底，蓋住縮圖 */}
          <AnimatePresence>
            {isUploading && (
              <motion.div
                className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-md bg-card/95"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                aria-live="polite"
              >
                <UploadIcon isUploading reduce={reduce} />
                <div className="w-full max-w-[300px] text-center">
                  <p className="text-base font-medium text-foreground">{t.uploading}</p>
                  {showProgress && <ProgressBar progress={uploadProgress} reduce={reduce} />}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!previews.length && !isUploading && (children || defaultContent)}
        </div>

        <AnimatePresence>
          {error && !isUploading && (
            <motion.div
              className="absolute bottom-4 left-1/2 z-20 w-[calc(100%-2rem)] max-w-[300px] -translate-x-1/2"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: reduce ? 0 : 0.18 }}
            >
              <div role="alert" className="flex items-center gap-2 rounded-md border border-border bg-card p-3 text-foreground shadow-sm">
                <svg className="size-5 shrink-0 text-destructive" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="min-w-0 flex-1 text-sm font-medium break-words">{error}</p>
                <button
                  type="button"
                  aria-label={t.dismiss}
                  onClick={() => setError(null)}
                  className="shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
