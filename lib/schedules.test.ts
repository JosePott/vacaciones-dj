import { describe, expect, it } from "vitest";

import {
  countConsecutiveWorkDays,
  effectiveShiftMinutes,
  evaluateScheduleWarnings,
  formatMinutesAsHours,
  weeklyWorkMinutes,
  type AssignmentLike,
  type ShiftTemplateLike,
} from "./schedules";

const dayShift: ShiftTemplateLike = {
  id: "shift_t1",
  code: "T1",
  name: "Turno 1",
  startTime: "08:00",
  endTime: "17:00",
  breakMinutes: 60,
};

function assignment(employeeId: string, date: string, shiftTemplate = dayShift): AssignmentLike {
  return { employeeId, date, shiftTemplate };
}

describe("schedules", () => {
  it("calculates effective shift minutes discounting break time", () => {
    expect(effectiveShiftMinutes(dayShift)).toBe(8 * 60);
  });

  it("supports overnight shifts", () => {
    expect(
      effectiveShiftMinutes({
        startTime: "22:00",
        endTime: "07:00",
        breakMinutes: 60,
      }),
    ).toBe(8 * 60);
  });

  it("formats minutes as whole or decimal hours", () => {
    expect(formatMinutesAsHours(2400)).toBe("40 h");
    expect(formatMinutesAsHours(2550)).toBe("42.5 h");
  });

  it("counts consecutive assigned days for one employee", () => {
    const assignments = [
      assignment("emp_1", "2026-07-06"),
      assignment("emp_1", "2026-07-07"),
      assignment("emp_1", "2026-07-08"),
      assignment("emp_2", "2026-07-08"),
    ];

    expect(countConsecutiveWorkDays(assignments, "emp_1", "2026-07-07")).toBe(3);
  });

  it("sums weekly effective minutes from monday to sunday", () => {
    const assignments = [
      assignment("emp_1", "2026-07-06"),
      assignment("emp_1", "2026-07-07"),
      assignment("emp_1", "2026-07-12"),
      assignment("emp_1", "2026-07-13"),
    ];

    expect(weeklyWorkMinutes(assignments, "emp_1", "2026-07-08")).toBe(24 * 60);
  });

  it("warns when an employee exceeds five consecutive assigned days", () => {
    const assignments = [
      assignment("emp_1", "2026-07-06"),
      assignment("emp_1", "2026-07-07"),
      assignment("emp_1", "2026-07-08"),
      assignment("emp_1", "2026-07-09"),
      assignment("emp_1", "2026-07-10"),
      assignment("emp_1", "2026-07-11"),
    ];

    expect(evaluateScheduleWarnings(assignments)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          employeeId: "emp_1",
          date: "2026-07-06",
          type: "CONSECUTIVE_DAYS",
        }),
      ]),
    );
  });

  it("warns when weekly effective hours exceed 40", () => {
    const longShift = { ...dayShift, endTime: "18:00" };
    const assignments = [
      assignment("emp_1", "2026-07-06", longShift),
      assignment("emp_1", "2026-07-07", longShift),
      assignment("emp_1", "2026-07-08", longShift),
      assignment("emp_1", "2026-07-09", longShift),
      assignment("emp_1", "2026-07-10", longShift),
    ];

    expect(evaluateScheduleWarnings(assignments)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          employeeId: "emp_1",
          date: "2026-07-06",
          type: "WEEKLY_HOURS",
        }),
      ]),
    );
  });
});
