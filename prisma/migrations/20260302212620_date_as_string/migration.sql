-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_LeaveRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "comment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "decisionBy" TEXT,
    "decisionAt" DATETIME,
    "decisionNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "LeaveRequest_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
-- Preserve data but strip the time part so we keep calendar dates exactly as stored.
INSERT INTO "new_LeaveRequest" ("comment", "createdAt", "decisionAt", "decisionBy", "decisionNote", "employeeId", "endDate", "id", "startDate", "status", "updatedAt")
SELECT
  "comment",
  "createdAt",
  "decisionAt",
  "decisionBy",
  "decisionNote",
  "employeeId",
  substr("endDate", 1, 10)  AS "endDate",
  "id",
  substr("startDate", 1, 10) AS "startDate",
  "status",
  "updatedAt"
FROM "LeaveRequest";
DROP TABLE "LeaveRequest";
ALTER TABLE "new_LeaveRequest" RENAME TO "LeaveRequest";
CREATE INDEX "LeaveRequest_employeeId_idx" ON "LeaveRequest"("employeeId");
CREATE INDEX "LeaveRequest_status_idx" ON "LeaveRequest"("status");
CREATE INDEX "LeaveRequest_startDate_endDate_idx" ON "LeaveRequest"("startDate", "endDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
