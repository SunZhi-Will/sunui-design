"use client";

import type { ReactNode } from "react";

import { Card, CardContent, CardFooter, CardHeader, CardImage, cardAccentClass, type CardTheme, type CardVariant } from "./classic-card";

// 以 inline SVG 做封面，不用外部圖片
const cover = (a: string, b: string) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 450"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="800" height="450" fill="url(#g)"/><circle cx="560" cy="170" r="120" fill="#fff" fill-opacity=".18"/><rect x="140" y="250" width="300" height="120" rx="24" fill="#fff" fill-opacity=".22"/></svg>`,
  )}`;

const variants: { variant: CardVariant; theme: CardTheme; title: string; sub: string; body: string; glow?: boolean }[] = [
  { variant: "outlined", theme: "violet", title: "Outlined", sub: "Clean border", body: "A crisp border for content that needs a clear boundary." },
  { variant: "filled", theme: "cyan", title: "Filled", sub: "Gradient fill", body: "A soft gradient fill for a richer surface." },
  { variant: "elevated", theme: "orange", title: "Elevated", sub: "Deep shadow", body: "A lifted shadow that adds depth and layering.", glow: true },
  { variant: "glass", theme: "violet", title: "Glass", sub: "Frosted glass", body: "A translucent frosted surface with a refined feel." },
  { variant: "gradient", theme: "gradient", title: "Gradient", sub: "Multi-colour", body: "A multi-colour gradient that brings energy.", glow: true },
];

const Heart = () => (
  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

function Section({ title, dark, children }: { title: string; dark?: boolean; children: ReactNode }) {
  return (
    <section className={dark ? "rounded-2xl bg-[#1a1a1a] p-4 sm:p-6" : "rounded-2xl bg-[#f5f5f5] p-4 sm:p-6"}>
      <h3 className={dark ? "mb-4 text-sm font-semibold text-gray-300" : "mb-4 text-sm font-semibold text-gray-600"}>{title}</h3>
      {children}
    </section>
  );
}

export default function ClassicCardDemo() {
  return (
    <div className="flex w-full max-w-5xl flex-col gap-6">
      <Section title="Variants">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {variants.map((v) => (
            <Card key={v.variant} variant={v.variant} theme={v.theme} glow={v.glow} className="min-w-0">
              <CardHeader>
                <h4 className={v.theme === "gradient" ? "bg-linear-to-r from-orange-400 to-pink-500 bg-clip-text text-xl font-bold text-transparent" : "text-xl font-bold"}>
                  {v.title}
                </h4>
                <p className="mt-1 text-sm opacity-70">{v.sub}</p>
              </CardHeader>
              <CardContent>
                <p className="opacity-80">{v.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Dark mode" dark>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {(
            [
              ["outlined", "violet", false],
              ["filled", "cyan", false],
              ["elevated", "orange", true],
              ["glass", "gradient", false],
            ] as const
          ).map(([variant, theme, glow]) => (
            <Card key={variant} variant={variant} theme={theme} mode="dark" glow={glow} className="min-w-0">
              <CardHeader>
                <h4 className="text-xl font-bold">
                  <span className={cardAccentClass(theme, "dark")}>{theme[0].toUpperCase() + theme.slice(1)}</span> {variant}
                </h4>
              </CardHeader>
              <CardContent>
                <p className="opacity-80">A {variant} card on the {theme} theme in dark mode{glow ? ", with glow" : ""}.</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Sizes">
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card size="sm" variant="filled" theme="violet" className="min-w-0">
            <CardHeader><h4 className="text-base font-bold">Small</h4></CardHeader>
            <CardContent><p className="text-sm opacity-80">Compact</p></CardContent>
          </Card>
          <Card size="md" variant="filled" theme="cyan" className="min-w-0">
            <CardHeader><h4 className="text-lg font-bold">Medium</h4></CardHeader>
            <CardContent><p className="text-sm opacity-80">Standard</p></CardContent>
          </Card>
          <Card size="lg" variant="filled" theme="orange" className="min-w-0">
            <CardHeader><h4 className="text-xl font-bold">Large</h4></CardHeader>
            <CardContent><p className="opacity-80">Roomy</p></CardContent>
          </Card>
          <Card size="xl" variant="filled" theme="gradient" glow className="min-w-0">
            <CardHeader>
              <h4 className="bg-linear-to-r from-orange-400 to-pink-500 bg-clip-text text-2xl font-bold text-transparent">Extra Large</h4>
            </CardHeader>
            <CardContent><p className="opacity-80">Spacious</p></CardContent>
          </Card>
        </div>
      </Section>

      <Section title="Loading states">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {(
            [
              ["skeleton", "violet", "Skeleton"],
              ["shimmer", "cyan", "Shimmer"],
              ["overlay", "orange", "Overlay"],
            ] as const
          ).map(([mode, theme, title]) => (
            <Card key={mode} loading loadingMode={mode} theme={theme} variant="filled" className="min-w-0">
              <CardHeader><h4 className="text-xl font-bold">{title} loading</h4></CardHeader>
              <CardContent><p className="opacity-80">Shows the {mode} loading treatment while content is on its way.</p></CardContent>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Product and article">
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
          <Card variant="elevated" theme="violet" size="lg" clickable glow className="group min-w-0" aria-label="Premium Product, view details" onClick={() => {}}>
            <CardImage src={cover("#8b5cf6", "#ec4899")} alt="Premium Product cover" overlay overlayGradient="bottom" />
            <CardHeader showDivider>
              <div className="flex w-full items-start justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="text-2xl font-bold">Premium Product</h4>
                  <p className="mt-1 text-sm opacity-70">High quality collection</p>
                </div>
                <span className="rounded-full bg-violet-500 px-3 py-1 text-xs font-semibold text-white">NEW</span>
              </div>
            </CardHeader>
            <CardContent showDivider>
              <p className="mb-4 leading-relaxed opacity-80">A complete product card with cover, title, description and actions.</p>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm opacity-60">Was</p>
                  <p className="text-lg line-through opacity-50">NT$ 1,999</p>
                </div>
                <div>
                  <p className="text-sm opacity-60">Now</p>
                  <p className="text-3xl font-bold text-violet-600">NT$ 1,299</p>
                </div>
              </div>
            </CardContent>
            <CardFooter justify="between" className="gap-3">
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className="rounded-lg bg-linear-to-r from-violet-500 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-violet-600 hover:to-purple-700 hover:shadow-xl"
              >
                Buy now
              </button>
              <button
                type="button"
                aria-label="Add to wishlist"
                onClick={(e) => e.stopPropagation()}
                className="rounded-lg border border-violet-300 px-4 py-3 text-violet-600 transition-all hover:bg-violet-50"
              >
                <Heart />
              </button>
            </CardFooter>
          </Card>

          <div className="rounded-2xl bg-[#1a1a1a] p-3 sm:p-4">
            <Card variant="gradient" theme="gradient" mode="dark" size="lg" glow className="group min-w-0">
              <CardImage src={cover("#f97316", "#7c3aed")} alt="Dark mode showcase cover" overlay overlayGradient="bottom" />
              <CardHeader showDivider>
                <h4 className="bg-linear-to-r from-orange-400 via-pink-500 to-purple-600 bg-clip-text text-2xl font-bold text-transparent">
                  Dark mode showcase
                </h4>
                <p className="mt-1 text-sm opacity-70">Modern design tuned for dark themes</p>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {["React", "TypeScript", "TailwindCSS"].map((t) => (
                    <span key={t} className="rounded-full bg-white/10 px-3 py-1 text-sm backdrop-blur-xs">
                      {t}
                    </span>
                  ))}
                </div>
              </CardContent>
              <CardFooter justify="between" showDivider className="gap-3">
                <button type="button" className="rounded-lg bg-linear-to-r from-orange-500 via-pink-500 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:opacity-90">
                  Explore more
                </button>
                <button type="button" aria-label="Save" className="rounded-lg border border-white/20 px-4 py-3 transition-all hover:bg-white/10">
                  <Heart />
                </button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </Section>
    </div>
  );
}
