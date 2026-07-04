import Link from "next/link";
import React from "react";
import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { dateToIso, formatDisplayDate, inclusiveDaysBetween } from "@/lib/dates";
import { businessDaysBetweenWithChileHolidays } from "@/lib/holidays";
import { requestDaysLabel, requestTypeLabels } from "@/lib/leave-requests";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import type { RequestStatus } from "@prisma/client";

type Params = { id: string };

export const dynamic = "force-dynamic";

const statusStyles: Record<RequestStatus, { label: string; className: string }> = {
  PENDING: { label: "Pendiente", className: "bg-amber-500/15 text-amber-200 border border-amber-500/30" },
  APPROVED: { label: "Aprobada", className: "bg-emerald-500/15 text-emerald-200 border border-emerald-500/30" },
  REJECTED: { label: "Rechazada", className: "bg-rose-500/15 text-rose-200 border border-rose-500/30" },
  CANCELED: { label: "Cancelada", className: "bg-[#273440]/60 text-white/70 border border-[#273440]" },
};

export default async function RequestDetailPage({
  params,
}: {
  params: Promise<Params> | Params;
}) {
  const resolvedParams = await params;

  await requireRole("HR");

  const id = resolvedParams?.id;
  if (!id) {
    redirect("/requests");
  }

  const request = await prisma.leaveRequest.findUnique({
    where: { id },
    include: {
      employee: { select: { fullName: true, area: true, position: true, user: { select: { email: true } } } },
    },
  });

  if (!request) {
    redirect("/requests");
  }

  const requestDays =
    request.type === "VACATION"
      ? await businessDaysBetweenWithChileHolidays(request.startDate, request.endDate)
      : inclusiveDaysBetween(request.startDate, request.endDate);

  const decisionByEmail = request.decisionBy
    ? (
        await prisma.user.findUnique({
          where: { id: request.decisionBy },
          select: { email: true },
        })
      )?.email ?? null
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-white">Solicitud</h1>
          <p className="text-sm text-[#5A6473]">Detalle de la solicitud seleccionada.</p>
        </div>
        <Link
          href="/requests"
          className="text-sm font-semibold text-white underline decoration-[#273440] hover:decoration-[#424E59]"
        >
          Volver a solicitudes
        </Link>
      </div>

      <Card className="rounded-2xl border border-[#273440] bg-[#0C1726] shadow-lg shadow-black/20">
        <CardHeader>
          <CardTitle className="text-white">{request.employee?.fullName ?? "Empleado"}</CardTitle>
          <CardDescription className="text-[#5A6473]">
            {request.employee?.area ?? "-"} · {request.employee?.position ?? "Sin cargo"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Info label="Email" value={request.employee?.user?.email ?? "-"} />
          <Info label="Tipo" value={requestTypeLabels[request.type]} />
          <Info
            label="Fechas"
            value={`${formatDisplayDate(request.startDate)} – ${formatDisplayDate(request.endDate)}`}
          />
          <Info label="Dias" value={requestDaysLabel(request.type, requestDays)} />
          <Info
            label="Estado"
            value={
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[request.status].className}`}
              >
                {statusStyles[request.status].label}
              </span>
            }
          />
          <Info label="Creada" value={formatDisplayDate(dateToIso(request.createdAt))} />
          {request.comment ? <Info label="Comentario" value={request.comment} /> : null}
          {decisionByEmail ? <Info label="Resuelta por" value={decisionByEmail} /> : null}
          {request.decisionNote ? <Info label="Nota de decisión" value={request.decisionNote} /> : null}
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between rounded-lg border border-[#273440] bg-[#03070D]/40 px-4 py-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-[#5A6473]">{label}</span>
      <span className="text-sm font-semibold text-white text-right">{value}</span>
    </div>
  );
}
