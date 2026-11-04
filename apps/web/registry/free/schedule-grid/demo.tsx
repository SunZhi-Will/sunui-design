"use client";

import { useMemo, useState } from "react";

import { ScheduleGrid, type ScheduleAssignment, type ScheduleShift } from "./schedule-grid";

const shifts: ScheduleShift[] = [
  { id: 1, name: "Morning", startTime: "07:00", endTime: "15:00", color: "#D97706", requiredEmployees: 2 },
  { id: 2, name: "Evening", startTime: "15:00", endTime: "23:00", color: "#4F46E5", requiredEmployees: 1 },
];

const staff = ["Mia", "Leo", "Ava", "Noah", "Iris"].map((name, i) => ({ id: i + 1, name }));

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// 從本週一開始排 7 天；週三早班缺一人
function buildWeek() {
  const now = new Date();
  const monday = now.getDate() - ((now.getDay() + 6) % 7);
  const dates = Array.from({ length: 7 }, (_, i) => iso(new Date(now.getFullYear(), now.getMonth(), monday + i)));
  const list: ScheduleAssignment[] = [];
  dates.forEach((date, day) =>
    shifts.forEach((shift, s) => {
      const count = (shift.requiredEmployees ?? 0) - (day === 2 && s === 0 ? 1 : 0);
      for (let k = 0; k < count; k++) {
        const p = staff[(day * 2 + s * 3 + k) % staff.length];
        list.push({ id: list.length + 1, date, shiftId: shift.id, employeeId: p.id, employeeName: p.name });
      }
    }),
  );
  return { dates, list };
}

export default function ScheduleGridDemo() {
  const week = useMemo(buildWeek, []);
  const [assignments, setAssignments] = useState(week.list);
  const [selected, setSelected] = useState<ScheduleAssignment | null>(null);

  return (
    <div className="w-full max-w-5xl min-w-0">
      <ScheduleGrid
        dates={week.dates}
        shifts={shifts}
        assignments={assignments}
        selectedAssignmentId={selected?.id ?? null}
        onSelectAssignment={(a) => setSelected((cur) => (cur?.id === a.id ? null : a))}
        onFillShortage={(date, shift) => {
          const taken = new Set(assignments.filter((a) => a.date === date).map((a) => a.employeeId));
          const free = staff.find((p) => !taken.has(p.id)) ?? staff[0];
          setAssignments((list) => [...list, { id: Date.now(), date, shiftId: shift.id, employeeId: free.id, employeeName: free.name, changed: true }]);
        }}
      />
    </div>
  );
}
