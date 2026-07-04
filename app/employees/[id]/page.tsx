import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RouteToaster } from "@/components/ui/route-toaster";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import DeleteEmployeeButton from "./delete-employee-button";

type Params = { id: string };

export const dynamic = "force-dynamic";

export default async function EmployeeDetailPage({
  params,
}: {
  params: Promise<Params> | Params;
}) {
  const resolvedParams = await params;
  const session = await requireRole("HR");

  const id = resolvedParams?.id;
  if (!id) {
    console.log("[EMPLOYEE_DETAIL] missing id param");
    return <NotFoundEmployee />;
  }
  console.log("[EMPLOYEE_DETAIL]", { id, role: session.role });

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: { user: { select: { email: true, id: true } } },
  });

  console.log("[EMPLOYEE_DETAIL_FOUND]", !!employee, { id });

  if (!employee) {
    return <NotFoundEmployee />;
  }

  return (
    <div className="space-y-6">
      <RouteToaster flags={[{ param: "updated", message: "Empleado actualizado" }]} />

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-white">Empleado</h1>
          <p className="text-sm text-[#5A6473]">Resumen del colaborador.</p>
        </div>
        <Link
          href={`/employees/${employee.id}/edit`}
          className="text-sm font-semibold text-white underline decoration-[#273440] hover:decoration-[#424E59]"
        >
          Editar
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{employee.fullName}</CardTitle>
          <CardDescription className="text-[#5A6473]">
            {employee.position ?? "Sin cargo"} · {employee.area}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Info label="Email" value={employee.user?.email ?? "-"} />
          <Info label="Correo personal" value={employee.personalEmail ?? "-"} />
          <Info label="Área" value={employee.area} />
          <Info label="Cargo" value={employee.position ?? "-"} />
          <Info label="Saldo de días" value={employee.vacationSaldo.toString()} />
          <Info label="Activo" value={employee.isActive ? "Sí" : "No"} />
        </CardContent>
      </Card>

      <DeleteEmployeeButton employeeId={employee.id} />

      <Link
        href="/employees"
        className="inline-block text-sm font-semibold text-white underline decoration-[#273440] hover:decoration-[#424E59]"
      >
        ← Volver al listado
      </Link>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[#273440] bg-[#03070D]/40 px-4 py-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-[#5A6473]">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}

function NotFoundEmployee() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-white">Empleado no encontrado</h1>
      <p className="text-sm text-[#5A6473]">Revisa que el enlace sea correcto.</p>
      <Link
        href="/employees"
        className="text-sm font-semibold text-white underline decoration-[#273440] hover:decoration-[#424E59]"
      >
        Volver al listado
      </Link>
    </div>
  );
}
