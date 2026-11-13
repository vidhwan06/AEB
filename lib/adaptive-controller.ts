import type { ReadingProfile } from "@/lib/reading-profile";
import type { DistanceCalibration, VisionSnapshot } from "@/lib/vision-metrics";

export type AdaptiveSuggestion = {
  currentFontSize: number;
  suggestedFontSize: number;
  baselineFontSize: number;
  referenceDistanceCm: number;
  currentDistanceCm: number;
  distanceChangePercent: number;
  direction: "increase" | "decrease";
};

/**
 * Suggests a bounded typography adjustment to approximately preserve the
 * reference text's angular size as the viewer changes distance.
 *
 * This is a display-sizing heuristic, not eyesight measurement or treatment.
 * Suggestions require centered, front-facing, level tracking and user approval.
 */
export function getAdaptiveSuggestion(
  distanceCm: number,
  calibration: DistanceCalibration | null,
  profile: ReadingProfile,
  snapshot: VisionSnapshot | null,
): AdaptiveSuggestion | null {
  if (
    !calibration ||
    !Number.isFinite(distanceCm) ||
    distanceCm < 20 ||
    distanceCm > 150 ||
    !Number.isFinite(calibration.referenceDistanceCm) ||
    calibration.referenceDistanceCm < 20 ||
    calibration.referenceDistanceCm > 150 ||
    !Number.isFinite(calibration.baselineFontSize) ||
    (calibration.baselineFontSize ?? 0) < 16 ||
    (calibration.baselineFontSize ?? 0) > 30 ||
    !snapshot ||
    snapshot.framing !== "Centered" ||
    snapshot.headTurn !== "Facing camera" ||
    snapshot.headTilt !== "Level"
  ) {
    return null;
  }

  const baselineFontSize = calibration.baselineFontSize as number;
  const ratio = distanceCm / calibration.referenceDistanceCm;
  const distanceChangePercent = (ratio - 1) * 100;

  // Ignore small fluctuations around the user's own measured reference.
  if (Math.abs(distanceChangePercent) < 10) return null;

  // Approximate angular-size compensation, deliberately capped to ±2 CSS px.
  const proportionalSize = baselineFontSize * ratio;
  const lowerBound = Math.max(16, baselineFontSize - 2);
  const upperBound = Math.min(30, baselineFontSize + 2);
  const suggestedFontSize = Math.min(
    upperBound,
    Math.max(lowerBound, Math.round(proportionalSize)),
  );

  if (suggestedFontSize === profile.fontSize) return null;

  return {
    currentFontSize: profile.fontSize,
    suggestedFontSize,
    baselineFontSize,
    referenceDistanceCm: calibration.referenceDistanceCm,
    currentDistanceCm: distanceCm,
    distanceChangePercent,
    direction: suggestedFontSize > profile.fontSize ? "increase" : "decrease",
  };
}
