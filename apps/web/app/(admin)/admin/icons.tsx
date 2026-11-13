// 後台用的小圖示：24 格線、1.7 線寬、跟著文字顏色。不引入圖示套件。

const PATHS = {
  overview: "M4 5h6v6H4zM14 5h6v4h-6zM14 13h6v6h-6zM4 15h6v4H4z",
  orders: "M6 4h12l1 4H5zM5 8h14v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1zM9 12h6",
  license: "M14 7a3 3 0 1 1-3 3M11 10 4 17v3h3l1-1v-2h2v-2h2l1.5-1.5M15.5 8.5h.01",
  block: "M4 7l8-4 8 4-8 4zM4 7v10l8 4V11M20 7v10l-8 4",
  download: "M12 4v11M7 10l5 5 5-5M5 20h14",
  funnel: "M4 5h16l-6 8v6l-4-2v-4z",
  spark: "M12 3l1.8 4.6L18 9l-4.2 1.4L12 15l-1.8-4.6L6 9l4.2-1.4zM18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9z",
  pulse: "M3 12h4l2-6 4 12 2-6h6",
  logout: "M14 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 16l-4-4 4-4M6 12h10",
  rail: "M4 5h16v14H4zM9 5v14",
  alert: "M12 4l9 16H3zM12 10v4M12 17h.01",
  check: "M5 12.5l4.5 4.5L19 7",
  arrow: "M9 6l6 6-6 6",
  clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2",
  dollar: "M12 3v18M16.5 7.5c-.8-1.2-2.4-2-4.5-2-2.5 0-4 1.2-4 3s1.6 2.6 4 3 4 1.3 4 3.2-1.6 3.3-4.2 3.3c-2.2 0-3.8-.9-4.6-2.2",
  users: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM3 20c.6-3.2 3-5 6-5s5.4 1.8 6 5M16 4.5a3.5 3.5 0 0 1 0 6.5M18 15c1.6.6 2.7 2.4 3 5",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, className = "size-4" }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
