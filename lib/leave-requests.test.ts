import { describe, expect, it } from "vitest";

import {
  requestDaysLabel,
  requestTypeBlocksScheduleMessage,
  requestTypeLabels,
  requestTypeScheduleLabels,
} from "./leave-requests";

describe("leave request labels", () => {
  it("labels request types for user-facing screens", () => {
    expect(requestTypeLabels.VACATION).toBe("Vacaciones");
    expect(requestTypeLabels.DAY_OFF).toBe("Dia libre");
  });

  it("labels approved requests that block schedule assignments", () => {
    expect(requestTypeScheduleLabels.VACATION).toBe("Vacaciones");
    expect(requestTypeScheduleLabels.DAY_OFF).toBe("Dia libre aprobado");
  });

  it("uses different schedule blocking messages by request type", () => {
    expect(requestTypeBlocksScheduleMessage("VACATION")).toContain("vacaciones");
    expect(requestTypeBlocksScheduleMessage("DAY_OFF")).toContain("dia libre aprobado");
  });

  it("describes vacation days as business days and day off as calendar days", () => {
    expect(requestDaysLabel("VACATION", 3)).toBe("3 dias habiles");
    expect(requestDaysLabel("DAY_OFF", 1)).toBe("1 dia");
    expect(requestDaysLabel("DAY_OFF", 2)).toBe("2 dias");
  });
});
