-- Add request type to distinguish vacations from approved days off.
ALTER TABLE "LeaveRequest" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'VACATION';

