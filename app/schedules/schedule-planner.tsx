"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Eraser } from "lucide-react";
import { toast } from "sonner";

import { assignWorkShift, clearWorkShift } from "@/app/actions/schedules";
import { Button } from "@/components/ui/button";
import {
  requestTypeBlocksScheduleMessage,
  requestTypeScheduleLabels,
} from "@/lib/leave-requests";
import { formatShiftHours } from "@/lib/schedules";

type EmployeeRow = {
  id: string;
  fullName: string;
  area: string;
  position: string | null;
};

type ShiftTemplateRow = {
  id: string;
  code: string;
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
};

type DayColumn = {
  date: string;
  dayNumber: number;
  weekday: string;
  isWeekend: boolean;
};

type AssignmentRow = {
  id: string;
  employeeId: string;
  date: string;
  shiftTemplateId: string;
};

type WarningRow = {
  employeeId: string;
  date: string;
  type: string;
  message: string;
};

type RequestType = "VACATION" | "DAY_OFF";

type BlockedDayRow = {
  id: string;
  employeeId: string;
  type: RequestType;
  date: string;
};

export default function SchedulePlanner({
  employees,
  shiftTemplates,
  days,
  assignments,
  warnings,
  blockedDays,
}: {
  employees: EmployeeRow[];
  shiftTemplates: ShiftTemplateRow[];
  days: DayColumn[];
  assignments: AssignmentRow[];
  warnings: WarningRow[];
  blockedDays: BlockedDayRow[];
}) {
  const router = useRouter();
  const [pendingCell, setPendingCell] = React.useState<string | null>(null);
  const [selectedShiftId, setSelectedShiftId] = React.useState(shiftTemplates[0]?.id ?? "");

  const assignmentMap = React.useMemo(() => {
    return new Map(assignments.map((item) => [`${item.employeeId}:${item.date}`, item]));
  }, [assignments]);

  const warningMap = React.useMemo(() => {
    const map = new Map<string, WarningRow[]>();
    for (const warning of warnings) {
      const key = `${warning.employeeId}:${warning.date}`;
      const list = map.get(key) ?? [];
      list.push(warning);
      map.set(key, list);
    }
    return map;
  }, [warnings]);

  const blockedDayMap = React.useMemo(() => {
    return new Map(blockedDays.map((item) => [`${item.employeeId}:${item.date}`, item]));
  }, [blockedDays]);

  const shiftMap = React.useMemo(() => {
    return new Map(shiftTemplates.map((item) => [item.id, item]));
  }, [shiftTemplates]);

  async function assign(employeeId: string, date: string, shiftTemplateId: string) {
    const key = `${employeeId}:${date}`;
    const blockedDay = blockedDayMap.get(key);
    if (blockedDay) {
      toast.error(requestTypeBlocksScheduleMessage(blockedDay.type));
      return;
    }

    setPendingCell(key);
    const result = await assignWorkShift({ employeeId, date, shiftTemplateId });
    setPendingCell(null);

    if (!result.ok) {
      toast.error(result.error ?? "No se pudo asignar el turno.");
      return;
    }

    router.refresh();
  }

  async function clear(employeeId: string, date: string) {
    const key = `${employeeId}:${date}`;
    setPendingCell(key);
    const result = await clearWorkShift({ employeeId, date });
    setPendingCell(null);

    if (!result.ok) {
      toast.error(result.error ?? "No se pudo borrar el turno.");
      return;
    }

    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 rounded-[1.15rem] border border-white/10 bg-[#070C1C]/72 p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {shiftTemplates.map((shift) => (
            <button
              key={shift.id}
              type="button"
              draggable
              onDragStart={(event) => event.dataTransfer.setData("text/plain", shift.id)}
              onClick={() => setSelectedShiftId(shift.id)}
              className={[
                "h-12 rounded-xl border px-3 text-left text-sm transition",
                selectedShiftId === shift.id
                  ? "border-blue-300/60 bg-blue-500/20 text-white"
                  : "border-white/10 bg-white/[0.04] text-slate-200 hover:border-blue-300/45",
              ].join(" ")}
              title={`${shift.name}: ${formatShiftHours(shift)} con ${shift.breakMinutes} min de colacion`}
            >
              <span className="block font-semibold">{shift.code}</span>
              <span className="block text-xs text-slate-400">{formatShiftHours(shift)}</span>
            </button>
          ))}
        </div>
        <div className="text-sm text-slate-400">
          {warnings.length} alerta{warnings.length === 1 ? "" : "s"} activa
          {warnings.length === 1 ? "" : "s"}
        </div>
      </div>

      <div className="overflow-auto rounded-[1.15rem] border border-white/10 bg-[#050A18]/80">
        <table className="min-w-max border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="sticky left-0 z-20 w-56 border-b border-r border-white/10 bg-[#0A1024] px-3 py-3 text-left text-xs font-semibold uppercase text-slate-400">
                Empleado
              </th>
              {days.map((day) => (
                <th
                  key={day.date}
                  className={[
                    "w-24 border-b border-r border-white/10 px-2 py-2 text-center text-xs font-semibold uppercase text-slate-400",
                    day.isWeekend ? "bg-amber-500/8" : "bg-white/[0.03]",
                  ].join(" ")}
                >
                  <span className="block text-white">{day.dayNumber}</span>
                  <span>{day.weekday}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id}>
                <td className="sticky left-0 z-10 w-56 border-b border-r border-white/10 bg-[#0A1024] px-3 py-3 align-top">
                  <span className="block font-semibold text-white">{employee.fullName}</span>
                  <span className="block text-xs text-slate-500">
                    {employee.area}
                    {employee.position ? ` - ${employee.position}` : ""}
                  </span>
                </td>
                {days.map((day) => {
                  const key = `${employee.id}:${day.date}`;
                  const assignment = assignmentMap.get(key);
                  const shift = assignment ? shiftMap.get(assignment.shiftTemplateId) : null;
                  const cellWarnings = warningMap.get(key) ?? [];
                  const isPending = pendingCell === key;
                  const blockedDay = blockedDayMap.get(key);
                  const isBlocked = !!blockedDay;
                  const blockedLabel = blockedDay
                    ? requestTypeScheduleLabels[blockedDay.type]
                    : null;

                  return (
                    <td
                      key={day.date}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={(event) => {
                        event.preventDefault();
                        if (blockedDay) {
                          toast.error(requestTypeBlocksScheduleMessage(blockedDay.type));
                          return;
                        }
                        const shiftTemplateId = event.dataTransfer.getData("text/plain");
                        if (shiftTemplateId) void assign(employee.id, day.date, shiftTemplateId);
                      }}
                      onClick={() => {
                        if (blockedDay) {
                          toast.error(requestTypeBlocksScheduleMessage(blockedDay.type));
                          return;
                        }
                        if (!assignment && selectedShiftId) {
                          void assign(employee.id, day.date, selectedShiftId);
                        }
                      }}
                      className={[
                        "h-20 w-24 border-b border-r border-white/10 p-1 align-top transition",
                        day.isWeekend ? "bg-amber-500/[0.04]" : "bg-white/[0.015]",
                        cellWarnings.length ? "bg-amber-500/[0.09]" : "",
                        isBlocked ? "bg-rose-500/[0.08]" : "",
                        !assignment && !isBlocked ? "cursor-copy hover:bg-blue-400/[0.08]" : "",
                        isBlocked ? "cursor-not-allowed" : "",
                      ].join(" ")}
                    >
                      {shift ? (
                        <div
                          className={[
                            "group relative flex h-full min-h-16 flex-col justify-between rounded-lg border p-2",
                            isBlocked
                              ? "border-rose-300/50 bg-rose-500/12"
                              : cellWarnings.length
                              ? "border-amber-400/50 bg-amber-400/12"
                              : "border-blue-300/35 bg-blue-500/15",
                            isPending ? "opacity-60" : "",
                          ].join(" ")}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-1">
                              <span className="font-semibold text-white">{shift.code}</span>
                              {cellWarnings.length || isBlocked ? (
                                <AlertTriangle
                                  className={[
                                    "h-4 w-4 shrink-0",
                                    isBlocked ? "text-rose-200" : "text-amber-300",
                                  ].join(" ")}
                                />
                              ) : null}
                            </div>
                            <span className="mt-1 block text-[11px] leading-tight text-slate-300">
                              {shift.startTime}-{shift.endTime}
                            </span>
                            {blockedLabel ? (
                              <span className="mt-1 block text-[11px] font-medium leading-tight text-rose-100">
                                {blockedLabel}
                              </span>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              void clear(employee.id, day.date);
                            }}
                            className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-md border border-white/10 text-slate-400 opacity-80 transition hover:border-rose-300/50 hover:bg-rose-400/10 hover:text-rose-100"
                            aria-label="Borrar turno"
                            title="Borrar turno"
                            disabled={isPending}
                          >
                            <Eraser className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div
                          className={[
                            "grid h-full min-h-16 place-items-center rounded-lg border border-dashed border-white/8 text-xs text-slate-600",
                            isBlocked
                              ? "border-rose-300/30 bg-rose-500/10 text-rose-100"
                              : "",
                            isPending ? "opacity-60" : "",
                          ].join(" ")}
                        >
                          {blockedLabel ?? "Libre"}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {warnings.length ? (
        <div className="rounded-[1.15rem] border border-amber-400/25 bg-amber-400/10 p-4">
          <h2 className="text-sm font-semibold text-amber-100">Alertas de planificacion</h2>
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {warnings.slice(0, 12).map((warning, index) => {
              const employee = employees.find((item) => item.id === warning.employeeId);
              return (
                <div
                  key={`${warning.employeeId}-${warning.date}-${warning.type}-${index}`}
                  className="rounded-xl border border-amber-300/20 bg-[#090E20]/70 px-3 py-2 text-sm text-amber-100"
                >
                  <span className="font-semibold">{employee?.fullName ?? "Empleado"}</span>
                  <span className="text-amber-200/70"> · {warning.date}</span>
                  <p className="mt-1 text-xs text-amber-100/80">{warning.message}</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button type="button" variant="outline" onClick={() => router.refresh()}>
          Actualizar
        </Button>
      </div>
    </div>
  );
}
