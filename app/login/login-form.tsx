"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { loginUser } from "@/app/actions/auth";
import { initialLoginState } from "@/app/actions/auth.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button className="w-full" type="submit" disabled={pending}>
      {pending ? "Entrando..." : "Iniciar sesion"}
    </Button>
  );
}

export default function LoginForm() {
  const [state, formAction] = useActionState(loginUser, initialLoginState);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form action={formAction} className="space-y-5" autoComplete="on">
      <div className="space-y-2">
        <Label htmlFor="email">Correo</Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="usuario@demo.cl"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contrasena</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            minLength={6}
            required
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/8 hover:text-white"
            aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
            title={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {state.message ? (
        <div className="rounded-xl border border-rose-500/35 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {state.message}
        </div>
      ) : null}

      <SubmitButton />

      <div className="text-center text-xs text-slate-600">
        <Link className="app-link" href="https://github.com/shadcn/ui" target="_blank">
          shadcn/ui
        </Link>{" "}
        style components.
      </div>
    </form>
  );
}
