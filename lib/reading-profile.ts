export type ReadingTheme = "paper" | "night" | "contrast";
export type FontWeight = "400" | "500" | "600";
export type FontFamily = "sans" | "serif";

export type ReadingProfile = {
  fontSize: number;
  fontWeight: FontWeight;
  lineHeight: number;
  letterSpacing: number;
  contentWidth: number;
  fontFamily: FontFamily;
  theme: ReadingTheme;
};

export const DEFAULT_READING_PROFILE: ReadingProfile = {
  fontSize: 19,
  fontWeight: "400",
  lineHeight: 1.75,
  letterSpacing: 0,
  contentWidth: 680,
  fontFamily: "sans",
  theme: "paper",
};

const clamp = (value: unknown, fallback: number, min: number, max: number) => {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, value));
};

export function normalizeReadingProfile(value: unknown): ReadingProfile {
  const candidate =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};

  const fontWeight: FontWeight =
    candidate.fontWeight === "500" || candidate.fontWeight === "600"
      ? candidate.fontWeight
      : "400";

  const fontFamily: FontFamily =
    candidate.fontFamily === "serif" ? "serif" : "sans";

  const theme: ReadingTheme =
    candidate.theme === "night" || candidate.theme === "contrast"
      ? candidate.theme
      : "paper";

  return {
    fontSize: clamp(candidate.fontSize, DEFAULT_READING_PROFILE.fontSize, 16, 30),
    fontWeight,
    lineHeight: clamp(candidate.lineHeight, DEFAULT_READING_PROFILE.lineHeight, 1.4, 2.1),
    letterSpacing: clamp(candidate.letterSpacing, DEFAULT_READING_PROFILE.letterSpacing, 0, 0.08),
    contentWidth: clamp(candidate.contentWidth, DEFAULT_READING_PROFILE.contentWidth, 520, 800),
    fontFamily,
    theme,
  };
}
