"use client";

import React from "react";
import Link from "next/link";
import { toast } from "sonner";

import { submitLeaveRequest } from "@/app/actions/my-requests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function RequestForm() {
  const [state, action] = React.useActionState(submitLeaveRequest, { error: null });
  const [pending] = React.useTransition();

  React.useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    }
  }, [state?.error]);

  return (
    <form action={action} className="space-y-6">
      <Field label="Tipo de solicitud" name="type" required>
        <select
          id="type"
          name="type"
          defaultValue="VACATION"
          className="app-field h-10 w-full rounded-xl px-3 text-sm"
          required
        >
          <option value="VACATION">Vacaciones</option>
          <option value="DAY_OFF">Dia libre</option>
        </select>
      </Field>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Fecha inicio" name="startDate" required>
          <Input name="startDate" id="startDate" type="date" required />
        </Field>
        <Field label="Fecha fin" name="endDate" required>
          <Input name="endDate" id="endDate" type="date" required />
        </Field>
      </div>

      <Field label="Comentario" name="comment">
        <textarea
          id="comment"
          name="comment"
          rows={4}
          className="app-field w-full rounded-xl px-3 py-2 text-sm"
          placeholder="Motivo o detalles (opcional)"
          maxLength={500}
        />
        <p className="text-xs text-slate-500">Max 500 caracteres.</p>
      </Field>

      {state?.error ? (
        <div className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {state.error}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
        <Link href="/my-requests">
          <Button variant="outline" type="button">
            Cancelar
          </Button>
        </Link>
        <Button type="submit" disabled={pending}>
          {pending ? "Enviando..." : "Crear solicitud"}
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
