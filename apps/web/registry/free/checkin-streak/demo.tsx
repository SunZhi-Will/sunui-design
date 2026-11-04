"use client";

import { CheckinStreak, type CheckinDay } from "./checkin-streak";

const week: CheckinDay[] = [
  { label: "Mon", reward: 5 },
  { label: "Tue", reward: 5 },
  { label: "Wed", reward: 10 },
  { label: "Thu", reward: 10 },
  { label: "Fri", reward: 15 },
  { label: "Sat", reward: 15 },
  { label: "Sun", reward: 50 },
];

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export default function CheckinStreakDemo() {
  return (
    <section aria-labelledby="rewards-heading" className="w-full max-w-[52rem] space-y-5">
      <div>
        <h2 id="rewards-heading" className="text-xl font-semibold tracking-tight">
          Rewards
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Check in every day. Points come off your next order, 100 pts = $1.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <CheckinStreak days={week} todayIndex={4} checked={[0, 2, 3]} points={340} onCheckIn={() => wait(600)} />
        <CheckinStreak days={week} todayIndex={2} checked={[0, 1]} defaultCheckedInToday points={1260} />
      </div>
    </section>
  );
}
