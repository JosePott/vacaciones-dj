import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireRole } from "@/lib/rbac";
import RequestForm from "./request-form";

export default async function NewRequestPage() {
  await requireRole("EMPLOYEE");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <Link href="/my-requests" className="app-link text-sm">
          Volver a mis solicitudes
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-white">Nueva solicitud</h1>
        <p className="text-sm text-slate-400">
          Completa las fechas para pedir vacaciones o dias libres.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Formulario</CardTitle>
          <CardDescription>Elige el tipo, ingresa el rango y agrega un comentario opcional.</CardDescription>
        </CardHeader>
        <CardContent>
          <RequestForm />
        </CardContent>
      </Card>
    </div>
  );
}
