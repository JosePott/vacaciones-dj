const MONTH_VALUE_REGEX = /^(\d{4})-(\d{2})$/;
export const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

type DateParts = { year: number; month: number; day: number };

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function parseIsoDate(value: string): DateParts {
  const normalized = (value ?? "").trim();
  if (!ISO_DATE_REGEX.test(normalized)) {
    throw new Error(`Invalid ISO date string: "${value}"`);
  }

  const [yearStr, monthStr, dayStr] = normalized.split("-");
  const year = Number.parseInt(yearStr, 10);
  const month = Number.parseInt(monthStr, 10);
  const day = Number.parseInt(dayStr, 10);

  return { year, month, day };
}

export function formatIsoDate(parts: DateParts): string {
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

export function formatDisplayDate(isoDate: string): string {
  const { year, month, day } = parseIsoDate(isoDate);
  return `${pad(day)}-${pad(month)}-${year}`;
}

export function isoToEpochDay(isoDate: string): number {
  const { year, month, day } = parseIsoDate(isoDate);
  return Math.floor(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}

export function epochDayToIso(epochDay: number): string {
  const date = new Date(epochDay * MS_PER_DAY);
  return formatIsoDate({
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  });
}

export function dateToIso(date: Date): string {
  return formatIsoDate({
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  });
}

export function startOfMonth(date: Date): Date {
  const out = new Date(date.getFullYear(), date.getMonth(), 1);
  out.setHours(0, 0, 0, 0);
  return out;
}

export function endOfMonth(date: Date): Date {
  const out = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  out.setHours(23, 59, 59, 999);
  return out;
}

export function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export function formatMonthValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export function parseMonthParam(raw?: string): {
  baseDate: Date;
  monthStart: Date;
  monthEnd: Date;
  monthValue: string;
} {
  const now = new Date();
  const normalized = (raw ?? "").trim();
  const match = MONTH_VALUE_REGEX.exec(normalized);
  const year = match ? Number.parseInt(match[1], 10) : now.getFullYear();
  const month = match ? Number.parseInt(match[2], 10) : now.getMonth() + 1;

  const baseDate = new Date(year, month - 1, 1);
  const monthStart = startOfMonth(baseDate);
  const monthEnd = endOfMonth(baseDate);

  return {
    baseDate,
    monthStart,
    monthEnd,
    monthValue: formatMonthValue(baseDate),
  };
}

export function inclusiveDaysBetween(startIso: string, endIso: string): number {
  // Cuenta días naturales incluyendo ambas fechas sin depender del huso horario.
  return isoToEpochDay(endIso) - isoToEpochDay(startIso) + 1;
}

function toUtcDateOnly(input: string | Date): Date {
  if (typeof input === "string") {
    const { year, month, day } = parseIsoDate(input);
    return new Date(Date.UTC(year, month - 1, day));
  }

  return new Date(Date.UTC(input.getUTCFullYear(), input.getUTCMonth(), input.getUTCDate()));
}

export function businessDaysBetween(start: string | Date, end: string | Date): number {
  // Calcula días hábiles (lunes a viernes) de manera inclusiva según normativa laboral chilena (no considera feriados).
  const startDate = toUtcDateOnly(start);
  const endDate = toUtcDateOnly(end);

  let count = 0;
  const current = new Date(startDate);

  while (current <= endDate) {
    const day = current.getUTCDay();
    if (day !== 0 && day !== 6) {
      count += 1;
    }
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return count;
}
