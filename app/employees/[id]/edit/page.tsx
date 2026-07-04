import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import EditEmployeeForm from "./edit-employee-form";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

type Params = { id: string };

export const dynamic = "force-dynamic";

export default async function EmployeeEditPage({
  params,
}: {
  params: Promise<Params> | Params;
}) {
  const resolvedParams = await params;
  await requireRole("HR");

  const id = resolvedParams?.id;
  if (!id) {
    console.log("[EMPLOYEE_EDIT] missing id param");
    return <NotFoundEmployee />;
  }

  const employee = await prisma.employee.findFirst({
    where: { id },
    include: { user: { select: { email: true } } },
  });

  console.log("[EMPLOYEE_EDIT_FOUND]", !!employee, { id });

  if (!employee || !employee.user) {
    return <NotFoundEmployee />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold text-white">Editar empleado</h1>
          <p className="text-sm text-[#5A6473]">Actualiza la información del colaborador.</p>
        </div>
        <Link
          href="/employees"
          className="text-sm font-semibold text-white underline decoration-[#273440] hover:decoration-[#424E59]"
        >
          Volver al listado
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{employee.fullName}</CardTitle>
          <CardDescription className="text-[#5A6473]">
            Revisa los datos actuales, cambia los parametros y guarda los cambios.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditEmployeeForm
            employee={{
              id: employee.id,
              fullName: employee.fullName,
              email: employee.user.email,
              personalEmail: employee.personalEmail,
              area: employee.area,
              position: employee.position,
              vacationSaldo: employee.vacationSaldo,
              isActive: employee.isActive,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function NotFoundEmployee() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-white">Empleado no encontrado</h1>
      <Link
        href="/employees"
        className="text-sm font-semibold text-white underline decoration-[#273440] hover:decoration-[#424E59]"
      >
        Volver al listado
      </Link>
    </div>
  );
}
