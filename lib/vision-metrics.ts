export type Landmark = { x: number; y: number; z?: number };

export type DistanceCalibration = {
  referenceEyeSpanPx: number;
  referenceDistanceCm: number;
};

export type VisionSnapshot = {
  centerX: number;
  centerY: number;
  faceWidthRatio: number;
  eyeSpanPx: number;
  framing: "Centered" | "Shift toward center" | "Move into frame";
  headTurn: "Facing camera" | "Slightly turned";
  headTilt: "Level" | "Tilted";
  tiltDegrees: number;
};

function averagePoint(points: Landmark[]) {
  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  };
}

/**
 * Derives coarse, non-diagnostic geometry from Face Landmarker landmarks.
 * These values are intended for framing feedback, not gaze or vision assessment.
 */
export function getVisionSnapshot(
  landmarks: Landmark[],
  frameWidth: number,
  frameHeight: number,
): VisionSnapshot | null {
  if (landmarks.length < 468 || frameWidth <= 0 || frameHeight <= 0) {
    return null;
  }

  const leftEye = averagePoint([landmarks[33], landmarks[133]]);
  const rightEye = averagePoint([landmarks[362], landmarks[263]]);
  const eyeMidpoint = averagePoint([leftEye, rightEye]);
  const nose = landmarks[1];

  const eyeSpanPx = Math.hypot(
    (rightEye.x - leftEye.x) * frameWidth,
    (rightEye.y - leftEye.y) * frameHeight,
  );

  if (!Number.isFinite(eyeSpanPx) || eyeSpanPx < 8) return null;

  const xs = landmarks.map((point) => point.x);
  const ys = landmarks.map((point) => point.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  const faceWidthRatio = maxX - minX;

  let framing: VisionSnapshot["framing"] = "Centered";
  if (centerX < 0.34 || centerX > 0.66 || centerY < 0.22 || centerY > 0.78) {
    framing = "Move into frame";
  } else if (centerX < 0.43 || centerX > 0.57 || centerY < 0.34 || centerY > 0.66) {
    framing = "Shift toward center";
  }

  // Nose displacement relative to eye spacing is a rough head-turn cue only.
  const noseOffset = Math.abs(nose.x - eyeMidpoint.x) / Math.max(rightEye.x - leftEye.x, 0.001);
  const headTurn = noseOffset > 0.13 ? "Slightly turned" : "Facing camera";

  const tiltDegrees = Math.atan2(
    (rightEye.y - leftEye.y) * frameHeight,
    (rightEye.x - leftEye.x) * frameWidth,
  ) * (180 / Math.PI);

  return {
    centerX,
    centerY,
    faceWidthRatio,
    eyeSpanPx,
    framing,
    headTurn,
    headTilt: Math.abs(tiltDegrees) > 8 ? "Tilted" : "Level",
    tiltDegrees,
  };
}

/**
 * One-point proportional estimate. It is only meaningful after the user
 * measures a reference distance with the same camera and framing.
 */
export function estimateDistanceCm(
  currentEyeSpanPx: number,
  calibration: DistanceCalibration | null,
): number | null {
  if (
    !calibration ||
    !Number.isFinite(currentEyeSpanPx) ||
    currentEyeSpanPx <= 0 ||
    !Number.isFinite(calibration.referenceEyeSpanPx) ||
    calibration.referenceEyeSpanPx <= 0 ||
    !Number.isFinite(calibration.referenceDistanceCm) ||
    calibration.referenceDistanceCm <= 0
  ) {
    return null;
  }

  const estimate =
    calibration.referenceDistanceCm *
    (calibration.referenceEyeSpanPx / currentEyeSpanPx);

  if (!Number.isFinite(estimate) || estimate < 20 || estimate > 150) {
    return null;
  }

  return estimate;
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle];
}
