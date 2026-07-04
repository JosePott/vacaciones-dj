import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  addMonths,
  dateToIso,
  formatDisplayDate,
  formatMonthValue,
  parseMonthParam,
} from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { effectiveShiftMinutes, formatMinutesAsHours, formatShiftHours } from "@/lib/schedules";

type SearchParams = {
  month?: string | string[];
};

export const dynamic = "force-dynamic";

const monthFormatter = new Intl.DateTimeFormat("es-CL", { month: "long", year: "numeric" });
const weekdayFormatter = new Intl.DateTimeFormat("es-CL", { weekday: "long" });

export default async function MySchedulePage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const resolvedSearch = await searchParams;
  const session = await requireRole("EMPLOYEE");

  const monthRaw = getFirst(resolvedSearch?.month);
  const { baseDate, monthStart, monthEnd, monthValue } = parseMonthParam(monthRaw);
  const monthStartIso = dateToIso(monthStart);
  const monthEndIso = dateToIso(monthEnd);
  const label = monthFormatter.format(baseDate);

  const employee = await prisma.employee.findUnique({
    where: { userId: session.userId },
    select: {
      id: true,
      fullName: true,
      area: true,
      position: true,
      shiftAssignments: {
        where: {
          date: { gte: monthStartIso, lte: monthEndIso },
        },
        orderBy: { date: "asc" },
        select: {
          id: true,
          date: true,
          shiftTemplate: {
            select: {
              code: true,
              name: true,
              startTime: true,
              endTime: true,
              breakMinutes: true,
            },
          },
        },
      },
    },
  });

  if (!employee) {
    return (
      <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
        No encontramos tu perfil de empleado.
      </div>
    );
  }

  const totalMinutes = employee.shiftAssignments.reduce(
    (total, assignment) => total + effectiveShiftMinutes(assignment.shiftTemplate),
    0,
  );

  return (
    <div className="space-y-6">
      <div className="rounded-[1.25rem] border border-blue-300/15 bg-[linear-gradient(135deg,rgba(37,99,235,0.2),rgba(15,23,42,0.2)_55%,rgba(16,185,129,0.12))] p-4 sm:rounded-[1.5rem] sm:p-6">
        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Mis turnos</h1>
        <p className="mt-2 text-sm text-slate-400">
          Horarios asignados para {employee.fullName}. Area: {employee.area}.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Metric title="Turnos del mes" value={employee.shiftAssignments.length.toString()} />
        <Metric title="Horas efectivas" value={formatMinutesAsHours(totalMinutes)} />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="capitalize">{label}</CardTitle>
              <CardDescription>
                Cada turno considera 60 minutos de colacion no pagada.
              </CardDescription>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <Link href={buildMonthLink(monthValue, -1)} className="min-w-0">
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  Mes anterior
                </Button>
              </Link>
              <Link href={buildMonthLink(monthValue, 1)} className="min-w-0">
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  Mes siguiente
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {employee.shiftAssignments.length === 0 ? (
            <div className="rounded-[1.15rem] border border-dashed border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-slate-400">
              No tienes turnos asignados para este mes.
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {employee.shiftAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="rounded-[1rem] border border-white/10 bg-[#070C1C]/72 p-3 sm:rounded-[1.15rem] sm:p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold capitalize text-white">
                        {weekdayFormatter.format(parseIsoAsLocalDate(assignment.date))}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatDisplayDate(assignment.date)}
                      </p>
                    </div>
                    <span className="rounded-full border border-blue-300/35 bg-blue-500/15 px-2.5 py-1 text-xs font-semibold text-blue-100">
                      {assignment.shiftTemplate.code}
                    </span>
                  </div>
                  <p className="mt-4 text-base font-semibold text-white sm:text-lg">
                    {formatShiftHours(assignment.shiftTemplate)}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    {formatMinutesAsHours(effectiveShiftMinutes(assignment.shiftTemplate))} efectivos
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-[1.15rem] border border-white/10 bg-[#070C1C]/72 p-4">
      <p className="text-sm text-slate-400">{title}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function buildMonthLink(month: string, offset: number): string {
  const { monthStart } = parseMonthParam(month);
  const target = addMonths(monthStart, offset);
  return `/my-schedule?month=${formatMonthValue(target)}`;
}

function parseIsoAsLocalDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map((part) => Number.parseInt(part, 10));
  return new Date(year, month - 1, day);
}

function getFirst(param?: string | string[]) {
  if (Array.isArray(param)) return param[0] ?? "";
  return param ?? "";
}
