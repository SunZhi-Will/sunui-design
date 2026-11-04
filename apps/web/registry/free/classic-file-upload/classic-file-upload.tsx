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

// 原本的 violet/fuchsia、cyan/sky、orange/amber（Tailwind 色票 hex）
const PALETTES: Record<Exclude<FileUploadTheme, "custom">, FileUploadPalette> = {
  violet: { p50: "#f5f3ff", p100: "#ede9fe", p300: "#c4b5fd", p500: "#8b5cf6", p600: "#7c3aed", p700: "#6d28d9", s500: "#d946ef" },
  cyan: { p50: "#ecfeff", p100: "#cffafe", p300: "#67e8f9", p500: "#06b6d4", p600: "#0891b2", p700: "#0e7490", s500: "#0ea5e9" },
  orange: { p50: "#fff7ed", p100: "#ffedd5", p300: "#fdba74", p500: "#f97316", p600: "#ea580c", p700: "#c2410c", s500: "#f59e0b" },
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

const DEFAULT_LABELS: Required<FileUploadLabels> = {
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
  theme?: FileUploadTheme;
  /** theme="custom" 時使用的色票，未給的欄位沿用 violet */
  customColors?: Partial<FileUploadPalette>;
  showPreview?: boolean;
  previewGridClassName?: string;
  onRemovePreview?: (index: number) => void;
  placeholder?: string;
  description?: string;
  /** 原本先跑一段 0 到 100 的假進度再等待上傳完成；設為 false 改由 onProgress 驅動 */
  simulateProgress?: boolean;
  /** PDF 第一頁縮圖產生器（例如以 pdfjs-dist 繪製），回傳圖片網址；未提供時顯示檔案圖示 */
  renderPdfPreview?: (file: File) => Promise<string>;
  labels?: FileUploadLabels;
}

const FILE_PATH = "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z";

function FileIcon({ type, isPreview = true }: { type: string; isPreview?: boolean }) {
  const size = isPreview ? "size-12" : "size-6";
  if (type.startsWith("image/")) return null;
  const extra = type.includes("pdf") ? "M9 13h6m-3-3v6" : type.includes("word") || type.includes("document") ? "M9 12h6" : null;
  return (
    <svg className={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={FILE_PATH} />
      {extra && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={extra} />}
    </svg>
  );
}

const loop = (y: number[], duration: number, reduce: boolean, extra: Record<string, number[]> = {}) =>
  reduce ? { y: 0 } : { y, ...extra, transition: { duration, repeat: Infinity, ease: "easeInOut" as const } };

/** 上傳圖示：待機緩慢浮動，上傳中快速彈跳並落下雨線 */
function UploadIcon({ isUploading, reduce }: { isUploading: boolean; reduce: boolean }) {
  return (
    <motion.div className="relative mb-4 size-20" animate={isUploading ? loop([-4, -16, -4], 0.6, reduce) : loop([-2, -6, -2], 1.5, reduce)}>
      <motion.div
        className="absolute inset-0 rounded-full opacity-20 blur-xl"
        style={{ backgroundImage: "linear-gradient(to right, var(--fu-p500), var(--fu-s500))" }}
        animate={
          isUploading
            ? loop([-4, -16, -4], 0.6, reduce, { opacity: [0.2, 0.4, 0.2] })
            : loop([-2, -6, -2], 1.5, reduce, { opacity: [0.1, 0.2, 0.1] })
        }
      />
      <motion.svg
        className="relative size-full text-[color:var(--fu-p500)]"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        aria-hidden="true"
        animate={isUploading ? loop([-2, -8, -2], 0.4, reduce) : loop([-1, -3, -1], 1.5, reduce)}
      >
        {isUploading &&
          !reduce &&
          [4, 8, 12, 16, 20].map((x, index) => (
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
                y: [0, 12],
                transition: { duration: 0.5, repeat: Infinity, ease: "easeInOut", delay: index * 0.08 },
              }}
            />
          ))}
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={isUploading ? 3 : 2} d="M12 20V4m-7 7l7-7l7 7" />
      </motion.svg>
    </motion.div>
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
        className="relative mt-4 h-2 overflow-hidden rounded-full bg-[color:var(--fu-p100)]"
      >
        <motion.div
          className="absolute top-0 left-0 h-full"
          style={{ backgroundImage: "linear-gradient(to right, var(--fu-p500), var(--fu-s500))" }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={reduce ? { duration: 0 } : undefined}
        >
          {!reduce && (
            <motion.div
              className="absolute inset-0 bg-white/20"
              animate={{ x: ["-100%", "100%"], transition: { duration: 1, repeat: Infinity, ease: "linear" } }}
            />
          )}
        </motion.div>
      </div>
      <p className="mt-2 text-sm text-[color:var(--fu-p500)] tabular-nums">{progress}%</p>
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
  showPreview = true,
  previewGridClassName,
  onRemovePreview,
  placeholder,
  description,
  simulateProgress = true,
  renderPdfPreview,
  labels,
}: ClassicFileUploadProps) {
  const reduce = useReducedMotion() ?? false;
  const t = { ...DEFAULT_LABELS, ...labels };
  const placeholderText = placeholder ?? t.placeholder;
  const descId = useId();

  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const palette = useMemo<FileUploadPalette>(
    () => (theme === "custom" ? { ...PALETTES.violet, ...customColors } : PALETTES[theme]),
    [theme, customColors],
  );

  const vars = {
    "--fu-p50": palette.p50,
    "--fu-p100": palette.p100,
    "--fu-p300": palette.p300,
    "--fu-p500": palette.p500,
    "--fu-p600": palette.p600,
    "--fu-p700": palette.p700,
    "--fu-s500": palette.s500,
  } as CSSProperties;

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
    [maxSize, accept, labels],
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
    [onFileSelect, onFileUpload, handlePreview, runSimulatedProgress, simulateProgress, labels],
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
    <motion.div
      className="relative flex h-full min-h-[160px] w-full flex-col items-center justify-center text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* 拖曳中的虛線框提示 */}
      <div
        aria-hidden={!isDragActive}
        className={cn(
          "pointer-events-none absolute inset-0 transition-opacity duration-300",
          isDragActive ? "opacity-100" : "opacity-0",
        )}
      >
        <div className="absolute inset-2 flex items-center justify-center rounded-lg border-2 border-dashed border-[color:var(--fu-p500)]">
          <div className="rounded-lg bg-[color:var(--fu-p50)] px-6 py-4 shadow-sm">
            <p className="font-medium text-[color:var(--fu-p600)]">{t.release}</p>
          </div>
        </div>
      </div>
      <motion.div
        className="flex w-full flex-col items-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        <UploadIcon isUploading={false} reduce={reduce} />
        <div className="w-full max-w-[300px]">
          <motion.p
            className="bg-clip-text text-lg font-medium text-transparent"
            style={{ backgroundImage: "linear-gradient(to right, var(--fu-p500), var(--fu-s500))" }}
            animate={reduce ? { opacity: 1 } : { opacity: [0.5, 1, 0.5] }}
            transition={reduce ? { duration: 0 } : { duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            {placeholderText}
          </motion.p>
          <div id={descId}>
            {hint && <p className="mt-2 text-sm text-gray-500">{hint}</p>}
            {maxSize && <p className="mt-1 text-sm text-gray-500">{t.maxSize((maxSize / 1024 / 1024).toFixed(0))}</p>}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );

  return (
    <div className="flex w-full flex-col items-center" style={vars}>
      <motion.div
        className={cn(
          "relative min-h-[200px] w-full max-w-[600px] rounded-xl border-2 border-dashed p-8 backdrop-blur-sm transition-all duration-300 hover:shadow-lg",
          "border-[color:var(--fu-p300)] hover:border-[color-mix(in_srgb,var(--fu-p500)_50%,transparent)]",
          "bg-[linear-gradient(to_bottom_right,color-mix(in_srgb,var(--fu-p500)_5%,transparent),color-mix(in_srgb,var(--fu-s500)_5%,transparent))]",
          className,
          isDragActive &&
            (dragActiveClassName ||
              "scale-[1.02] border-[color:var(--fu-p500)] bg-[linear-gradient(to_bottom_right,color-mix(in_srgb,var(--fu-p500)_10%,transparent),color-mix(in_srgb,var(--fu-s500)_10%,transparent))] shadow-xl hover:border-[color:var(--fu-p500)]"),
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        initial={reduce ? false : { opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
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
          className="relative flex h-full min-h-[200px] cursor-pointer flex-col items-start justify-start rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[color:var(--fu-p500)]"
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
        >
          {previews.length > 0 && (
            <motion.ul
              className={cn("grid w-full grid-cols-4 gap-3 px-4", previewGridClassName)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {previews.map((preview, index) => {
                const hasThumb = (preview.type?.startsWith("image/") || preview.type === "application/pdf") && preview.url;
                return (
                  <motion.li
                    key={`${preview.name}-${index}`}
                    className={cn(
                      "group relative overflow-hidden rounded-lg border border-gray-200 shadow-sm",
                      showPreview ? "aspect-square" : "col-span-2 h-12",
                    )}
                    initial={reduce ? false : { opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                    whileHover={reduce ? undefined : { scale: 1.02 }}
                  >
                    {showPreview ? (
                      hasThumb ? (
                        <div className="size-full bg-gray-50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={preview.url} alt={preview.name} className="size-full object-cover" />
                        </div>
                      ) : (
                        <div className="flex size-full flex-col items-center justify-center bg-gray-50">
                          <div className="text-[color:var(--fu-p500)]">
                            <FileIcon type={preview.type || ""} />
                          </div>
                          <p className="mt-1 line-clamp-1 px-2 text-center text-xs text-gray-600">{preview.name}</p>
                        </div>
                      )
                    ) : (
                      <div className="flex size-full items-center gap-2 bg-gray-50 px-3">
                        <div className="size-6 shrink-0 text-[color:var(--fu-p500)]">
                          <FileIcon type={preview.type || ""} isPreview={false} />
                        </div>
                        <p className="min-w-0 flex-1 truncate text-sm font-medium text-[color:var(--fu-p600)]">{preview.name}</p>
                      </div>
                    )}
                    {/* 滑過時的深色遮罩與移除鈕 */}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100">
                      <motion.button
                        type="button"
                        aria-label={t.remove(preview.name)}
                        onClick={(e) => {
                          e.stopPropagation();
                          removePreview(index);
                        }}
                        onKeyDown={(e) => e.stopPropagation()}
                        className="rounded-full bg-[color:var(--fu-p500)] p-1.5 text-white transition-transform hover:bg-[color:var(--fu-p600)] focus-visible:outline-2 focus-visible:outline-white"
                        whileHover={reduce ? undefined : { scale: 1.1 }}
                        whileTap={reduce ? undefined : { scale: 0.9 }}
                      >
                        <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </motion.button>
                    </div>
                  </motion.li>
                );
              })}
            </motion.ul>
          )}

          {/* 上傳中覆蓋層 */}
          <AnimatePresence>
            {isUploading && (
              <motion.div
                className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/40 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                aria-live="polite"
              >
                <UploadIcon isUploading reduce={reduce} />
                <motion.div className="w-full max-w-[300px] text-center" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  <p className="text-lg font-medium text-[color:var(--fu-p600)]">{t.uploading}</p>
                  {showProgress && <ProgressBar progress={uploadProgress} reduce={reduce} />}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {!previews.length && !isUploading && (children || defaultContent)}
        </div>

        <AnimatePresence>
          {error && !isUploading && (
            <motion.div
              className="absolute bottom-4 left-1/2 z-20 w-[calc(100%-2rem)] max-w-[300px] -translate-x-1/2"
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: reduce ? 0 : 0.2 }}
            >
              <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 p-4 text-red-600 shadow-sm backdrop-blur-sm">
                <motion.svg
                  className="size-5 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  aria-hidden="true"
                  initial={reduce ? false : { scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <motion.path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    initial={reduce ? false : { pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                  />
                </motion.svg>
                <motion.p
                  className="min-w-0 flex-1 text-sm font-medium break-words"
                  initial={reduce ? false : { x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                >
                  {error}
                </motion.p>
                <motion.button
                  type="button"
                  aria-label={t.dismiss}
                  onClick={() => setError(null)}
                  className="shrink-0 text-red-500 transition-colors hover:text-red-700"
                  whileHover={reduce ? undefined : { scale: 1.1 }}
                  whileTap={reduce ? undefined : { scale: 0.9 }}
                >
                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
