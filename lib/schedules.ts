import { epochDayToIso, isoToEpochDay } from "@/lib/dates";

export const WEEKLY_WORK_LIMIT_MINUTES = 40 * 60;
export const MAX_CONSECUTIVE_WORK_DAYS = 5;

export type ShiftTemplateLike = {
  id: string;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
};

export type AssignmentLike = {
  employeeId: string;
  date: string;
  shiftTemplate: ShiftTemplateLike;
};

export type ScheduleWarning = {
  employeeId: string;
  date: string;
  type: "CONSECUTIVE_DAYS" | "WEEKLY_HOURS";
  message: string;
};

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map((part) => Number.parseInt(part, 10));
  return hours * 60 + minutes;
}

export function effectiveShiftMinutes(shift: Pick<ShiftTemplateLike, "startTime" | "endTime" | "breakMinutes">): number {
  const start = timeToMinutes(shift.startTime);
  let end = timeToMinutes(shift.endTime);
  if (end <= start) end += 24 * 60;
  return Math.max(0, end - start - shift.breakMinutes);
}

export function formatShiftHours(shift: Pick<ShiftTemplateLike, "startTime" | "endTime">): string {
  return `${shift.startTime} - ${shift.endTime}`;
}

export function formatMinutesAsHours(minutes: number): string {
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours} h` : `${hours.toFixed(1)} h`;
}

function mondayOfWeek(epochDay: number): number {
  const date = new Date(epochDay * 24 * 60 * 60 * 1000);
  const day = date.getUTCDay();
  const offset = day === 0 ? 6 : day - 1;
  return epochDay - offset;
}

function buildWorkSet(assignments: AssignmentLike[], employeeId: string): Set<number> {
  return new Set(
    assignments
      .filter((assignment) => assignment.employeeId === employeeId)
      .map((assignment) => isoToEpochDay(assignment.date)),
  );
}

export function countConsecutiveWorkDays(assignments: AssignmentLike[], employeeId: string, date: string): number {
  const workDays = buildWorkSet(assignments, employeeId);
  const target = isoToEpochDay(date);

  let start = target;
  while (workDays.has(start - 1)) start -= 1;

  let end = target;
  while (workDays.has(end + 1)) end += 1;

  return end - start + 1;
}

export function weeklyWorkMinutes(assignments: AssignmentLike[], employeeId: string, date: string): number {
  const target = isoToEpochDay(date);
  const weekStart = mondayOfWeek(target);
  const weekEnd = weekStart + 6;

  return assignments
    .filter((assignment) => {
      const day = isoToEpochDay(assignment.date);
      return assignment.employeeId === employeeId && day >= weekStart && day <= weekEnd;
    })
    .reduce((total, assignment) => total + effectiveShiftMinutes(assignment.shiftTemplate), 0);
}

export function evaluateScheduleWarnings(assignments: AssignmentLike[]): ScheduleWarning[] {
  const warnings: ScheduleWarning[] = [];
  const seen = new Set<string>();

  for (const assignment of assignments) {
    const consecutiveDays = countConsecutiveWorkDays(
      assignments,
      assignment.employeeId,
      assignment.date,
    );

    if (consecutiveDays > MAX_CONSECUTIVE_WORK_DAYS) {
      const key = `${assignment.employeeId}:${assignment.date}:CONSECUTIVE_DAYS`;
      if (!seen.has(key)) {
        warnings.push({
          employeeId: assignment.employeeId,
          date: assignment.date,
          type: "CONSECUTIVE_DAYS",
          message: `Lleva ${consecutiveDays} dias seguidos con turno asignado.`,
        });
        seen.add(key);
      }
    }

    const weeklyMinutes = weeklyWorkMinutes(assignments, assignment.employeeId, assignment.date);
    if (weeklyMinutes > WEEKLY_WORK_LIMIT_MINUTES) {
      const weekKey = mondayOfWeek(isoToEpochDay(assignment.date));
      const key = `${assignment.employeeId}:${weekKey}:WEEKLY_HOURS`;
      if (!seen.has(key)) {
        warnings.push({
          employeeId: assignment.employeeId,
          date: epochDayToIso(weekKey),
          type: "WEEKLY_HOURS",
          message: `Semana con ${formatMinutesAsHours(weeklyMinutes)} efectivos; supera 40 h.`,
        });
        seen.add(key);
      }
    }
  }

  return warnings;
}
