"use client";

import { CompareBars, CompareIcon, GapAlert, LockGrid, MatchingRuns, PhoneList, RefreshIcon, StampCard, VersionTimeline } from "./bento-visuals";
import { BentoTile, CountUp, LiveBento } from "./live-bento";

// 排班系統首頁的「更多功能」格子。

const DOT = { alex: "#2563EB", mia: "#16A34A", jordan: "#D97706", tina: "#DB2777", ken: "#7C3AED", ivy: "#0891B2", leo: "#E11D48" };

export default function LiveBentoDemo() {
  return (
    <div className="w-full max-w-5xl min-w-0">
      <LiveBento>
        <BentoTile wide title="Version history" body="Every reshuffle is saved as a new version, and any two can be compared side by side.">
          <VersionTimeline
            versions={[
              { v: "v1", label: "Auto-scheduled", note: "30 slots" },
              { v: "v2", label: "Mia off Wed", note: "1 change" },
              { v: "v3", label: "Alex swaps Fri", note: "2 changes" },
            ]}
            action={
              <>
                <CompareIcon className="size-3.5" />
                Compare v1 and v3
              </>
            }
          />
        </BentoTile>
        <BentoTile title="Deterministic" body="No randomness. The same input always gives the same schedule." delay={80}>
          <MatchingRuns runs={["Run 1", "Run 2"]} value="9f3a2c1e" result="Identical result" />
        </BentoTile>
        <BentoTile title="Explains when it can't" body="When you're short-handed it says which day, which shift, how many, and why.">
          <GapAlert
            cells={[
              { label: "Early", value: "2 / 2" },
              { label: "Mid", value: "2 / 2" },
              { label: "Night", value: "1 / 2", short: true },
            ]}
            message="Saturday night is 1 short: only 1 person is available"
          />
        </BentoTile>
        <BentoTile wide title="Research mode" body="Run Greedy and CP-SAT on the same data and see the quality gap at a glance." delay={80}>
          <CompareBars
            legend={["Greedy", "CP-SAT"]}
            rows={[
              { label: "Fairness", a: 0.71, b: 0.96, format: (v) => v.toFixed(2) },
              { label: "Preferences", a: 0.64, b: 0.91 },
              { label: "Coverage", a: 0.87, b: 1 },
            ]}
          />
        </BentoTile>
        <BentoTile title="Staff view" body="Staff sign in to see only their own shifts and set their availability.">
          <PhoneList
            title="Alex's shifts"
            rows={[
              { label: "Mon", value: "Early" },
              { label: "Tue", value: "Mid" },
              { label: "Wed", value: "Mid" },
              { label: "Thu", value: "Early" },
              { label: "Fri", value: "Night" },
            ]}
          />
        </BentoTile>
        <BentoTile title="Locked shifts" body="Lock the important shifts first. They stay put when you reshuffle." delay={80}>
          <LockGrid
            locked="Mia"
            pool={[
              { name: "Alex", color: DOT.alex },
              { name: "Jordan", color: DOT.jordan },
              { name: "Tina", color: DOT.tina },
              { name: "Ken", color: DOT.ken },
              { name: "Ivy", color: DOT.ivy },
              { name: "Leo", color: DOT.leo },
            ]}
          />
        </BentoTile>
        <BentoTile title="Leave requests" body="Staff send a request, and approving it flows straight into a reshuffle." delay={160}>
          <StampCard
            name="Mia"
            color={DOT.mia}
            kind="Leave request"
            detail="Wed 9/30 Early · family matter"
            stamp="Approved"
            footer={
              <>
                <RefreshIcon className="size-3.5 shrink-0" />
                <span>
                  Minimal reshuffle ran, <CountUp to={1} start duration={400} /> slot changed
                </span>
              </>
            }
          />
        </BentoTile>
      </LiveBento>
    </div>
  );
}
