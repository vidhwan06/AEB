export const DISTANCE_VALIDATION_STORAGE_KEY = "aeb-distance-validation-v1";

export const VALIDATION_CONDITIONS = [
  "Typical room light",
  "Bright room",
  "Dim room",
  "Wearing glasses",
  "Other",
] as const;

export type ValidationCondition = (typeof VALIDATION_CONDITIONS)[number];

export type DistanceValidationTrial = {
  id: string;
  recordedAt: string;
  condition: ValidationCondition;
  measuredDistanceCm: number;
  estimatedDistanceCm: number;
  absoluteErrorCm: number;
  absoluteErrorPercent: number;
};

export type DistanceValidationSummary = {
  count: number;
  meanAbsoluteErrorCm: number | null;
  meanAbsolutePercentageError: number | null;
  withinTenPercentCount: number;
  withinTenPercentPercent: number | null;
  maxAbsoluteErrorCm: number | null;
};

export function createDistanceValidationTrial(input: {
  id: string;
  recordedAt: string;
  condition: ValidationCondition;
  measuredDistanceCm: number;
  estimatedDistanceCm: number;
}): DistanceValidationTrial | null {
  const { measuredDistanceCm, estimatedDistanceCm, condition } = input;

  if (
    !input.id ||
    !Number.isFinite(Date.parse(input.recordedAt)) ||
    !VALIDATION_CONDITIONS.includes(condition) ||
    !Number.isFinite(measuredDistanceCm) ||
    !Number.isFinite(estimatedDistanceCm) ||
    measuredDistanceCm < 20 ||
    measuredDistanceCm > 150 ||
    estimatedDistanceCm < 20 ||
    estimatedDistanceCm > 150
  ) {
    return null;
  }

  const absoluteErrorCm = Math.abs(estimatedDistanceCm - measuredDistanceCm);
  const absoluteErrorPercent = (absoluteErrorCm / measuredDistanceCm) * 100;

  return { ...input, absoluteErrorCm, absoluteErrorPercent };
}

export function isDistanceValidationTrial(value: unknown): value is DistanceValidationTrial {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    candidate.id.length > 0 &&
    typeof candidate.recordedAt === "string" &&
    Number.isFinite(Date.parse(candidate.recordedAt)) &&
    typeof candidate.condition === "string" &&
    VALIDATION_CONDITIONS.includes(candidate.condition as ValidationCondition) &&
    typeof candidate.measuredDistanceCm === "number" &&
    Number.isFinite(candidate.measuredDistanceCm) &&
    candidate.measuredDistanceCm >= 20 &&
    candidate.measuredDistanceCm <= 150 &&
    typeof candidate.estimatedDistanceCm === "number" &&
    Number.isFinite(candidate.estimatedDistanceCm) &&
    candidate.estimatedDistanceCm >= 20 &&
    candidate.estimatedDistanceCm <= 150 &&
    typeof candidate.absoluteErrorCm === "number" &&
    Number.isFinite(candidate.absoluteErrorCm) &&
    typeof candidate.absoluteErrorPercent === "number" &&
    Number.isFinite(candidate.absoluteErrorPercent) &&
    Math.abs(candidate.absoluteErrorCm - Math.abs(candidate.estimatedDistanceCm - candidate.measuredDistanceCm)) < 1e-6 &&
    Math.abs(candidate.absoluteErrorPercent - (candidate.absoluteErrorCm / candidate.measuredDistanceCm) * 100) < 1e-6
  );
}

export function getDistanceValidationSummary(
  trials: DistanceValidationTrial[],
): DistanceValidationSummary {
  if (trials.length === 0) {
    return {
      count: 0,
      meanAbsoluteErrorCm: null,
      meanAbsolutePercentageError: null,
      withinTenPercentCount: 0,
      withinTenPercentPercent: null,
      maxAbsoluteErrorCm: null,
    };
  }

  const totalError = trials.reduce((sum, trial) => sum + trial.absoluteErrorCm, 0);
  const totalPercentageError = trials.reduce((sum, trial) => sum + trial.absoluteErrorPercent, 0);
  const withinTenPercentCount = trials.filter((trial) => trial.absoluteErrorPercent <= 10).length;

  return {
    count: trials.length,
    meanAbsoluteErrorCm: totalError / trials.length,
    meanAbsolutePercentageError: totalPercentageError / trials.length,
    withinTenPercentCount,
    withinTenPercentPercent: (withinTenPercentCount / trials.length) * 100,
    maxAbsoluteErrorCm: Math.max(...trials.map((trial) => trial.absoluteErrorCm)),
  };
}
