import { describe, expect, it } from "vitest";
import { estimateDistanceCm, getVisionSnapshot, median, type Landmark } from "@/lib/vision-metrics";

function makeCenteredFace(): Landmark[] {
  const points = Array.from({ length: 478 }, () => ({ x: 0.5, y: 0.5 }));
  points[10] = { x: 0.5, y: 0.2 };
  points[152] = { x: 0.5, y: 0.8 };
  points[234] = { x: 0.3, y: 0.5 };
  points[454] = { x: 0.7, y: 0.5 };
  points[33] = { x: 0.38, y: 0.4 };
  points[133] = { x: 0.42, y: 0.4 };
  points[362] = { x: 0.58, y: 0.4 };
  points[263] = { x: 0.62, y: 0.4 };
  points[1] = { x: 0.5, y: 0.5 };
  return points;
}

describe("getVisionSnapshot", () => {
  it("returns centered face geometry for valid landmarks", () => {
    const snapshot = getVisionSnapshot(makeCenteredFace(), 640, 480);
    expect(snapshot).not.toBeNull();
    expect(snapshot?.framing).toBe("Centered");
    expect(snapshot?.headTurn).toBe("Facing camera");
    expect(snapshot?.headTilt).toBe("Level");
    expect(snapshot?.eyeSpanPx).toBeCloseTo(128, 0);
  });

  it("rejects too few landmarks and invalid dimensions", () => {
    expect(getVisionSnapshot(makeCenteredFace().slice(0, 300), 640, 480)).toBeNull();
    expect(getVisionSnapshot(makeCenteredFace(), 0, 480)).toBeNull();
    expect(getVisionSnapshot(makeCenteredFace(), 640, -1)).toBeNull();
  });

  it("rejects degenerate eye geometry", () => {
    const points = makeCenteredFace();
    points[33] = { x: 0.5, y: 0.4 };
    points[133] = { x: 0.5, y: 0.4 };
    points[362] = { x: 0.5, y: 0.4 };
    points[263] = { x: 0.5, y: 0.4 };
    expect(getVisionSnapshot(points, 640, 480)).toBeNull();
  });
});

describe("estimateDistanceCm", () => {
  const calibration = { referenceEyeSpanPx: 200, referenceDistanceCm: 50 };
  it("returns the reference distance at the calibrated eye span", () => {
    expect(estimateDistanceCm(200, calibration)).toBe(50);
  });
  it("estimates farther and closer distances proportionally", () => {
    expect(estimateDistanceCm(100, calibration)).toBe(100);
    expect(estimateDistanceCm(250, calibration)).toBe(40);
  });
  it("rejects missing, invalid, or out-of-range estimates", () => {
    expect(estimateDistanceCm(100, null)).toBeNull();
    expect(estimateDistanceCm(0, calibration)).toBeNull();
    expect(estimateDistanceCm(Number.NaN, calibration)).toBeNull();
    expect(estimateDistanceCm(100, { referenceEyeSpanPx: 0, referenceDistanceCm: 50 })).toBeNull();
    expect(estimateDistanceCm(500, calibration)).toBeNull();
    expect(estimateDistanceCm(50, calibration)).toBeNull();
  });
});

describe("median", () => {
  it("returns the median for odd and even samples", () => {
    expect(median([9, 1, 5])).toBe(5);
    expect(median([8, 2, 6, 4])).toBe(5);
  });
  it("returns null for an empty sample", () => {
    expect(median([])).toBeNull();
  });
});
