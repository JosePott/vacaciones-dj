import Link from "next/link";
import type { ReactNode } from "react";
import type { RequestStatus, RequestType } from "@prisma/client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DarkTable,
  DarkTableWrapper,
  darkTdClass,
  darkThClass,
  darkTrClass,
  darkTheadClass,
} from "@/components/ui/dark-table";
import { formatDisplayDate, dateToIso, inclusiveDaysBetween } from "@/lib/dates";
import { businessDaysBetweenWithChileHolidays } from "@/lib/holidays";
import { requestDaysLabel, requestTypeLabels } from "@/lib/leave-requests";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import DecisionActions from "./decision-actions";

type StatusFilter = "PENDING" | "APPROVED" | "REJECTED" | "ALL";
type SearchParams = { status?: string; area?: string };
type RequestItem = {
  id: string;
  status: RequestStatus;
  type: RequestType;
  startDate: string;
  endDate: string;
  createdAt: Date;
  comment: string | null;
  decisionNote: string | null;
  requestDays: number;
  employee: { fullName: string; area: string } | null;
};

const statusLabels: Record<RequestStatus, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
  CANCELED: "Cancelada",
};

const statusStyles: Record<RequestStatus, string> = {
  PENDING: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
  APPROVED: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
  REJECTED: "bg-rose-500/15 text-rose-300 border border-rose-500/30",
  CANCELED: "bg-[#273440]/60 text-white/70 border border-[#273440]",
};

export default async function RequestsPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams> | SearchParams;
}) {
  const resolvedSearch = await searchParams;

  await requireRole("HR");

  const statusParam = (resolvedSearch?.status ?? "").toString().toUpperCase();
  const validStatuses: StatusFilter[] = ["PENDING", "APPROVED", "REJECTED", "ALL"];
  const statusFilter: StatusFilter = validStatuses.includes(statusParam as StatusFilter)
    ? (statusParam as StatusFilter)
    : "PENDING";

  const areaFilter = (resolvedSearch?.area ?? "").toString().trim();

  const [requests, areasRaw] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: {
        ...(statusFilter !== "ALL" ? { status: statusFilter } : {}),
        ...(areaFilter ? { employee: { area: { equals: areaFilter } } } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        employee: { select: { fullName: true, area: true } },
      },
    }),
    prisma.employee.findMany({ select: { area: true } }),
  ]);

  const requestsWithBusinessDays = await Promise.all(
    requests.map(async (request) => ({
      ...request,
      requestDays:
        request.type === "VACATION"
          ? await businessDaysBetweenWithChileHolidays(request.startDate, request.endDate)
          : inclusiveDaysBetween(request.startDate, request.endDate),
    })),
  );

  const areas = Array.from(new Set(areasRaw.map((item) => item.area))).sort((a, b) =>
    a.localeCompare(b),
  );

  return (
    <div className="space-y-6">
      <div className="rounded-[1.5rem] border border-blue-300/15 bg-[linear-gradient(135deg,rgba(37,99,235,0.2),rgba(15,23,42,0.2)_55%,rgba(245,158,11,0.12))] p-6">
        <h1 className="text-3xl font-semibold tracking-tight text-white">Solicitudes</h1>
        <p className="mt-2 text-sm text-slate-400">
          Revisa y resuelve las solicitudes de vacaciones y dias libres del equipo.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-white">Bandeja</CardTitle>
          <CardDescription className="text-[#5A6473]">
            Filtra por estado o área y toma decisiones.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Filters status={statusFilter} area={areaFilter} areas={areas} />
          <RequestsTable requests={requestsWithBusinessDays} />
        </CardContent>
      </Card>
    </div>
  );
}

function Filters({ status, area, areas }: { status: StatusFilter; area: string; areas: string[] }) {
  return (
    <form className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:gap-2">
        <div className="flex w-full items-center gap-2 md:w-60">
          <label htmlFor="status" className="text-xs font-semibold uppercase text-slate-400">
            Estado
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status}
            className="app-field h-10 w-full rounded-xl px-3 text-sm"
          >
            <option value="PENDING">Pendientes</option>
            <option value="APPROVED">Aprobadas</option>
            <option value="REJECTED">Rechazadas</option>
            <option value="ALL">Todas</option>
          </select>
        </div>

        <div className="flex w-full items-center gap-2 md:w-60">
          <label htmlFor="area" className="text-xs font-semibold uppercase text-slate-400">
            Área
          </label>
          <select
            id="area"
            name="area"
            defaultValue={area}
            className="app-field h-10 w-full rounded-xl px-3 text-sm"
          >
            <option value="">Todas las áreas</option>
            {areas.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" variant="default" size="md">
          Aplicar
        </Button>
        <Link href="/requests">
          <Button
            type="button"
            variant="outline"
            size="md"
            className="border-white/12 text-white hover:bg-blue-400/10"
          >
            Limpiar
          </Button>
        </Link>
      </div>
    </form>
  );
}

function RequestsTable({ requests }: { requests: RequestItem[] }) {
  return (
    <DarkTableWrapper>
      <DarkTable className="table-fixed">
        <colgroup>
          <col className="w-[20%]" />
          <col className="w-[28%]" />
          <col className="w-[21%]" />
          <col className="w-[13%]" />
          <col className="w-[18%]" />
        </colgroup>
        <thead className={darkTheadClass}>
          <tr>
            <Th>Empleado</Th>
            <Th>Solicitud</Th>
            <Th>Comentario</Th>
            <Th className="whitespace-nowrap">Estado</Th>
            <Th className="whitespace-nowrap text-right">Acciones</Th>
          </tr>
        </thead>
        <tbody>
          {requests.length === 0 ? (
            <tr className={darkTrClass}>
              <td colSpan={5} className="px-4 py-6 text-center text-white/70">
                Sin solicitudes para estos filtros.
              </td>
            </tr>
          ) : (
            requests.map((req) => (
              <tr key={req.id} className={darkTrClass}>
                <Td>
                  <div className="font-semibold text-white">{req.employee?.fullName ?? "-"}</div>
                  <div className="mt-1 text-xs font-medium text-slate-400">
                    {req.employee?.area ?? "-"}
                  </div>
                </Td>
                <Td className="text-white/80">
                  <div className="font-medium text-white/90">
                    {formatDisplayDate(req.startDate)} - {formatDisplayDate(req.endDate)}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {requestTypeLabels[req.type]} · {requestDaysLabel(req.type, req.requestDays)} · creada {formatDisplayDate(dateToIso(req.createdAt))}
                  </div>
                </Td>
                <Td className="break-words text-white/80">{req.comment ?? "-"}</Td>
                <Td className="whitespace-nowrap">
                  <StatusBadge status={req.status} />
                </Td>
                <Td>
                  <div className="flex flex-col items-stretch gap-2">
                    <Link
                      href={`/requests/${req.id}`}
                      className="inline-flex h-9 items-center justify-center rounded-xl border border-white/12 bg-white/[0.03] px-3 text-sm font-medium text-white transition-colors hover:border-blue-300/45 hover:bg-blue-400/10"
                    >
                      Ver
                    </Link>
                    {req.status === "PENDING" ? (
                      <DecisionActions requestId={req.id} />
                    ) : (
                      <span className="text-center text-sm text-[#5A6473]">-</span>
                    )}
                  </div>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </DarkTable>
    </DarkTableWrapper>
  );
}


function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}

function Th({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <th className={`${darkThClass} ${className}`}>{children}</th>;
}

function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`${darkTdClass} ${className}`}>{children}</td>;
}
