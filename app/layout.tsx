import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import {
  CalendarClock,
  CalendarDays,
  ClipboardList,
  LayoutDashboard,
  Plus,
  Users,
  type LucideIcon,
} from "lucide-react";

import { logoutUser } from "@/app/actions/auth";
import { SESSION_COOKIE, verifySessionToken, type UserRole } from "@/lib/session";
import { AppToaster } from "@/components/ui/app-toaster";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vacaciones",
  description: "MVP de gestion de vacaciones",
};

const navByRole: Record<UserRole, Array<{ href: string; label: string; icon: LucideIcon }>> = {
  HR: [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/employees", label: "Empleados", icon: Users },
    { href: "/requests", label: "Solicitudes", icon: ClipboardList },
    { href: "/calendar", label: "Calendario", icon: CalendarDays },
    { href: "/schedules", label: "Horarios", icon: CalendarClock },
  ],
  EMPLOYEE: [
    { href: "/my-schedule", label: "Mis turnos", icon: CalendarClock },
    { href: "/my-requests", label: "Mis solicitudes", icon: ClipboardList },
    { href: "/my-requests/new", label: "Nueva solicitud", icon: Plus },
  ],
};

function NavLinks({ role, compact = false }: { role?: UserRole; compact?: boolean }) {
  if (!role) return null;
  return (
    <nav className={compact ? "flex flex-wrap gap-2" : "flex flex-col gap-2"}>
      {navByRole[role]?.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "group flex items-center gap-3 rounded-2xl border border-transparent px-3 py-2.5 text-sm font-medium text-slate-400 transition",
              "hover:border-blue-300/30 hover:bg-blue-400/10 hover:text-white",
              compact ? "flex-1 justify-center sm:flex-none sm:justify-start" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span className="grid h-8 w-8 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-blue-100 shadow-inner shadow-white/5 group-hover:border-blue-300/35 group-hover:bg-blue-400/20">
              <Icon className="h-4 w-4" aria-hidden="true" strokeWidth={2.2} />
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const session = await verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);

  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="relative min-h-screen overflow-hidden bg-[#020615] text-white">
          <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(59,130,246,0.28),transparent_28%),radial-gradient(circle_at_80%_15%,rgba(124,58,237,0.22),transparent_25%),linear-gradient(180deg,#071229_0%,#020615_48%,#050814_100%)]" />
          <div className="pointer-events-none fixed inset-x-0 bottom-0 -z-10 h-[42vh] bg-[linear-gradient(180deg,transparent,rgba(15,23,42,0.4)),linear-gradient(135deg,transparent_0_42%,rgba(30,41,59,0.75)_42%_45%,transparent_45%),linear-gradient(25deg,transparent_0_47%,rgba(51,65,85,0.9)_47%_50%,transparent_50%)] opacity-70" />

          {!session ? (
            <>
              {children}
            </>
          ) : (
            <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:p-8">
              <aside className="hidden w-64 shrink-0 rounded-[1.7rem] border border-white/10 bg-[#080D20]/82 p-4 shadow-2xl shadow-black/35 backdrop-blur-2xl lg:flex lg:flex-col">
                <Link href="/" className="mb-9 flex items-center gap-3 px-2 pt-2">
                  <span className="flex h-12 w-28 items-center justify-center">
                    <Image
                      src="/dj-logo.png"
                      alt="DJ Soluciones SPA"
                      width={193}
                      height={69}
                      unoptimized
                      priority
                      className="h-auto w-full"
                    />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold tracking-tight text-white">
                      Vacaciones
                    </span>
                    <span className="text-xs text-slate-500">Gestion interna</span>
                  </span>
                </Link>

                <NavLinks role={session.role} />

                <div className="mt-auto space-y-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Sesion</p>
                    <p className="mt-1 text-sm font-semibold text-white">{session.role}</p>
                  </div>
                  <form action={logoutUser}>
                    <button
                      type="submit"
                      className="w-full rounded-xl border border-white/10 px-3 py-2 text-left text-sm font-medium text-slate-300 transition hover:border-rose-300/35 hover:bg-rose-400/10 hover:text-white"
                    >
                      Salir
                    </button>
                  </form>
                </div>
              </aside>

              <div className="flex min-w-0 flex-1 flex-col rounded-[1.7rem] border border-white/10 bg-[#091026]/72 shadow-2xl shadow-black/30 backdrop-blur-2xl">
                <header className="border-b border-white/8 p-3 lg:hidden">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-white">
                      <span className="flex h-10 w-24 items-center justify-center">
                        <Image
                          src="/dj-logo.png"
                          alt="DJ Soluciones SPA"
                          width={193}
                          height={69}
                          unoptimized
                          priority
                          className="h-auto w-full"
                        />
                      </span>
                      Vacaciones
                    </Link>
                    <form action={logoutUser}>
                      <button
                        type="submit"
                        className="rounded-xl border border-white/10 px-3 py-2 text-sm text-slate-300"
                      >
                        Salir
                      </button>
                    </form>
                  </div>
                  <NavLinks role={session.role} compact />
                </header>

                <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
              </div>
            </div>
          )}
          <AppToaster />
        </div>
      </body>
    </html>
  );
}
