"use client";

import React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { dateToIso, formatDisplayDate } from "@/lib/dates";
import { requestTypeLabels } from "@/lib/leave-requests";

type CalendarEvent = {
  id: string;
  employeeName: string;
  employeeEmail: string | null;
  employeeArea: string;
  employeePosition: string | null;
  startDate: string;
  endDate: string;
  type: "VACATION" | "DAY_OFF";
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
  comment: string | null;
  createdAt: string;
  decisionByEmail: string | null;
  decisionNote: string | null;
};

type CalendarGridProps = {
  monthKey: string; // YYYY-MM-DD for the first day of the active month
  grid: Array<{ key: string }>;
  eventsByDay: Record<string, CalendarEvent[]>;
};

const weekdayLabels = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab", "Dom"];

const statusStyles: Record<
  CalendarEvent["status"],
  { label: string; className: string }
> = {
  PENDING: { label: "Pendiente", className: "bg-amber-500/15 text-amber-200 border border-amber-500/30" },
  APPROVED: { label: "Aprobada", className: "bg-emerald-500/15 text-emerald-200 border border-emerald-500/30" },
  REJECTED: { label: "Rechazada", className: "bg-rose-500/15 text-rose-200 border border-rose-500/30" },
  CANCELED: { label: "Cancelada", className: "bg-[#273440]/60 text-white/70 border border-[#273440]" },
};

export default function CalendarGrid({ monthKey, grid, eventsByDay }: CalendarGridProps) {
  const [selected, setSelected] = React.useState<CalendarEvent | null>(null);

  const currentMonthPrefix = React.useMemo(() => monthKey.slice(0, 7), [monthKey]);
  const todayKey = React.useMemo(() => dateToIso(new Date()), []);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-7 gap-2">
        {weekdayLabels.map((label) => (
          <div
            key={label}
            className="text-center text-xs font-semibold uppercase text-[#5A6473] tracking-wide"
          >
            {label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-3">
        {grid.map(({ key }) => {
          const events = eventsByDay[key] ?? [];

          const isCurrentMonth = key.slice(0, 7) === currentMonthPrefix;
          const isToday = key === todayKey;
          const dayNumber = key.slice(8, 10);

          const baseClasses =
            "min-h-[110px] rounded-xl border border-[#273440]/60 bg-[#03070D]/40 p-3 flex flex-col gap-2";
          const todayClasses = isToday ? "border-emerald-500/40 bg-emerald-500/5" : "";
          const monthOpacity = isCurrentMonth ? "opacity-100" : "opacity-40";

          const pillsToShow = events.slice(0, 2);
          const extra = events.length - pillsToShow.length;

          return (
            <div key={key} className={`${baseClasses} ${todayClasses} ${monthOpacity}`}>
              <div className="flex justify-end text-sm font-semibold text-white/80">
                {dayNumber}
              </div>
              <div className="flex flex-col gap-1">
                {pillsToShow.map((ev, idx) => (
                  <button
                    key={`${key}-${idx}`}
                    type="button"
                    onClick={() => setSelected(ev)}
                    className="truncate rounded-full border border-[#273440] bg-[#273440]/40 px-2 py-1 text-left text-xs text-white/85 transition hover:border-emerald-400/60 hover:text-emerald-50"
                    title={`${ev.employeeName} · ${ev.employeeArea}`}
                  >
                    {requestTypeLabels[ev.type]} · {ev.employeeName}
                  </button>
                ))}
                {extra > 0 ? (
                  <span className="rounded-full border border-[#273440] bg-[#273440]/40 px-2 py-1 text-xs text-white/80">
                    +{extra} más
                  </span>
                ) : null}
                {pillsToShow.length === 0 && extra <= 0 ? (
                  <span className="text-xs text-[#5A6473]">Sin registros</span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
        title="Detalle de solicitud"
        footer={
          selected ? (
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={() => setSelected(null)}>
                Cerrar
              </Button>
              <Link href={`/requests/${selected.id}`}>
                <Button>Ir a solicitud</Button>
              </Link>
            </div>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-white">{selected.employeeName}</p>
              <p className="text-xs text-[#5A6473]">
                {selected.employeeEmail ?? "Sin email"} · {selected.employeeArea}{" "}
                {selected.employeePosition ? `· ${selected.employeePosition}` : ""}
              </p>
            </div>

            <InfoRow label="Fechas">
              {formatDisplayDate(selected.startDate)} – {formatDisplayDate(selected.endDate)}
            </InfoRow>

            <InfoRow label="Tipo">{requestTypeLabels[selected.type]}</InfoRow>

            <InfoRow label="Estado">
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[selected.status].className}`}
              >
                {statusStyles[selected.status].label}
              </span>
            </InfoRow>

            {selected.comment ? <InfoRow label="Comentario">{selected.comment}</InfoRow> : null}

            <InfoRow label="Creada">
              {formatDisplayDate(selected.createdAt.slice(0, 10))}
            </InfoRow>

            {selected.decisionByEmail ? (
              <InfoRow label="Resuelta por">{selected.decisionByEmail}</InfoRow>
            ) : null}

            {selected.decisionNote ? (
              <InfoRow label="Nota de decisión">{selected.decisionNote}</InfoRow>
            ) : null}
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-3 rounded-lg border border-[#273440] bg-[#03070D]/40 px-3 py-2">
      <span className="text-xs font-semibold uppercase tracking-wide text-[#5A6473]">{label}</span>
      <span className="text-sm text-white">{children}</span>
    </div>
  );
}
