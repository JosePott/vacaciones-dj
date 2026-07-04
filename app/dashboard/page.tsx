import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { dateToIso, formatDisplayDate } from "@/lib/dates";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import type { RequestStatus } from "@prisma/client";

const statusStyles: Record<RequestStatus, string> = {
  PENDING: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
  APPROVED: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
  REJECTED: "bg-rose-500/15 text-rose-300 border border-rose-500/30",
  CANCELED: "bg-[#273440]/60 text-white/70 border border-[#273440]",
};

export default async function DashboardPage() {
  await requireRole("HR");
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const todayIso = dateToIso(now);
  const startOfMonthIso = dateToIso(startOfMonth);
  const startOfNextMonthIso = dateToIso(startOfNextMonth);

  const [
    pendingCount,
    approvedThisMonth,
    onVacationToday,
    activeEmployees,
    latestRequests,
  ] = await Promise.all([
    prisma.leaveRequest.count({ where: { status: "PENDING" } }),
    prisma.leaveRequest.count({
      where: {
        status: "APPROVED",
        startDate: { gte: startOfMonthIso, lt: startOfNextMonthIso },
      },
    }),
    prisma.leaveRequest.count({
      where: {
        status: "APPROVED",
        type: "VACATION",
        startDate: { lte: todayIso },
        endDate: { gte: todayIso },
      },
    }),
    prisma.employee.count({ where: { isActive: true } }),
    prisma.leaveRequest.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        employee: {
          select: { fullName: true },
        },
      },
    }),
  ]);

  return (
    <div className="space-y-7">
      <div className="rounded-[1.5rem] border border-blue-300/15 bg-[linear-gradient(135deg,rgba(37,99,235,0.22),rgba(15,23,42,0.25)_48%,rgba(124,58,237,0.16))] p-6 shadow-2xl shadow-black/20">
        <p className="text-sm font-medium text-blue-200">Panel HR</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">
          Revisa el estado del equipo
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
          Vista rapida del estado del equipo, solicitudes pendientes y vacaciones en curso.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Pendientes" value={pendingCount} helper="Solicitudes en espera" />
        <StatCard
          title="Aprobadas (mes)"
          value={approvedThisMonth}
          helper="Con inicio en el mes actual"
        />
        <StatCard title="En vacaciones hoy" value={onVacationToday} helper="Aprobadas en curso" />
        <StatCard title="Empleados activos" value={activeEmployees} helper="Con estado activo" />
      </div>

      <Card className="p-5 transition-all duration-300 ease-out hover:border-blue-300/20">
        <CardHeader className="p-0 pb-3">
          <CardTitle className="text-lg font-semibold text-white">Ultimas solicitudes</CardTitle>
          <CardDescription className="text-sm text-[#5A6473]">
            Ultimas 5 solicitudes registradas.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {latestRequests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-5 text-center text-sm text-slate-400">
              Sin solicitudes registradas.
            </div>
          ) : (
            <div className="overflow-hidden rounded-[1.15rem] border border-white/10 bg-[#070C1C]/70 backdrop-blur-xl">
              <table className="min-w-full text-sm">
                <thead className="bg-white/[0.04]">
                  <tr>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-white/50">
                      Empleado
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-white/50">
                      Fechas
                    </th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-white/50">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {latestRequests.map((req) => (
                    <tr
                      key={req.id}
                      className="border-t border-white/8 text-white/90 transition-colors duration-150 first:border-t-0 hover:bg-blue-400/[0.07]"
                    >
                      <td className="px-4 py-4">{req.employee?.fullName ?? "-"}</td>
                      <td className="px-4 py-4 text-white/90">
                        {formatDisplayDate(req.startDate)} - {formatDisplayDate(req.endDate)}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[req.status]}`}
                        >
                          {labelFromStatus(req.status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  helper,
}: {
  title: string;
  value: number;
  helper: string;
}) {
  return (
    <Card className="p-5 transition-all duration-300 ease-out hover:border-blue-300/20 hover:bg-[#0C1530]/82">
      <CardHeader className="p-0">
        <CardTitle className="text-lg font-semibold text-white/90">{title}</CardTitle>
        <CardDescription className="text-sm text-white/60">{helper}</CardDescription>
      </CardHeader>
      <CardContent className="p-0 pt-3">
        <div className="border-t border-[#273440]/60 pt-4">
          <p className="mt-4 text-5xl font-bold tracking-tight text-white">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function labelFromStatus(status: RequestStatus): string {
  switch (status) {
    case "PENDING":
      return "Pendiente";
    case "APPROVED":
      return "Aprobada";
    case "REJECTED":
      return "Rechazada";
    case "CANCELED":
      return "Cancelada";
    default:
      return status;
  }
}
