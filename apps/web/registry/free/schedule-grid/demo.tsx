"use client";

import { useMemo, useState } from "react";

import { ScheduleGrid, type ScheduleAssignment, type ScheduleShift } from "./schedule-grid";

const shifts: ScheduleShift[] = [
  { id: 1, name: "Morning", startTime: "07:00", endTime: "15:00", color: "#D97706", requiredEmployees: 2 },
  { id: 2, name: "Evening", startTime: "15:00", endTime: "23:00", color: "#4F46E5", requiredEmployees: 2 },
  { id: 3, name: "Night", startTime: "23:00", endTime: "07:00", color: "#0891B2", requiredEmployees: 1 },
];

const staff = [
  { id: 1, name: "Mia" },
  { id: 2, name: "Leo" },
  { id: 3, name: "Ava" },
  { id: 4, name: "Noah" },
  { id: 5, name: "Iris" },
  { id: 6, name: "Owen" },
];

function toDateString(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// 從本週一開始排 7 天，今天會落在格線裡
function buildWeek() {
  const now = new Date();
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => toDateString(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i)));
}

function buildAssignments(dates: string[]) {
  const list: ScheduleAssignment[] = [];
  let id = 1;
  dates.forEach((date, day) => {
    shifts.forEach((shift, s) => {
      const need = shift.requiredEmployees ?? 0;
      // 週三晚班與週六早班各缺一人，示範缺額
      const count = (day === 2 && s === 1) || (day === 5 && s === 0) ? need - 1 : need;
      for (let k = 0; k < count; k++) {
        const person = staff[(day * 2 + s * 3 + k) % staff.length];
        list.push({
          id: id++,
          date,
          shiftId: shift.id,
          employeeId: person.id,
          employeeName: person.name,
          locked: day === 0 && s === 0 && k === 0,
          changed: day === 3 && s === 2,
        });
      }
    });
  });
  return list;
}

export default function ScheduleGridDemo() {
  const dates = useMemo(buildWeek, []);
  const [assignments, setAssignments] = useState(() => buildAssignments(dates));
  const [selected, setSelected] = useState<ScheduleAssignment | null>(null);

  return (
    <div className="flex w-full max-w-5xl min-w-0 flex-col gap-3">
      <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-base font-semibold text-foreground">Front desk, this week</h2>
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {selected ? `Explaining ${selected.employeeName}, ${selected.date}` : "Tap a person to see why they were scheduled"}
        </p>
      </div>
      <ScheduleGrid
        dates={dates}
        shifts={shifts}
        assignments={assignments}
        selectedAssignmentId={selected?.id ?? null}
        onSelectAssignment={(a) => setSelected((cur) => (cur?.id === a.id ? null : a))}
        onFillShortage={(date, shift) => {
          const taken = new Set(assignments.filter((a) => a.date === date).map((a) => a.employeeId));
          const free = staff.find((p) => !taken.has(p.id)) ?? staff[0];
          setAssignments((list) => [
            ...list,
            { id: Date.now(), date, shiftId: shift.id, employeeId: free.id, employeeName: free.name, changed: true },
          ]);
        }}
      />
    </div>
  );
}
