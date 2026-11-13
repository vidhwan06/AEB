import { describe, expect, it } from "vitest";
import { DEFAULT_READING_PROFILE, normalizeReadingProfile } from "@/lib/reading-profile";

describe("normalizeReadingProfile", () => {
  it("returns defaults for non-object data", () => {
    expect(normalizeReadingProfile(null)).toEqual(DEFAULT_READING_PROFILE);
    expect(normalizeReadingProfile("invalid")).toEqual(DEFAULT_READING_PROFILE);
  });

  it("clamps numeric values to supported ranges", () => {
    const profile = normalizeReadingProfile({ fontSize: 99, lineHeight: 0.2, letterSpacing: 1, contentWidth: 1000 });
    expect(profile.fontSize).toBe(30);
    expect(profile.lineHeight).toBe(1.4);
    expect(profile.letterSpacing).toBe(0.08);
    expect(profile.contentWidth).toBe(800);
  });

  it("keeps supported choices and defaults invalid choices", () => {
    const profile = normalizeReadingProfile({ fontWeight: "600", fontFamily: "serif", theme: "contrast" });
    expect(profile.fontWeight).toBe("600");
    expect(profile.fontFamily).toBe("serif");
    expect(profile.theme).toBe("contrast");
    expect(normalizeReadingProfile({ theme: "invalid", fontFamily: "comic" }).theme).toBe("paper");
  });

  it("uses defaults for non-finite numbers", () => {
    expect(normalizeReadingProfile({ fontSize: Number.NaN }).fontSize).toBe(DEFAULT_READING_PROFILE.fontSize);
  });
});
