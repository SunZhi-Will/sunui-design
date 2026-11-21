"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type SocialPlatform = "github" | "x" | "linkedin" | "instagram" | "facebook" | "youtube" | "email" | "link";
export type SocialButtonSize = "sm" | "md" | "lg";
export type TitleSide = "top" | "right" | "bottom" | "left";

// Solid platform colours. Near-black marks (GitHub, X) get a hairline ring in dark mode so they stay visible.
export const socialPlatforms: Record<SocialPlatform, { name: string; color: string; glyph: ReactNode }> = {
  github: {
    name: "GitHub",
    color: "#181717",
    glyph: <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.55v-2.1c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.4-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.66.8.55A11.5 11.5 0 0 0 12 .5z" />,
  },
  x: {
    name: "X",
    color: "#0f0f0f",
    glyph: <path d="M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L1.9 3h6.4l4.4 5.8L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z" />,
  },
  linkedin: {
    name: "LinkedIn",
    color: "#0a66c2",
    glyph: <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45z" />,
  },
  instagram: {
    name: "Instagram",
    color: "#e1306c",
    glyph: <path d="M12 2.2c3.2 0 3.58 0 4.85.07 3.25.15 4.77 1.69 4.92 4.92.06 1.27.07 1.65.07 4.85s0 3.58-.07 4.85c-.15 3.22-1.66 4.77-4.92 4.92-1.27.06-1.65.07-4.85.07s-3.58 0-4.85-.07c-3.26-.15-4.77-1.7-4.92-4.92C2.17 15.58 2.16 15.2 2.16 12s0-3.58.07-4.85C2.38 3.92 3.9 2.38 7.15 2.23 8.42 2.17 8.8 2.2 12 2.2zm0 4.62a5.18 5.18 0 1 0 0 10.36 5.18 5.18 0 0 0 0-10.36zm0 8.54a3.36 3.36 0 1 1 0-6.72 3.36 3.36 0 0 1 0 6.72zm5.39-9.96a1.21 1.21 0 1 0 0 2.42 1.21 1.21 0 0 0 0-2.42z" />,
  },
  facebook: {
    name: "Facebook",
    color: "#1877f2",
    glyph: <path d="M14 8.5V6.6c0-.8.2-1.3 1.4-1.3H17V2.2c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1v2.3H8v3.4h2.6V22H14v-10.1h2.7l.4-3.4H14z" />,
  },
  youtube: {
    name: "YouTube",
    color: "#ff0033",
    glyph: <path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12a31 31 0 0 0 .5 4.8 3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />,
  },
  email: {
    name: "Email",
    color: "#52525b",
    glyph: (
      <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </g>
    ),
  },
  link: {
    name: "Website",
    color: "#0d9488",
    glyph: (
      <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.6 3.6 5.6 3.6 9s-1.1 6.4-3.6 9c-2.5-2.6-3.6-5.6-3.6-9S9.5 5.6 12 3z" />
      </g>
    ),
  },
};

const snappy = { type: "spring", stiffness: 520, damping: 34 } as const;

const sizes: Record<SocialButtonSize, { box: string; glyph: string }> = {
  sm: { box: "size-9", glyph: "size-4" },
  md: { box: "size-10", glyph: "size-[18px]" },
  lg: { box: "size-12", glyph: "size-5" },
};

const sides: Record<TitleSide, { tip: string; arrow: string }> = {
  top: { tip: "bottom-full left-1/2 mb-2.5 -translate-x-1/2 origin-bottom", arrow: "left-1/2 top-full -mt-1 -translate-x-1/2" },
  bottom: { tip: "top-full left-1/2 mt-2.5 -translate-x-1/2 origin-top", arrow: "left-1/2 bottom-full -mb-1 -translate-x-1/2" },
  left: { tip: "right-full top-1/2 mr-2.5 -translate-y-1/2 origin-right", arrow: "top-1/2 left-full -ml-1 -translate-y-1/2" },
  right: { tip: "left-full top-1/2 ml-2.5 -translate-y-1/2 origin-left", arrow: "top-1/2 right-full -mr-1 -translate-y-1/2" },
};

