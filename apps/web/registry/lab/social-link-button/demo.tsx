"use client";

import { useState } from "react";

import { SocialLinkButton, type SocialLinkButtonProps, type SocialPlatform } from "./social-link-button";

const links: { platform: SocialPlatform; href: string }[] = [
  { platform: "github", href: "https://github.com" },
  { platform: "x", href: "https://x.com" },
  { platform: "linkedin", href: "https://www.linkedin.com" },
  { platform: "instagram", href: "https://www.instagram.com" },
  { platform: "youtube", href: "https://www.youtube.com" },
  { platform: "email", href: "mailto:hello@example.com" },
];

type Variant = NonNullable<SocialLinkButtonProps["variant"]>;
type Tone = NonNullable<SocialLinkButtonProps["tone"]>;

export default function SocialLinkButtonDemo() {
  const [variant, setVariant] = useState<Variant>("expand");
  const [tone, setTone] = useState<Tone>("brand");

  return (
    <div className="w-full max-w-2xl space-y-6">
      <div className="flex flex-wrap gap-4 text-sm">
        <Segment label="Variant" options={["icon", "expand", "pill"]} value={variant} onChange={(v) => setVariant(v as Variant)} />
        <Segment label="Tone" options={["brand", "mono"]} value={tone} onChange={(v) => setTone(v as Tone)} />
      </div>
      <div className="flex min-h-14 flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-5">
        {links.map((l) => (
          <SocialLinkButton key={l.platform} {...l} variant={variant} tone={tone} />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SocialLinkButton platform="github" href="https://github.com" variant="pill" size="sm" label="Star on GitHub" tone={tone} />
        <SocialLinkButton platform="linkedin" href="https://www.linkedin.com" variant="pill" size="lg" label="Connect" tone={tone} />
      </div>
    </div>
  );
}

function Segment({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div role="group" aria-label={label} className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
      <span className="px-2 text-muted-foreground">{label}</span>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={value === o}
          onClick={() => onChange(o)}
          className="rounded-full px-3 py-1 capitalize text-foreground transition-colors hover:bg-muted aria-pressed:bg-primary aria-pressed:text-primary-foreground"
        >
          {o}
        </button>
      ))}
    </div>
  );
}
