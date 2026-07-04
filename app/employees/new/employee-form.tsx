"use client";

import Link from "next/link";
import React from "react";
import { toast } from "sonner";

import { createEmployee } from "@/app/actions/employees";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function EmployeeForm() {
  const [state, action] = React.useActionState(createEmployee, { error: null });
  const [pending] = React.useTransition();
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [personalEmail, setPersonalEmail] = React.useState("");
  const [area, setArea] = React.useState("");
  const [position, setPosition] = React.useState("");
  const [vacationSaldo, setVacationSaldo] = React.useState("15");
  const [isActive, setIsActive] = React.useState(true);
  const [password, setPassword] = React.useState("");

  React.useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state?.error]);

  return (
    <form action={action} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nombre completo" name="fullName" required>
          <Input
            name="fullName"
            id="fullName"
            placeholder="Ej: Ana Gomez"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </Field>

        <Field label="Email" name="email" required>
          <Input
            name="email"
            id="email"
            type="email"
            placeholder="correo@empresa.cl"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Field label="Correo personal" name="personalEmail">
          <Input
            name="personalEmail"
            id="personalEmail"
            type="email"
            placeholder="correo.personal@gmail.com"
            value={personalEmail}
            onChange={(e) => setPersonalEmail(e.target.value)}
          />
          <p className="text-xs text-slate-500">
            Se usara para notificaciones. Si queda vacio, se enviaran al email de acceso.
          </p>
        </Field>

        <Field label="Area" name="area" required>
          <Input
            name="area"
            id="area"
            placeholder="Ej: Marketing"
            required
            value={area}
            onChange={(e) => setArea(e.target.value)}
          />
        </Field>

        <Field label="Cargo" name="position">
          <Input
            name="position"
            id="position"
            placeholder="Ej: Analista"
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          />
        </Field>

        <Field label="Saldo de dias" name="vacationSaldo">
          <Input
            name="vacationSaldo"
            id="vacationSaldo"
            type="number"
            min={0}
            value={vacationSaldo}
            onChange={(e) => setVacationSaldo(e.target.value)}
          />
        </Field>

        <div className="space-y-2">
          <Label htmlFor="isActive">Activo</Label>
          <label className="inline-flex items-center gap-3">
            <input
              id="isActive"
              name="isActive"
              type="checkbox"
              checked={isActive}
              className="h-5 w-5 rounded border-white/20 bg-[#070C1C] text-blue-500 focus:ring-2 focus:ring-blue-300/50"
              onChange={(e) => setIsActive(e.target.checked)}
            />
            <span className="text-sm text-slate-300">Habilitar acceso y visibilidad</span>
          </label>
        </div>
      </div>

      <Field label="Password temporal (opcional)" name="password">
        <Input
          name="password"
          id="password"
          type="text"
          placeholder="Dejar vacio para generar uno"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="text-xs text-slate-500">
          Si lo dejas vacio se generara una clave aleatoria de 10 caracteres.
        </p>
      </Field>

      {state?.error ? (
        <div className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
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
          {pending ? "Guardando..." : "Crear empleado"}
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
        {required ? <span className="text-rose-500">*</span> : null}
      </Label>
      {children}
    </div>
  );
}