export interface SocialButtonProps {
  platform?: SocialPlatform;
  /** Profile URL. Without it the button renders as a <button> and calls onClick. */
  href?: string;
  onClick?: () => void;
  /** Title shown in the tooltip and used as the accessible name. Defaults to the platform name. */
  title?: string;
  /** Your own glyph (single colour, follows currentColor). Needed when platform is not set. */
  icon?: ReactNode;
  /** Your own fill colour, for brands not in the list. */
  color?: string;
  size?: SocialButtonSize;
  /** hover: tooltip on hover and focus; always: a label that stays; none: name for screen readers only. */
  titleDisplay?: "hover" | "always" | "none";
  titleSide?: TitleSide;
  newTabHint?: string;
  className?: string;
  style?: CSSProperties;
}

/** A solid, platform-coloured round button with a titled tooltip on any side. */
export function SocialButton({
  platform = "link",
  href,
  onClick,
  title,
  icon,
  color,
  size = "md",
  titleDisplay = "hover",
  titleSide = "top",
  newTabHint = "(opens in a new tab)",
  className,
  style,
}: SocialButtonProps) {
  const reduce = useReducedMotion();
  const meta = socialPlatforms[platform];
  const name = title ?? meta.name;
  const fill = color ?? meta.color;
  const external = !!href && !/^(mailto|tel):/.test(href);
  const s = sizes[size];
  const side = sides[titleSide];

  const body = (
    <>
      <span aria-hidden="true" className={cn("flex", s.glyph)}>
        {icon ?? (
          <svg viewBox="0 0 24 24" fill="currentColor" className="size-full">
            {meta.glyph}
          </svg>
        )}
      </span>
      <span className="sr-only">
        {name}
        {external && ` ${newTabHint}`}
      </span>
      {/* always: a quiet caption beside the disc; hover: a dark tooltip with an arrow */}
      {titleDisplay === "always" && (
        <span aria-hidden="true" className={cn("pointer-events-none absolute whitespace-nowrap text-xs font-medium text-muted-foreground", side.tip)}>
          {name}
        </span>
      )}
      {titleDisplay === "hover" && (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute z-20 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background",
            "scale-[0.96] opacity-0 transition-[opacity,scale] duration-150 motion-reduce:scale-100 group-hover/sb:scale-100 group-hover/sb:opacity-100 group-hover/sb:duration-100 group-focus-visible/sb:scale-100 group-focus-visible/sb:opacity-100",
            side.tip,
          )}
        >
          {name}
          <span className={cn("absolute size-2 rotate-45 rounded-[1px] bg-foreground", side.arrow)} />
        </span>
      )}
    </>
  );

  const shared = {
    style: { ...style, "--sb-fill": fill } as CSSProperties,
    whileHover: reduce ? undefined : { y: -2 },
    whileTap: reduce ? undefined : { scale: 0.97, y: 0 },
    transition: snappy,
    className: cn(
      "group/sb relative grid shrink-0 place-items-center rounded-full bg-[color:var(--sb-fill)] text-white outline-none",
      // top highlight on the raised disc; near-black fills get a hairline so they read on dark backgrounds
      "shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_1px_2px_rgb(0_0_0/0.12)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_0_0_1px_rgb(255_255_255/0.12)]",
      "transition-[filter] duration-150 hover:brightness-110 hover:duration-0",
      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      s.box,
      className,
    ),
  };

  return href ? (
    <motion.a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} onClick={onClick} {...shared}>
      {body}
    </motion.a>
  ) : (
    <motion.button type="button" onClick={onClick} {...shared}>
      {body}
    </motion.button>
  );
}

export type SocialButtonItem = Pick<SocialButtonProps, "platform" | "href" | "title" | "icon" | "color">;

export interface SocialButtonsProps extends Omit<SocialButtonProps, keyof SocialButtonItem | "onClick" | "style"> {
  items: SocialButtonItem[];
  /** row, column, or a grid with this many columns. */
  layout?: "row" | "column" | { columns: number };
  "aria-label"?: string;
}

/** A row, column or grid of social buttons sharing one size and tooltip setting. */
export function SocialButtons({ items, layout = "row", className, "aria-label": ariaLabel, ...rest }: SocialButtonsProps) {
  const grid = typeof layout === "object";
  return (
    <ul
      aria-label={ariaLabel}
      className={cn(grid ? "grid w-max gap-3" : "flex flex-wrap gap-3", layout === "column" && "flex-col", className)}
      style={grid ? { gridTemplateColumns: `repeat(${layout.columns}, min-content)` } : undefined}
    >
      {items.map((item, i) => (
        <li key={item.href ?? i} className="flex">
          <SocialButton {...rest} {...item} />
        </li>
      ))}
    </ul>
  );
}
