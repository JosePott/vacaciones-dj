import type { Metadata } from "next";
import { cookies } from "next/headers";
import Image from "next/image";
import { redirect } from "next/navigation";

import LoginForm from "./login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export const metadata: Metadata = {
  title: "Ingresar | Vacaciones",
  description: "Acceso a la app de vacaciones",
};

export default async function LoginPage() {
  const store = await cookies();
  const session = await verifySessionToken(store.get(SESSION_COOKIE)?.value);

  if (session) {
    redirect("/");
  }

  return (
    <>
      <div className="flex min-h-screen w-full items-center justify-center px-4 py-12">
        <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="hidden space-y-5 lg:block">
            <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300 backdrop-blur-xl">
              Gestion de equipo DJ
            </div>
            <div className="space-y-3">
              <h1 className="max-w-xl text-5xl font-semibold tracking-tight text-white">
                Coordina horarios, vacaciones y equipo en un solo lugar.
              </h1>
              <p className="max-w-lg text-sm leading-6 text-slate-400">
                Controla solicitudes, saldos, turnos y calendario desde un mismo lugar.
              </p>
            </div>
          </div>

          <div className="w-full">
            <Card className="border-blue-300/15 bg-[#080E22]/86">
              <CardHeader>
                <div className="mb-3 flex h-16 w-36 items-center justify-center">
                  <Image
                    src="/dj-logo.png"
                    alt="DJ Soluciones SPA"
                    width={193}
                    height={69}
                    unoptimized
                    priority
                    className="h-auto w-full"
                  />
                </div>
                <CardTitle>Bienvenido</CardTitle>
                <CardDescription>Accede con tu correo corporativo y contrasena.</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <LoginForm />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
