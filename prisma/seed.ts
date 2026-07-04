import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcrypt";

const connectionString = process.env.DATABASE_URL ?? "file:./dev.db";
const adapter = new PrismaBetterSqlite3({ url: connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const passwordHash = await bcrypt.hash("Demo1234!", 10);

  // HR
  await prisma.user.create({
    data: {
      email: "hr@demo.cl",
      passwordHash,
      role: "HR",
    },
  });

  // Employee 1
  const empUser1 = await prisma.user.create({
    data: {
      email: "emp1@demo.cl",
      passwordHash,
      role: "EMPLOYEE",
      employee: {
        create: {
          fullName: "Juan Pérez",
          area: "Ventas",
          position: "Ejecutivo",
          vacationSaldo: 15,
        },
      },
    },
    include: { employee: true },
  });

  // Employee 2
  const empUser2 = await prisma.user.create({
    data: {
      email: "emp2@demo.cl",
      passwordHash,
      role: "EMPLOYEE",
      employee: {
        create: {
          fullName: "María López",
          area: "Marketing",
          position: "Analista",
          vacationSaldo: 10,
        },
      },
    },
    include: { employee: true },
  });

  // Requests
  await prisma.leaveRequest.createMany({
    data: [
      {
        employeeId: empUser1.employee!.id,
        startDate: "2026-03-01",
        endDate: "2026-03-05",
        status: "PENDING",
        comment: "Vacaciones familiares",
      },
      {
        employeeId: empUser1.employee!.id,
        startDate: "2026-04-01",
        endDate: "2026-04-03",
        status: "APPROVED",
        comment: "Fin de semana largo",
        decisionBy: "system",
        decisionAt: new Date(),
        decisionNote: "Aprobado por demo",
      },
      {
        employeeId: empUser2.employee!.id,
        startDate: "2026-05-10",
        endDate: "2026-05-15",
        status: "REJECTED",
        comment: "Viaje",
        decisionBy: "system",
        decisionAt: new Date(),
        decisionNote: "Rechazado por demo",
      },
    ],
  });

  console.log("🌱 Seed completed");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
