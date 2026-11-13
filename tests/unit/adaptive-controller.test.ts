import { describe, expect, it } from "vitest";
import { getAdaptiveSuggestion } from "@/lib/adaptive-controller";
import { DEFAULT_READING_PROFILE } from "@/lib/reading-profile";
import type { DistanceCalibration, VisionSnapshot } from "@/lib/vision-metrics";

const alignedSnapshot: VisionSnapshot = {
  centerX: 0.5, centerY: 0.5, faceWidthRatio: 0.4, eyeSpanPx: 120,
  framing: "Centered", headTurn: "Facing camera", headTilt: "Level", tiltDegrees: 0,
};
const calibration: DistanceCalibration = {
  referenceEyeSpanPx: 200, referenceDistanceCm: 50, baselineFontSize: 20,
};

describe("getAdaptiveSuggestion", () => {
  it("suggests a small increase when the viewer moves farther away", () => {
    const suggestion = getAdaptiveSuggestion(60, calibration, DEFAULT_READING_PROFILE, alignedSnapshot);
    expect(suggestion?.suggestedFontSize).toBe(22);
    expect(suggestion?.direction).toBe("increase");
  });

  it("suggests a small decrease when the viewer moves closer", () => {
    const suggestion = getAdaptiveSuggestion(40, calibration, DEFAULT_READING_PROFILE, alignedSnapshot);
    expect(suggestion?.suggestedFontSize).toBe(18);
    expect(suggestion?.direction).toBe("decrease");
  });

  it("ignores changes inside the 10 percent deadband", () => {
    expect(getAdaptiveSuggestion(54, calibration, DEFAULT_READING_PROFILE, alignedSnapshot)).toBeNull();
  });

  it("caps the recommendation at two pixels from baseline", () => {
    const far = getAdaptiveSuggestion(150, calibration, DEFAULT_READING_PROFILE, alignedSnapshot);
    const near = getAdaptiveSuggestion(20, calibration, DEFAULT_READING_PROFILE, alignedSnapshot);
    expect(far?.suggestedFontSize).toBeLessThanOrEqual(22);
    expect(near?.suggestedFontSize).toBeGreaterThanOrEqual(18);
  });

  it("requires valid calibration, baseline and aligned tracking", () => {
    expect(getAdaptiveSuggestion(65, null, DEFAULT_READING_PROFILE, alignedSnapshot)).toBeNull();
    expect(getAdaptiveSuggestion(65, { ...calibration, baselineFontSize: undefined }, DEFAULT_READING_PROFILE, alignedSnapshot)).toBeNull();
    expect(getAdaptiveSuggestion(65, calibration, DEFAULT_READING_PROFILE, { ...alignedSnapshot, framing: "Shift toward center" })).toBeNull();
    expect(getAdaptiveSuggestion(65, calibration, DEFAULT_READING_PROFILE, { ...alignedSnapshot, headTurn: "Slightly turned" })).toBeNull();
    expect(getAdaptiveSuggestion(65, calibration, DEFAULT_READING_PROFILE, { ...alignedSnapshot, headTilt: "Tilted" })).toBeNull();
  });

  it("rejects distances outside 20 to 150 cm and duplicate settings", () => {
    expect(getAdaptiveSuggestion(10, calibration, DEFAULT_READING_PROFILE, alignedSnapshot)).toBeNull();
    expect(getAdaptiveSuggestion(200, calibration, DEFAULT_READING_PROFILE, alignedSnapshot)).toBeNull();
    expect(getAdaptiveSuggestion(60, calibration, { ...DEFAULT_READING_PROFILE, fontSize: 22 }, alignedSnapshot)).toBeNull();
  });
});
