-- CreateEnum
CREATE TYPE "Role" AS ENUM ('HR', 'EMPLOYEE');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELED');

-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('VACATION', 'DAY_OFF');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "position" TEXT,
    "personalEmail" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "vacationSaldo" INTEGER NOT NULL DEFAULT 15,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeaveRequest" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "type" "RequestType" NOT NULL DEFAULT 'VACATION',
    "comment" TEXT,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "decisionBy" TEXT,
    "decisionAt" TIMESTAMP(3),
    "decisionNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LeaveRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShiftTemplate" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "breakMinutes" INTEGER NOT NULL DEFAULT 60,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkShiftAssignment" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "shiftTemplateId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "note" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkShiftAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_userId_key" ON "Employee"("userId");

-- CreateIndex
CREATE INDEX "LeaveRequest_employeeId_idx" ON "LeaveRequest"("employeeId");

-- CreateIndex
CREATE INDEX "LeaveRequest_status_idx" ON "LeaveRequest"("status");

-- CreateIndex
CREATE INDEX "LeaveRequest_startDate_endDate_idx" ON "LeaveRequest"("startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "ShiftTemplate_code_key" ON "ShiftTemplate"("code");

-- CreateIndex
CREATE INDEX "WorkShiftAssignment_date_idx" ON "WorkShiftAssignment"("date");

-- CreateIndex
CREATE INDEX "WorkShiftAssignment_shiftTemplateId_idx" ON "WorkShiftAssignment"("shiftTemplateId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkShiftAssignment_employeeId_date_key" ON "WorkShiftAssignment"("employeeId", "date");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeaveRequest" ADD CONSTRAINT "LeaveRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkShiftAssignment" ADD CONSTRAINT "WorkShiftAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkShiftAssignment" ADD CONSTRAINT "WorkShiftAssignment_shiftTemplateId_fkey" FOREIGN KEY ("shiftTemplateId") REFERENCES "ShiftTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed fixed shift templates
INSERT INTO "ShiftTemplate" ("id", "code", "name", "startTime", "endTime", "breakMinutes", "isActive", "createdAt", "updatedAt")
VALUES
  ('shift_t1', 'T1', 'Turno 1', '08:00', '17:00', 60, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('shift_t2', 'T2', 'Turno 2', '09:00', '18:00', 60, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('shift_t3', 'T3', 'Turno 3', '10:00', '19:00', 60, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('shift_t4', 'T4', 'Turno 4', '11:00', '20:00', 60, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('shift_t5', 'T5', 'Turno 5', '13:00', '22:00', 60, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('shift_t8', 'T8', 'Turno 8', '12:00', '21:00', 60, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
