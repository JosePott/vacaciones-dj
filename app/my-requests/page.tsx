import Link from "next/link";
import type { ReactNode } from "react";
import type { RequestStatus, RequestType } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RouteToaster } from "@/components/ui/route-toaster";
import { dateToIso, formatDisplayDate, inclusiveDaysBetween } from "@/lib/dates";
import { businessDaysBetweenWithChileHolidays } from "@/lib/holidays";
import { requestDaysLabel, requestTypeLabels } from "@/lib/leave-requests";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

const statusLabels: Record<RequestStatus, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
  CANCELED: "Cancelada",
};

const statusStyles: Record<RequestStatus, string> = {
  PENDING: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  APPROVED: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  REJECTED: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  CANCELED: "bg-white/8 text-slate-300 border-white/10",
};

export default async function MyRequestsPage() {
  const session = await requireRole("EMPLOYEE");

  const employee = await prisma.employee.findUnique({
    where: { userId: session.userId },
    select: {
      id: true,
      fullName: true,
      area: true,
      vacationSaldo: true,
      requests: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          type: true,
          startDate: true,
          endDate: true,
          status: true,
          comment: true,
          createdAt: true,
        },
      },
    },
  });

  if (!employee) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Mis solicitudes</h1>
        <div className="rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          No encontramos tu perfil de empleado.
        </div>
      </div>
    );
  }

  const requests = await Promise.all(
    employee.requests.map(async (request) => ({
      ...request,
      requestDays:
        request.type === "VACATION"
          ? await businessDaysBetweenWithChileHolidays(request.startDate, request.endDate)
          : inclusiveDaysBetween(request.startDate, request.endDate),
    })),
  );

  return (
    <div className="space-y-6">
      <RouteToaster flags={[{ param: "created", message: "Solicitud enviada" }]} />

      <div className="rounded-[1.25rem] border border-blue-300/15 bg-[linear-gradient(135deg,rgba(37,99,235,0.2),rgba(15,23,42,0.2)_55%,rgba(16,185,129,0.12))] p-4 sm:flex sm:items-center sm:justify-between sm:rounded-[1.5rem] sm:p-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Mis solicitudes
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Historial de solicitudes de {employee.fullName} ({employee.area}). Saldo:{" "}
            <span className="font-semibold text-blue-100">{employee.vacationSaldo} dias</span>.
          </p>
        </div>
        <Link href="/my-requests/new" className="mt-4 flex sm:mt-0 sm:inline-flex">
          <Button className="w-full sm:w-auto">Nueva solicitud</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial</CardTitle>
          <CardDescription>Revisa tus solicitudes y su estado.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RequestsTable requests={requests} />
        </CardContent>
      </Card>
    </div>
  );
}

type RequestRow = {
  id: string;
  startDate: string;
  endDate: string;
  type: RequestType;
  status: RequestStatus;
  comment: string | null;
  createdAt: Date;
  requestDays: number;
};

function RequestsTable({ requests }: { requests: RequestRow[] }) {
  return (
    <>
      <div className="grid gap-3 md:hidden">
        {requests.length === 0 ? (
          <div className="rounded-[1rem] border border-dashed border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm text-slate-400">
            Aun no tienes solicitudes.
          </div>
        ) : (
          requests.map((req) => (
            <div
              key={req.id}
              className="rounded-[1rem] border border-white/10 bg-[#070C1C]/72 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-white">{requestTypeLabels[req.type]}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatDisplayDate(req.startDate)} - {formatDisplayDate(req.endDate)}
                  </p>
                </div>
                <StatusBadge status={req.status} />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs uppercase text-slate-500">Dias</p>
                  <p className="mt-1 font-medium text-white/85">
                    {requestDaysLabel(req.type, req.requestDays)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase text-slate-500">Creada</p>
                  <p className="mt-1 font-medium text-white/85">
                    {formatDisplayDate(dateToIso(req.createdAt))}
                  </p>
                </div>
              </div>

              {req.comment ? (
                <p className="mt-4 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm text-white/80">
                  {req.comment}
                </p>
              ) : null}
            </div>
          ))
        )}
      </div>

      <div className="hidden overflow-x-auto rounded-[1.15rem] border border-white/10 bg-[#070C1C]/72 md:block">
        <table className="min-w-full text-sm">
        <thead className="bg-white/[0.04]">
          <tr>
            <Th>Fechas</Th>
            <Th>Tipo</Th>
            <Th>Dias</Th>
            <Th>Estado</Th>
            <Th>Comentario</Th>
            <Th>Creada</Th>
          </tr>
        </thead>
        <tbody>
          {requests.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                Aun no tienes solicitudes.
              </td>
            </tr>
          ) : (
            requests.map((req) => (
              <tr key={req.id}>
                <Td className="text-white/85">
                  {formatDisplayDate(req.startDate)} - {formatDisplayDate(req.endDate)}
                </Td>
                <Td className="text-white/85">
                  {requestTypeLabels[req.type]}
                </Td>
                <Td className="text-white/85">
                  {requestDaysLabel(req.type, req.requestDays)}
                </Td>
                <Td>
                  <StatusBadge status={req.status} />
                </Td>
                <Td className="text-white/85">{req.comment ?? "-"}</Td>
                <Td className="text-white/85">{formatDisplayDate(dateToIso(req.createdAt))}</Td>
              </tr>
            ))
          )}
        </tbody>
        </table>
      </div>
    </>
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
  return (
    <th className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 ${className}`}>
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`border-t border-white/8 px-4 py-3 align-middle ${className}`}>{children}</td>;
}
