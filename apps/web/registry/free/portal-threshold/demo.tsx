import { PortalThreshold } from "./portal-threshold";

export default function PortalThresholdDemo() {
  return (
    <section
      aria-labelledby="threshold-hero-title"
      className="w-full overflow-hidden rounded-xl px-5 py-12 sm:px-10"
      style={{ background: "#08080a", color: "#f7f5f0" }}
    >
      <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-12">
        <div className="min-w-0 space-y-6">
          <p className="m-0 font-mono text-xs uppercase tracking-[0.14em]" style={{ color: "#8a8578" }}>
            Studio in preparation
          </p>
          <h1
            id="threshold-hero-title"
            className="m-0 text-4xl font-medium leading-[1.08] tracking-[-0.02em] sm:text-5xl"
          >
            New dimensions, made into places you can enter.
          </h1>
          <p className="m-0 max-w-prose text-base leading-relaxed" style={{ color: "#a8a296" }}>
            We design interactive worlds, tools and sites where two planes line up into one doorway.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#focus"
              className="inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-medium max-md:w-full"
              style={{ background: "linear-gradient(135deg, #e8c874 0%, #d4af37 45%, #b8912c 100%)", color: "#08080a" }}
            >
              See our focus
            </a>
            <a
              href="#about"
              className="inline-flex items-center justify-center rounded-full border px-5 py-2.5 text-sm font-medium"
              style={{ borderColor: "rgba(212, 175, 55, 0.34)", color: "#e8d4a0" }}
            >
              About us
            </a>
          </div>
        </div>
        <div className="min-w-0">
          <PortalThreshold />
        </div>
      </div>
    </section>
  );
}
