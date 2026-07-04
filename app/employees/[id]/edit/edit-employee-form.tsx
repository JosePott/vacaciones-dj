"use client";

import React from "react";
import Link from "next/link";
import { toast } from "sonner";

import { updateEmployee } from "@/app/actions/employees";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EmployeeEditData = {
  id: string;
  fullName: string;
  email: string;
  personalEmail: string | null;
  area: string;
  position: string | null;
  vacationSaldo: number;
  isActive: boolean;
};

export default function EditEmployeeForm({ employee }: { employee: EmployeeEditData }) {
  const [state, action] = React.useActionState(updateEmployee, { error: null });
  const [pending] = React.useTransition();

  React.useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state?.error]);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="id" value={employee.id} />

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nombre completo" name="fullName" required>
          <Input
            name="fullName"
            id="fullName"
            defaultValue={employee.fullName}
            required
            placeholder="Ej: Ana Gomez"
          />
        </Field>

        <Field label="Email" name="email" required>
          <Input
            name="email"
            id="email"
            type="email"
            defaultValue={employee.email}
            required
            placeholder="correo@empresa.cl"
          />
        </Field>

        <Field label="Correo personal" name="personalEmail">
          <Input
            name="personalEmail"
            id="personalEmail"
            type="email"
            defaultValue={employee.personalEmail ?? ""}
            placeholder="correo.personal@gmail.com"
          />
          <p className="text-xs text-slate-500">
            Se usara para notificaciones. Si queda vacio, se enviaran al email de acceso.
          </p>
        </Field>

        <Field label="Area" name="area" required>
          <Input
            name="area"
            id="area"
            defaultValue={employee.area}
            required
            placeholder="Ej: Marketing"
          />
        </Field>

        <Field label="Cargo" name="position">
          <Input
            name="position"
            id="position"
            defaultValue={employee.position ?? ""}
            placeholder="Ej: Analista"
          />
        </Field>

        <Field label="Saldo de dias" name="vacationSaldo">
          <Input
            name="vacationSaldo"
            id="vacationSaldo"
            type="number"
            min={0}
            defaultValue={employee.vacationSaldo}
          />
        </Field>

        <div className="space-y-2">
          <Label htmlFor="isActive">Activo</Label>
          <label className="inline-flex items-center gap-3">
            <input
              id="isActive"
              name="isActive"
              type="checkbox"
              defaultChecked={employee.isActive}
              className="h-5 w-5 rounded border-[#273440] bg-[#03070D] text-white focus:ring-2 focus:ring-[#424E59]/60"
            />
            <span className="text-sm text-white/80">Habilitar acceso y visibilidad</span>
          </label>
        </div>
      </div>

      {state?.error ? (
        <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {state.error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Link href="/employees">
          <Button variant="outline" type="button">
            Cancelar
          </Button>
        </Link>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  required,
  children,
}: {
  label: string;
  name: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="flex items-center gap-1">
        {label}
        {required ? <span className="text-rose-400">*</span> : null}
      </Label>
      {children}
    </div>
  );
}
