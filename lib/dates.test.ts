import { describe, expect, it } from "vitest";

import {
  businessDaysBetween,
  epochDayToIso,
  formatDisplayDate,
  inclusiveDaysBetween,
  isoToEpochDay,
} from "./dates";

describe("dates", () => {
  it("formats ISO dates for display", () => {
    expect(formatDisplayDate("2026-07-04")).toBe("04-07-2026");
  });

  it("converts ISO dates to epoch days and back without timezone drift", () => {
    const epochDay = isoToEpochDay("2026-07-04");

    expect(epochDayToIso(epochDay)).toBe("2026-07-04");
  });

  it("counts inclusive calendar days", () => {
    expect(inclusiveDaysBetween("2026-07-04", "2026-07-06")).toBe(3);
  });

  it("counts business days excluding weekends", () => {
    expect(businessDaysBetween("2026-07-03", "2026-07-06")).toBe(2);
  });
});
