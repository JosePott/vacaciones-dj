import Link from "next/link";
import type { RequestType } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  addMonths,
  dateToIso,
  epochDayToIso,
  formatMonthValue,
  isoToEpochDay,
  parseMonthParam,
} from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { evaluateScheduleWarnings, formatMinutesAsHours, effectiveShiftMinutes } from "@/lib/schedules";
import SchedulePlanner from "./schedule-planner";

type SearchParams = {
  month?: string | string[];
  area?: string | string[];
};

export const dynamic = "force-dynamic";

const monthFormatter = new Intl.DateTimeFormat("es-CL", { month: "long", year: "numeric" });
const weekdayFormatter = new Intl.DateTimeFormat("es-CL", { weekday: "short" });

export default async function SchedulesPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const resolvedSearch = await searchParams;
  await requireRole("HR");

  const monthRaw = getFirst(resolvedSearch?.month);
  const areaFilter = getFirst(resolvedSearch?.area).trim();
  const { baseDate, monthStart, monthEnd, monthValue } = parseMonthParam(monthRaw);
  const monthStartIso = dateToIso(monthStart);
  const monthEndIso = dateToIso(monthEnd);
  const label = monthFormatter.format(baseDate);

  const monthStartDay = isoToEpochDay(monthStartIso);
  const monthEndDay = isoToEpochDay(monthEndIso);
  const validationStartIso = epochDayToIso(monthStartDay - 7);
  const validationEndIso = epochDayToIso(monthEndDay + 7);

  const [employees, shiftTemplates, assignments, approvedTimeOffs, areasRaw] = await Promise.all([
    prisma.employee.findMany({
      where: {
        isActive: true,
        ...(areaFilter ? { area: { equals: areaFilter } } : {}),
      },
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        area: true,
        position: true,
      },
    }),
    prisma.shiftTemplate.findMany({
      where: { isActive: true },
      orderBy: { code: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
        startTime: true,
        endTime: true,
        breakMinutes: true,
      },
    }),
    prisma.workShiftAssignment.findMany({
      where: {
        date: { gte: validationStartIso, lte: validationEndIso },
        employee: {
          isActive: true,
          ...(areaFilter ? { area: { equals: areaFilter } } : {}),
        },
      },
      include: {
        shiftTemplate: {
          select: {
            id: true,
            code: true,
            name: true,
            startTime: true,
            endTime: true,
            breakMinutes: true,
          },
        },
      },
    }),
    prisma.leaveRequest.findMany({
      where: {
        status: "APPROVED",
        startDate: { lte: monthEndIso },
        endDate: { gte: monthStartIso },
        employee: {
          isActive: true,
          ...(areaFilter ? { area: { equals: areaFilter } } : {}),
        },
      },
      select: {
        id: true,
        employeeId: true,
        type: true,
        startDate: true,
        endDate: true,
      },
    }),
    prisma.employee.findMany({
      where: { isActive: true },
      select: { area: true },
    }),
  ]);

  const days = buildMonthDays(monthStart, monthEnd);
  const monthAssignments = assignments
    .filter((assignment) => assignment.date >= monthStartIso && assignment.date <= monthEndIso)
    .map((assignment) => ({
      id: assignment.id,
      employeeId: assignment.employeeId,
      date: assignment.date,
      shiftTemplateId: assignment.shiftTemplateId,
    }));

  const warnings = evaluateScheduleWarnings(assignments).filter((warning) => {
    return warning.date >= monthStartIso && warning.date <= monthEndIso;
  });
  const blockedDays = approvedTimeOffs.flatMap((request) =>
    buildBlockedDays(request, monthStartIso, monthEndIso),
  );

  const totalAssignments = monthAssignments.length;
  const effectiveMinutes = monthAssignments.reduce((total, assignment) => {
    const full = assignments.find((item) => item.id === assignment.id);
    return full ? total + effectiveShiftMinutes(full.shiftTemplate) : total;
  }, 0);

  const areas = Array.from(new Set(areasRaw.map((item) => item.area))).sort((a, b) =>
    a.localeCompare(b),
  );

  return (
    <div className="space-y-6">
      <div className="rounded-[1.5rem] border border-blue-300/15 bg-[linear-gradient(135deg,rgba(37,99,235,0.2),rgba(15,23,42,0.2)_55%,rgba(16,185,129,0.12))] p-6">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Horarios</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Metric title="Turnos asignados" value={totalAssignments.toString()} />
        <Metric title="Horas efectivas" value={formatMinutesAsHours(effectiveMinutes)} />
        <Metric title="Alertas" value={warnings.length.toString()} tone={warnings.length ? "warning" : "normal"} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="capitalize">{label}</CardTitle>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href={buildMonthLink(monthValue, -1, { area: areaFilter })}>
                <Button variant="outline" size="sm">
                  Mes anterior
                </Button>
              </Link>
              <Link href={buildMonthLink(monthValue, 1, { area: areaFilter })}>
                <Button variant="outline" size="sm">
                  Mes siguiente
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <Filters month={monthValue} area={areaFilter} areas={areas} />
          <SchedulePlanner
            employees={employees}
            shiftTemplates={shiftTemplates}
            days={days}
            assignments={monthAssignments}
            warnings={warnings}
            blockedDays={blockedDays}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({
  title,
  value,
  tone = "normal",
}: {
  title: string;
  value: string;
  tone?: "normal" | "warning";
}) {
  return (
    <div className="rounded-[1.15rem] border border-white/10 bg-[#070C1C]/72 p-4">
      <p className="text-sm text-slate-400">{title}</p>
      <p className={tone === "warning" ? "mt-2 text-3xl font-semibold text-amber-200" : "mt-2 text-3xl font-semibold text-white"}>
        {value}
      </p>
    </div>
  );
}

function Filters({ month, area, areas }: { month: string; area: string; areas: string[] }) {
  return (
    <form className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <input type="hidden" name="month" value={month} />
      <div className="flex w-full items-center gap-2 md:w-72">
        <label htmlFor="area" className="text-xs font-semibold uppercase text-[#5A6473]">
          Area
        </label>
        <select
          id="area"
          name="area"
          defaultValue={area}
          className="app-field h-10 w-full rounded-xl px-3 text-sm"
        >
          <option value="">Todas</option>
          {areas.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      <div className="flex gap-2">
        <Button type="submit" variant="default" size="md">
          Aplicar
        </Button>
        <Link href={`/schedules?month=${month}`}>
          <Button type="button" variant="outline" size="md">
            Limpiar
          </Button>
        </Link>
      </div>
    </form>
  );
}

function buildBlockedDays(
  request: { id: string; employeeId: string; type: RequestType; startDate: string; endDate: string },
  monthStartIso: string,
  monthEndIso: string,
) {
  const startDay = Math.max(isoToEpochDay(request.startDate), isoToEpochDay(monthStartIso));
  const endDay = Math.min(isoToEpochDay(request.endDate), isoToEpochDay(monthEndIso));
  const days = [];

  for (let day = startDay; day <= endDay; day += 1) {
    days.push({
      id: request.id,
      employeeId: request.employeeId,
      type: request.type,
      date: epochDayToIso(day),
    });
  }

  return days;
}

function buildMonthDays(monthStart: Date, monthEnd: Date) {
  const days = [];
  const cursor = new Date(monthStart);

  while (cursor <= monthEnd) {
    const date = dateToIso(cursor);
    const day = cursor.getDay();
    days.push({
      date,
      dayNumber: cursor.getDate(),
      weekday: weekdayFormatter.format(cursor).replace(".", ""),
      isWeekend: day === 0 || day === 6,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

function buildMonthLink(month: string, offset: number, params: { area?: string }): string {
  const { monthStart } = parseMonthParam(month);
  const target = addMonths(monthStart, offset);
  const search = new URLSearchParams();
  search.set("month", formatMonthValue(target));
  if (params.area) search.set("area", params.area);
  return `/schedules?${search.toString()}`;
}

function getFirst(param?: string | string[]) {
  if (Array.isArray(param)) return param[0] ?? "";
  return param ?? "";
}
