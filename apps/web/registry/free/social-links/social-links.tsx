"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState, type CSSProperties, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export type SocialPlatform = "github" | "x" | "linkedin" | "instagram" | "facebook" | "youtube" | "email" | "link";
export type SocialLinksVariant = "icon" | "pill" | "expanding";
export type TooltipSide = "top" | "right" | "bottom" | "left";

export interface SocialLinkProps {
  platform: SocialPlatform;
  href: string;
  /** Visible label and accessible name. Defaults to the platform name. */
  label?: string;
  /** Replaces the built-in glyph. Use a single-colour icon that follows currentColor. */
  icon?: ReactNode;
  /** icon: round button; pill: icon and label; expanding: the label slides out on hover or focus. */
  variant?: SocialLinksVariant;
  size?: "sm" | "md";
  /** Lets the platform colour appear on the glyph, only on hover and focus. Off by default (monochrome). */
  brand?: boolean;
  /** Tooltip side, or false for none. Defaults to "top" for the icon variant and none otherwise. */
  tooltip?: TooltipSide | false;
  /** Open in a new tab. Defaults to true for everything except mailto: and tel: links. */
  newTab?: boolean;
  /** Screen reader hint added to links that open a new tab. */
  newTabHint?: string;
  className?: string;
}

// Single-colour marks, 24px grid, drawn with currentColor. GitHub, X and email have no brand colour:
// their official colour is near black and would vanish in dark mode, so they stay on the foreground.
const platforms: Record<SocialPlatform, { name: string; color?: string; glyph: ReactNode }> = {
  github: {
    name: "GitHub",
    glyph: <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.55v-2.1c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.4-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.66.8.55A11.5 11.5 0 0 0 12 .5z" />,
  },
  x: {
    name: "X",
    glyph: <path d="M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L1.9 3h6.4l4.4 5.8L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z" />,
  },
  linkedin: {
    name: "LinkedIn",
    color: "#0a66c2",
    glyph: <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45z" />,
  },
  instagram: {
    name: "Instagram",
    color: "#e4405f",
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
    glyph: (
      <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m4 7 8 6 8-6" />
      </g>
    ),
  },
  link: {
    name: "Website",
    glyph: (
      <g fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3c2.5 2.6 3.6 5.6 3.6 9s-1.1 6.4-3.6 9c-2.5-2.6-3.6-5.6-3.6-9S9.5 5.6 12 3z" />
      </g>
    ),
  },
};

const gentle = { type: "spring", stiffness: 240, damping: 30 } as const;

// e1 surface: hairline plus a near-invisible shadow; dark mode uses the top highlight instead
const surface =
  "bg-card shadow-[0_0_0_1px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.05)] dark:shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_0_0_1px_rgb(255_255_255/0.08)]";

const sizes = {
  sm: { box: "h-9 px-2.5", glyph: "size-4", text: "text-[13px]" },
  md: { box: "h-10 px-[11px]", glyph: "size-[18px]", text: "text-sm" },
};

const tipSide: Record<TooltipSide, string> = {
  top: "bottom-full left-1/2 mb-2 -translate-x-1/2 origin-bottom",
  bottom: "top-full left-1/2 mt-2 -translate-x-1/2 origin-top",
  left: "right-full top-1/2 mr-2 -translate-y-1/2 origin-right",
  right: "left-full top-1/2 ml-2 -translate-y-1/2 origin-left",
};

/** One social profile link: a round button, a pill, or a round button whose label slides out. */
export function SocialLink({
  platform,
  href,
  label,
  icon,
  variant = "icon",
  size = "md",
  brand = false,
  tooltip,
  newTab,
  newTabHint = "(opens in a new tab)",
  className,
}: SocialLinkProps) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const meta = platforms[platform];
  const name = label ?? meta.name;
  const s = sizes[size];
  const external = newTab ?? !/^(mailto|tel):/.test(href);
  const tip = tooltip === undefined ? (variant === "icon" ? "top" : false) : tooltip;
  const expanded = variant === "pill" || (variant === "expanding" && open);
  const brandColor = brand ? meta.color : undefined;

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
      onPointerLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      style={brandColor ? ({ "--sl-brand": brandColor } as CSSProperties) : undefined}
      className={cn(
        "group/sl relative inline-flex shrink-0 items-center rounded-full font-medium text-muted-foreground outline-none",
        "transition-[color,background-color,scale] duration-150 hover:bg-muted hover:text-foreground hover:duration-0 focus-visible:text-foreground",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-safe:active:scale-[0.97]",
        surface,
        s.box,
        s.text,
        className,
      )}
    >
      {/* the glyph is the anchor: it never moves while the label opens beside it */}
      <span
        aria-hidden="true"
        className={cn(
          "flex shrink-0 transition-colors duration-150 group-hover/sl:duration-0",
          brandColor && "group-hover/sl:text-[color:var(--sl-brand)] group-focus-visible/sl:text-[color:var(--sl-brand)]",
          s.glyph,
        )}
      >
        {icon ?? (
          <svg viewBox="0 0 24 24" fill="currentColor" className="size-full">
            {meta.glyph}
          </svg>
        )}
      </span>

      {variant === "icon" ? (
        <span className="sr-only">{name}</span>
      ) : (
        <motion.span
          className="overflow-hidden whitespace-nowrap"
          initial={false}
          animate={{ width: expanded ? "auto" : 0 }}
          transition={reduce ? { duration: 0 } : gentle}
        >
          <motion.span
            className="block pl-2 pr-1.5"
            initial={false}
            animate={{ opacity: expanded ? 1 : 0 }}
            transition={reduce ? { duration: 0 } : { duration: expanded ? 0.18 : 0.1, delay: expanded ? 0.06 : 0 }}
          >
            {name}
          </motion.span>
        </motion.span>
      )}
      {external && <span className="sr-only"> {newTabHint}</span>}

      {tip && (
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute z-10 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background",
            "scale-[0.96] opacity-0 transition-[opacity,scale] duration-150 motion-reduce:scale-100",
            "group-hover/sl:scale-100 group-hover/sl:opacity-100 group-hover/sl:duration-100 group-focus-visible/sl:scale-100 group-focus-visible/sl:opacity-100",
            tipSide[tip],
          )}
        >
          {name}
        </span>
      )}
    </a>
  );
}

export type SocialLinkItem = Pick<SocialLinkProps, "platform" | "href" | "label" | "icon">;

export interface SocialLinksProps extends Omit<SocialLinkProps, "platform" | "href" | "label" | "icon" | "className"> {
  links: SocialLinkItem[];
  /** Accessible name for the list, for example "Social profiles". */
  "aria-label"?: string;
  /** Lay the links out in a column, for a sidebar. */
  vertical?: boolean;
  className?: string;
}

/** A row (or column) of social links that share one variant, size, colour mode and tooltip side. */
export function SocialLinks({ links, vertical = false, className, "aria-label": ariaLabel, ...item }: SocialLinksProps) {
  return (
    <ul aria-label={ariaLabel} className={cn("flex flex-wrap gap-2", vertical ? "flex-col items-start" : "items-center", className)}>
      {links.map((link) => (
        <li key={link.href} className="flex">
          <SocialLink {...item} {...link} />
        </li>
      ))}
    </ul>
  );
}
