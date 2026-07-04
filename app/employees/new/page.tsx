import Link from "next/link";

import EmployeeForm from "./employee-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/rbac";

export default async function NewEmployeePage() {
  await requireRole("HR");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Link href="/employees" className="app-link text-sm">
          ← Volver al listado
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Nuevo empleado</h1>
        <p className="text-sm text-slate-400">Completa la información para crear un colaborador.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Datos del empleado</CardTitle>
          <CardDescription>Todos los campos marcados son obligatorios.</CardDescription>
        </CardHeader>
        <CardContent>
          <EmployeeForm />
        </CardContent>
      </Card>
    </div>
  );
}
