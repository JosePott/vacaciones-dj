-- CreateTable
CREATE TABLE "ShiftTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "breakMinutes" INTEGER NOT NULL DEFAULT 60,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WorkShiftAssignment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "shiftTemplateId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "note" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkShiftAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkShiftAssignment_shiftTemplateId_fkey" FOREIGN KEY ("shiftTemplateId") REFERENCES "ShiftTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "ShiftTemplate_code_key" ON "ShiftTemplate"("code");

-- CreateIndex
CREATE UNIQUE INDEX "WorkShiftAssignment_employeeId_date_key" ON "WorkShiftAssignment"("employeeId", "date");

-- CreateIndex
CREATE INDEX "WorkShiftAssignment_date_idx" ON "WorkShiftAssignment"("date");

-- CreateIndex
CREATE INDEX "WorkShiftAssignment_shiftTemplateId_idx" ON "WorkShiftAssignment"("shiftTemplateId");

-- Seed fixed shift templates
INSERT INTO "ShiftTemplate" ("id", "code", "name", "startTime", "endTime", "breakMinutes", "isActive", "createdAt", "updatedAt")
VALUES
  ('shift_t1', 'T1', 'Turno 1', '08:00', '17:00', 60, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('shift_t2', 'T2', 'Turno 2', '09:00', '18:00', 60, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('shift_t3', 'T3', 'Turno 3', '10:00', '19:00', 60, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('shift_t4', 'T4', 'Turno 4', '11:00', '20:00', 60, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('shift_t5', 'T5', 'Turno 5', '13:00', '22:00', 60, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('shift_t8', 'T8', 'Turno 8', '12:00', '21:00', 60, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
