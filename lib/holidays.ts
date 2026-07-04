import { epochDayToIso, isoToEpochDay, parseIsoDate } from "./dates";

type BoostrHoliday = {
  date: string;
  title?: string;
  type?: string;
  inalienable?: boolean;
  extra?: string;
};

type BoostrHolidayResponse = {
  status: string;
  data?: BoostrHoliday[];
};

const HOLIDAYS_API_BASE_URL = "https://api.boostr.cl/holidays";
const holidayCache = new Map<number, Promise<Set<string>>>();

function yearsBetween(startIso: string, endIso: string): number[] {
  const start = parseIsoDate(startIso);
  const end = parseIsoDate(endIso);
  const years: number[] = [];

  for (let year = start.year; year <= end.year; year += 1) {
    years.push(year);
  }

  return years;
}

async function fetchChileHolidaysByYear(year: number): Promise<Set<string>> {
  const response = await fetch(`${HOLIDAYS_API_BASE_URL}/${year}.json`, {
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!response.ok) {
    throw new Error(`Boostr holidays API returned ${response.status} for ${year}`);
  }

  const body = (await response.json()) as BoostrHolidayResponse;
  if (body.status !== "success" || !Array.isArray(body.data)) {
    throw new Error(`Invalid Boostr holidays API response for ${year}`);
  }

  return new Set(body.data.map((holiday) => holiday.date));
}

async function getChileHolidaysByYear(year: number): Promise<Set<string>> {
  const cached = holidayCache.get(year);
  if (cached) return cached;

  const promise = fetchChileHolidaysByYear(year).catch((error) => {
    holidayCache.delete(year);
    console.error("[holidays] No se pudieron obtener feriados de Chile:", error);
    return new Set<string>();
  });

  holidayCache.set(year, promise);
  return promise;
}

export async function getChileHolidayDatesForRange(
  startIso: string,
  endIso: string,
): Promise<Set<string>> {
  const years = yearsBetween(startIso, endIso);
  const holidaySets = await Promise.all(years.map((year) => getChileHolidaysByYear(year)));
  return new Set(holidaySets.flatMap((holidays) => Array.from(holidays)));
}

export async function businessDaysBetweenWithChileHolidays(
  startIso: string,
  endIso: string,
): Promise<number> {
  const holidays = await getChileHolidayDatesForRange(startIso, endIso);
  let count = 0;

  for (let day = isoToEpochDay(startIso); day <= isoToEpochDay(endIso); day += 1) {
    const iso = epochDayToIso(day);
    const date = new Date(day * 24 * 60 * 60 * 1000);
    const weekday = date.getUTCDay();

    if (weekday !== 0 && weekday !== 6 && !holidays.has(iso)) {
      count += 1;
    }
  }

  return count;
}
