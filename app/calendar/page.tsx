import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import CalendarGrid from "./calendar-grid";
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
import type { RequestStatus, RequestType } from "@prisma/client";

type SearchParams = {
  month?: string | string[];
  area?: string | string[];
  name?: string | string[];
};

export const dynamic = "force-dynamic";

const monthFormatter = new Intl.DateTimeFormat("es-CL", { month: "long", year: "numeric" });

type CalendarEvent = {
  id: string;
  employeeName: string;
  employeeEmail: string | null;
  employeeArea: string;
  employeePosition: string | null;
  startDate: string;
  endDate: string;
  type: RequestType;
  status: RequestStatus;
  comment: string | null;
  createdAt: string;
  decisionByEmail: string | null;
  decisionNote: string | null;
};

export default async function CalendarPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const resolvedSearch = await searchParams;

  await requireRole("HR");

  const monthRaw = getFirst(resolvedSearch?.month);
  const areaFilter = getFirst(resolvedSearch?.area).trim();
  const nameFilter = getFirst(resolvedSearch?.name).trim();

  const { baseDate, monthStart, monthEnd, monthValue } = parseMonthParam(monthRaw);
  const label = monthFormatter.format(baseDate);
  const monthStartIso = dateToIso(monthStart);
  const monthEndIso = dateToIso(monthEnd);

  const [requestsRaw, areasRaw] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: {
        status: "APPROVED",
        startDate: { lte: monthEndIso },
        endDate: { gte: monthStartIso },
        ...(areaFilter ? { employee: { area: { equals: areaFilter } } } : {}),
        ...(nameFilter ? { employee: { fullName: { contains: nameFilter } } } : {}),
      },
      include: {
        employee: {
          select: {
            fullName: true,
            area: true,
            position: true,
            user: { select: { email: true } },
          },
        },
      },
      orderBy: { startDate: "asc" },
    }),
    prisma.employee.findMany({ select: { area: true } }),
  ]);

  const deciderIds = Array.from(
    new Set(requestsRaw.map((r) => r.decisionBy).filter(Boolean) as string[]),
  );

  const deciderEmailMap = deciderIds.length
    ? new Map(
        (
          await prisma.user.findMany({
            where: { id: { in: deciderIds } },
            select: { id: true, email: true },
          })
        ).map((u) => [u.id, u.email]),
      )
    : new Map<string, string>();

  const requests: CalendarEvent[] = requestsRaw.map((req) => ({
    id: req.id,
    employeeName: req.employee?.fullName ?? "Empleado",
    employeeEmail: req.employee?.user?.email ?? null,
    employeeArea: req.employee?.area ?? "-",
    employeePosition: req.employee?.position ?? null,
    startDate: req.startDate,
    endDate: req.endDate,
    type: req.type,
    status: req.status,
    comment: req.comment ?? null,
    createdAt: req.createdAt.toISOString(),
    decisionByEmail: req.decisionBy ? deciderEmailMap.get(req.decisionBy) ?? req.decisionBy : null,
    decisionNote: req.decisionNote ?? null,
  }));

  const areas = Array.from(new Set(areasRaw.map((item) => item.area))).sort((a, b) =>
    a.localeCompare(b),
  );

  const dayEntries = mapRequestsToDays(requests, monthStartIso, monthEndIso);
  const eventsByDay = Object.fromEntries(dayEntries) as Record<string, CalendarEvent[]>;
  const monthKey = monthStartIso;
  const grid = buildMonthMatrix(monthStart).map((date) => ({
    key: dateToIso(date),
  }));

  const prevLink = buildMonthLink(monthValue, -1, { area: areaFilter, name: nameFilter });
  const nextLink = buildMonthLink(monthValue, 1, { area: areaFilter, name: nameFilter });

  return (
    <div className="space-y-6">
      <div className="rounded-[1.5rem] border border-blue-300/15 bg-[linear-gradient(135deg,rgba(37,99,235,0.2),rgba(15,23,42,0.2)_55%,rgba(16,185,129,0.12))] p-6">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Calendario</h1>
        <p className="mt-2 text-sm text-slate-400">
          Vista mensual de vacaciones y dias libres aprobados.
        </p>
      </div>

      <Card className="p-6">
        <CardHeader className="p-0 pb-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="capitalize text-white">{label}</CardTitle>
              <CardDescription className="text-[#5A6473]">
                Solicitudes aprobadas que intersectan el mes.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Link href={prevLink}>
                <Button variant="outline" size="sm" className="border-[#273440] text-white hover:bg-[#273440]">
                  ← Mes anterior
                </Button>
              </Link>
              <Link href={nextLink}>
                <Button variant="outline" size="sm" className="border-[#273440] text-white hover:bg-[#273440]">
                  Mes siguiente →
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-0">
          <Filters month={monthValue} area={areaFilter} areas={areas} name={nameFilter} />
          <CalendarGrid
            monthKey={monthKey}
            grid={grid}
            eventsByDay={eventsByDay}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Filters({
  month,
  area,
  areas,
  name,
}: {
  month: string;
  area: string;
  areas: string[];
  name: string;
}) {
  return (
    <form className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:gap-2">
        <input type="hidden" name="month" value={month} />
        <div className="flex w-full items-center gap-2 md:w-56">
          <label htmlFor="area" className="text-xs font-semibold uppercase text-[#5A6473]">
            Área
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

        <div className="flex w-full items-center gap-2 md:w-72">
          <label htmlFor="name" className="text-xs font-semibold uppercase text-[#5A6473]">
            Nombre
          </label>
          <input
            id="name"
            name="name"
            defaultValue={name}
            placeholder="Buscar por nombre"
            className="app-field h-10 w-full rounded-xl px-3 text-sm"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" variant="default" size="md">
          Aplicar
        </Button>
        <Link href={`/calendar?month=${month}`}>
          <Button type="button" variant="outline" size="md" className="border-[#273440] text-white hover:bg-[#273440]">
            Limpiar
          </Button>
        </Link>
      </div>
    </form>
  );
}

function mapRequestsToDays(
  requests: CalendarEvent[],
  monthStartIso: string,
  monthEndIso: string,
): Map<string, CalendarEvent[]> {
  const entries = new Map<string, CalendarEvent[]>();
  const monthStartDay = isoToEpochDay(monthStartIso);
  const monthEndDay = isoToEpochDay(monthEndIso);

  for (const req of requests) {
    const requestStartDay = isoToEpochDay(req.startDate);
    const requestEndDay = isoToEpochDay(req.endDate);
    const start = Math.max(requestStartDay, monthStartDay);
    const end = Math.min(requestEndDay, monthEndDay);

    if (end < start) continue;

    for (let day = start; day <= end; day += 1) {
      const key = epochDayToIso(day);
      const list = entries.get(key) ?? [];
      list.push(req);
      entries.set(key, list);
    }
  }

  return entries;
}

function buildMonthLink(
  month: string,
  offset: number,
  params: { area?: string; name?: string },
): string {
  const { monthStart } = parseMonthParam(month);
  const target = addMonths(monthStart, offset);

  const targetMonth = formatMonthValue(target);

  const search = new URLSearchParams();
  search.set("month", targetMonth);
  if (params.area) search.set("area", params.area);
  if (params.name) search.set("name", params.name);

  return `/calendar?${search.toString()}`;
}

function buildMonthMatrix(monthStart: Date): Date[] {
  const matrix: Date[] = [];
  const first = new Date(monthStart.getFullYear(), monthStart.getMonth(), 1, 12);
  const startDay = (first.getDay() + 6) % 7; // Monday as first (0)
  const cursor = new Date(first);
  cursor.setDate(first.getDate() - startDay);

  for (let i = 0; i < 42; i += 1) {
    matrix.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return matrix;
}

function getFirst(param?: string | string[]) {
  if (Array.isArray(param)) return param[0] ?? "";
  return param ?? "";
}
