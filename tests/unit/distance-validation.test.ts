import { describe, expect, it } from "vitest";
import {
  createDistanceValidationTrial,
  getDistanceValidationSummary,
  isDistanceValidationTrial,
  type DistanceValidationTrial,
} from "@/lib/distance-validation";

const makeTrial = (actual: number, estimate: number, id = "trial-1"): DistanceValidationTrial => {
  const trial = createDistanceValidationTrial({
    id,
    recordedAt: "2026-11-13T10:00:00.000Z",
    condition: "Typical room light",
    measuredDistanceCm: actual,
    estimatedDistanceCm: estimate,
  });
  if (!trial) throw new Error("Expected valid trial");
  return trial;
};

describe("distance validation trial", () => {
  it("computes absolute and percentage error", () => {
    const trial = makeTrial(50, 55);
    expect(trial.absoluteErrorCm).toBe(5);
    expect(trial.absoluteErrorPercent).toBe(10);
  });

  it("rejects invalid measurements, timestamps and conditions", () => {
    expect(createDistanceValidationTrial({
      id: "bad", recordedAt: "2026-11-13T10:00:00Z", condition: "Typical room light",
      measuredDistanceCm: 10, estimatedDistanceCm: 50,
    })).toBeNull();
    expect(createDistanceValidationTrial({
      id: "bad", recordedAt: "2026-11-13T10:00:00Z", condition: "Typical room light",
      measuredDistanceCm: 50, estimatedDistanceCm: Number.NaN,
    })).toBeNull();
    expect(createDistanceValidationTrial({
      id: "bad", recordedAt: "not-a-date", condition: "Typical room light",
      measuredDistanceCm: 50, estimatedDistanceCm: 50,
    })).toBeNull();
  });

  it("validates stored trial records", () => {
    expect(isDistanceValidationTrial(makeTrial(50, 52))).toBe(true);
    expect(isDistanceValidationTrial({ id: "bad", measuredDistanceCm: "55" })).toBe(false);
  });
});

describe("distance validation summary", () => {
  it("calculates mean errors and within-10-percent percentage", () => {
    const summary = getDistanceValidationSummary([
      makeTrial(50, 55, "one"),
      makeTrial(100, 105, "two"),
    ]);
    expect(summary.count).toBe(2);
    expect(summary.meanAbsoluteErrorCm).toBe(5);
    expect(summary.meanAbsolutePercentageError).toBe(7.5);
    expect(summary.withinTenPercentCount).toBe(2);
    expect(summary.withinTenPercentPercent).toBe(100);
    expect(summary.maxAbsoluteErrorCm).toBe(5);
  });

  it("returns null metrics for an empty history", () => {
    const summary = getDistanceValidationSummary([]);
    expect(summary.count).toBe(0);
    expect(summary.meanAbsoluteErrorCm).toBeNull();
    expect(summary.meanAbsolutePercentageError).toBeNull();
  });
});
