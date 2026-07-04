import { redirect } from "next/navigation";

import { requireSession } from "@/lib/rbac";

const roleHome: Record<"HR" | "EMPLOYEE", string> = {
  HR: "/dashboard",
  EMPLOYEE: "/my-requests",
};

export default async function Home() {
  const session = await requireSession({ redirectTo: "/login" });

  redirect(roleHome[session.role] ?? "/login");
}
