"use server";

import bcrypt from "bcrypt";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createSessionCookie, destroySessionCookie } from "@/lib/session";
import { loginSchema } from "@/schemas/auth";
import { type LoginState } from "./auth.types";

// Valida credenciales y construye la cookie de sesion si todo cuadra.
export async function loginUser(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { message: "Datos de acceso invalidos" };
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });

  if (!user) return { message: "Credenciales incorrectas" };

  const valid = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!valid) return { message: "Credenciales incorrectas" };

  const sessionCookie = await createSessionCookie({
    userId: user.id,
    role: user.role,
  });

  const cookieStore = await cookies();
  cookieStore.set(sessionCookie.name, sessionCookie.value, sessionCookie.options);

  redirect("/");
}

// Limpia la cookie de sesion y regresa al login.
export async function logoutUser(): Promise<void> {
  const cookie = destroySessionCookie();
  const cookieStore = await cookies();
  cookieStore.set(cookie.name, cookie.value, cookie.options);
  redirect("/login");
}
