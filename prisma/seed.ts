import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required.");
}

const adapter = new PrismaPg({
  connectionString,
});
const prisma = new PrismaClient({ adapter });

const shiftTemplates = [
  { id: "shift_t1", code: "T1", name: "Turno 1", startTime: "08:00", endTime: "17:00" },
  { id: "shift_t2", code: "T2", name: "Turno 2", startTime: "09:00", endTime: "18:00" },
  { id: "shift_t3", code: "T3", name: "Turno 3", startTime: "10:00", endTime: "19:00" },
  { id: "shift_t4", code: "T4", name: "Turno 4", startTime: "11:00", endTime: "20:00" },
  { id: "shift_t5", code: "T5", name: "Turno 5", startTime: "13:00", endTime: "22:00" },
  { id: "shift_t8", code: "T8", name: "Turno 8", startTime: "12:00", endTime: "21:00" },
];

async function seedShiftTemplates() {
  for (const shift of shiftTemplates) {
    await prisma.shiftTemplate.upsert({
      where: { code: shift.code },
      create: {
        ...shift,
        breakMinutes: 60,
        isActive: true,
      },
      update: {
        name: shift.name,
        startTime: shift.startTime,
        endTime: shift.endTime,
        breakMinutes: 60,
        isActive: true,
      },
    });
  }
}

async function seedInitialHrUser() {
  const email = process.env.INITIAL_HR_EMAIL;
  const password = process.env.INITIAL_HR_PASSWORD;

  if (!email || !password) {
    console.log("No INITIAL_HR_EMAIL/INITIAL_HR_PASSWORD set; skipping HR seed.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      role: "HR",
    },
    update: {
      passwordHash,
      role: "HR",
    },
  });

  console.log(`Initial HR user ready: ${email}`);
}

async function main() {
  await seedShiftTemplates();
  await seedInitialHrUser();
  console.log("Seed completed.");
}

main()
  .catch((error) => {
    console.error("Seed error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
