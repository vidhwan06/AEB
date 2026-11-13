"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen, Check, RotateCcw, Save, SlidersHorizontal, Sparkles } from "lucide-react";
import {
  DEFAULT_READING_PROFILE,
  normalizeReadingProfile,
  READING_PROFILE_STORAGE_KEY,
  type FontFamily,
  type FontWeight,
  type ReadingProfile,
  type ReadingTheme,
} from "@/lib/reading-profile";

const themes: { id: ReadingTheme; label: string; description: string; swatches: string[] }[] = [
  { id: "paper", label: "Warm paper", description: "Soft, warm reading surface", swatches: ["#F4F0E8", "#292820"] },
  { id: "night", label: "Night", description: "Muted light on a dark surface", swatches: ["#171923", "#EEEAFB"] },
  { id: "contrast", label: "High contrast", description: "Maximum black and white contrast", swatches: ["#000000", "#FFFFFF"] },
];

const themeStyles: Record<ReadingTheme, { frame: string; surface: string; text: string; muted: string; line: string }> = {
  paper: { frame: "#E9E3D8", surface: "#F7F3EB", text: "#292820", muted: "#716B60", line: "#E2DBCF" },
  night: { frame: "#10121A", surface: "#191C27", text: "#F0EEF8", muted: "#A9A7B6", line: "#303342" },
  contrast: { frame: "#050505", surface: "#000000", text: "#FFFFFF", muted: "#F0F0F0", line: "#FFFFFF" },
};

function RangeControl({
  id,
  label,
  value,
  min,
  max,
  step,
  displayValue,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-xs font-medium text-zinc-300">{label}</label>
        <output htmlFor={id} className="text-xs tabular-nums text-violet">{displayValue}</output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-1.5 w-full cursor-pointer accent-[#9B8CFF]"
      />
      <div className="mt-1 flex justify-between text-[10px] text-zinc-600">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

function ChoiceButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`rounded-xl border px-3 py-2 text-xs transition ${selected ? "border-violet/50 bg-violet/10 text-violet" : "border-white/[.09] bg-white/[.025] text-zinc-400 hover:border-white/20 hover:text-white"}`}
    >
      {children}
    </button>
  );
}

export function ReadingLabClient() {
  const [profile, setProfile] = useState<ReadingProfile>(DEFAULT_READING_PROFILE);
  const [hydrated, setHydrated] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [status, setStatus] = useState("Default settings");

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== READING_PROFILE_STORAGE_KEY) return;
      try {
        setProfile(event.newValue ? normalizeReadingProfile(JSON.parse(event.newValue)) : DEFAULT_READING_PROFILE);
        setIsDirty(false);
        setStatus(event.newValue ? "Updated from Vision Monitor" : "Defaults restored in another tab");
      } catch {
        setStatus("Could not read the updated profile");
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(READING_PROFILE_STORAGE_KEY);
      if (stored) {
        setProfile(normalizeReadingProfile(JSON.parse(stored)));
        setStatus("Saved profile restored");
      }
    } catch {
      setStatus("Browser storage unavailable");
    } finally {
      setHydrated(true);
    }
  }, []);

  function update<K extends keyof ReadingProfile>(key: K, value: ReadingProfile[K]) {
    setProfile((current) => ({ ...current, [key]: value }));
    setIsDirty(true);
    setStatus("Unsaved changes");
  }

  function saveProfile() {
    try {
      window.localStorage.setItem(READING_PROFILE_STORAGE_KEY, JSON.stringify(profile));
      setIsDirty(false);
      setStatus("Profile saved on this device");
    } catch {
      setStatus("Could not save in this browser");
    }
  }

  function resetProfile() {
    setProfile(DEFAULT_READING_PROFILE);
    setIsDirty(false);
    try {
      window.localStorage.removeItem(READING_PROFILE_STORAGE_KEY);
      setStatus("Default settings restored");
    } catch {
      setStatus("Defaults restored for this session");
    }
  }

  const theme = themeStyles[profile.theme];

  return (
    <div className="min-w-0 flex-1 px-5 py-6 sm:px-8 lg:px-11 lg:py-9">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/" className="mb-5 inline-flex items-center gap-2 text-xs text-zinc-500 transition hover:text-white lg:hidden">
            <ArrowLeft size={14}/> Back to overview
          </Link>
          <div className="text-xs tracking-[.12em] text-zinc-500">WORKSPACE / READING LAB</div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Shape your reading space</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">Tune the presentation until it feels comfortable. Every adjustment updates the preview immediately.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[11px] text-zinc-500" aria-live="polite">{hydrated ? status : "Loading preferences…"}</span>
          <button type="button" onClick={resetProfile} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-xs text-zinc-300 transition hover:bg-white/[.05]">
            <RotateCcw size={14}/> Reset
          </button>
          <button type="button" onClick={saveProfile} disabled={!hydrated} className="inline-flex items-center gap-2 rounded-xl bg-violet px-4 py-2.5 text-xs font-semibold text-[#100d1c] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
            {status === "Profile saved on this device" || status === "Saved profile restored" ? <Check size={14}/> : <Save size={14}/>}
            {isDirty || (status !== "Profile saved on this device" && status !== "Saved profile restored") ? "Save profile" : "Saved"}
          </button>
        </div>
      </header>

      <div className="mt-8 grid items-start gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <section className="panel rounded-3xl p-5 sm:p-6" aria-labelledby="controls-heading">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet/10 text-violet"><SlidersHorizontal size={17}/></div>
            <div>
              <h2 id="controls-heading" className="text-sm font-semibold">Reading controls</h2>
              <p className="mt-0.5 text-[11px] text-zinc-500">Changes are previewed live</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-4">
              <div className="text-[10px] font-semibold uppercase tracking-[.18em] text-zinc-500">Typography</div>
              <RangeControl id="font-size" label="Text size" value={profile.fontSize} min={16} max={30} step={1} displayValue={`${profile.fontSize}px`} onChange={(value) => update("fontSize", value)}/>
              <RangeControl id="line-height" label="Line spacing" value={profile.lineHeight} min={1.4} max={2.1} step={0.05} displayValue={profile.lineHeight.toFixed(2)} onChange={(value) => update("lineHeight", value)}/>
              <RangeControl id="letter-spacing" label="Letter spacing" value={profile.letterSpacing} min={0} max={0.08} step={0.01} displayValue={`${profile.letterSpacing.toFixed(2)}em`} onChange={(value) => update("letterSpacing", value)}/>
              <RangeControl id="content-width" label="Reading width" value={profile.contentWidth} min={520} max={800} step={20} displayValue={`${profile.contentWidth}px`} onChange={(value) => update("contentWidth", value)}/>
            </div>

            <div className="border-t border-white/[.07] pt-5">
              <div className="mb-3 text-[10px] font-semibold uppercase tracking-[.18em] text-zinc-500">Font weight</div>
              <div className="flex flex-wrap gap-2">
                {([{ value: "400", label: "Regular" }, { value: "500", label: "Medium" }, { value: "600", label: "Semibold" }] as { value: FontWeight; label: string }[]).map((item) => (
                  <ChoiceButton key={item.value} selected={profile.fontWeight === item.value} onClick={() => update("fontWeight", item.value)}>{item.label}</ChoiceButton>
                ))}
              </div>
            </div>

            <div className="border-t border-white/[.07] pt-5">
              <div className="mb-3 text-[10px] font-semibold uppercase tracking-[.18em] text-zinc-500">Typeface</div>
              <div className="flex flex-wrap gap-2">
                <ChoiceButton selected={profile.fontFamily === "sans"} onClick={() => update("fontFamily", "sans" satisfies FontFamily)}>Sans serif</ChoiceButton>
                <ChoiceButton selected={profile.fontFamily === "serif"} onClick={() => update("fontFamily", "serif" satisfies FontFamily)}>Serif</ChoiceButton>
              </div>
            </div>

            <div className="border-t border-white/[.07] pt-5">
              <div className="mb-3 text-[10px] font-semibold uppercase tracking-[.18em] text-zinc-500">Reading surface</div>
              <div className="grid grid-cols-1 gap-2">
                {themes.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={profile.theme === item.id}
                    onClick={() => update("theme", item.id)}
                    className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${profile.theme === item.id ? "border-violet/50 bg-violet/[.07]" : "border-white/[.08] hover:border-white/20"}`}
                  >
                    <span className="flex h-8 w-12 shrink-0 overflow-hidden rounded-lg border border-white/10">
                      <span className="flex-1" style={{ background: item.swatches[0] }}/>
                      <span className="flex-1" style={{ background: item.swatches[1] }}/>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-medium text-zinc-200">{item.label}</span>
                      <span className="mt-0.5 block text-[10px] text-zinc-500">{item.description}</span>
                    </span>
                    {profile.theme === item.id && <Check size={15} className="text-violet"/>}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="min-w-0" aria-labelledby="preview-heading">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 id="preview-heading" className="text-sm font-semibold">Live reading preview</h2>
              <p className="mt-1 text-[11px] text-zinc-500">A sample article to compare your settings</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300/15 bg-emerald-300/[.06] px-2.5 py-1 text-[10px] text-emerald-200"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300"/> LIVE</span>
          </div>

          <div className="rounded-3xl p-3 sm:p-5" style={{ backgroundColor: theme.frame }}>
            <article className="mx-auto rounded-2xl px-5 py-7 shadow-2xl sm:px-9 sm:py-10" style={{ backgroundColor: theme.surface, color: theme.text, maxWidth: profile.contentWidth + 72 }}>
              <div className="mb-7 flex items-center justify-between gap-3 border-b pb-4 text-[10px] font-semibold uppercase tracking-[.16em]" style={{ borderColor: theme.line, color: theme.muted }}>
                <span className="flex items-center gap-2"><BookOpen size={13}/> The reading journal</span>
                <span>4 min read</span>
              </div>
              <div className="mx-auto" style={{ maxWidth: profile.contentWidth, fontFamily: profile.fontFamily === "serif" ? "Georgia, 'Times New Roman', serif" : "Arial, Helvetica, sans-serif" }}>
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-[.18em]" style={{ color: theme.muted }}>A more considered screen</p>
                <h3 className="mb-5 text-3xl leading-tight tracking-tight sm:text-4xl" style={{ fontWeight: 600 }}>Designing a calmer digital reading experience</h3>
                <p className="mb-5" style={{ fontSize: profile.fontSize, fontWeight: Number(profile.fontWeight), lineHeight: profile.lineHeight, letterSpacing: `${profile.letterSpacing}em` }}>
                  Reading on a screen is shaped by more than the words themselves. The size of the type, the space between lines, the width of a paragraph and the contrast of the page all influence how a passage feels to read.
                </p>
                <p className="mb-5" style={{ fontSize: profile.fontSize, fontWeight: Number(profile.fontWeight), lineHeight: profile.lineHeight, letterSpacing: `${profile.letterSpacing}em` }}>
                  A comfortable layout gives each line enough room to breathe. Some readers prefer a larger type size and generous spacing. Others prefer a compact page with a familiar typeface. There is no single setting that works equally well for everyone.
                </p>
                <h4 className="mb-3 mt-8 text-xl font-semibold">Small adjustments, personal results</h4>
                <p className="mb-5" style={{ fontSize: profile.fontSize, fontWeight: Number(profile.fontWeight), lineHeight: profile.lineHeight, letterSpacing: `${profile.letterSpacing}em` }}>
                  AEB starts by putting those choices in one place. Adjust the preview, compare the result and save the combination that suits you. Later, the project will explore how viewing conditions can inform suggestions without taking control away from the reader.
                </p>
                <div className="mt-8 rounded-xl border-l-2 py-3 pl-4 text-sm italic" style={{ borderColor: theme.muted, color: theme.muted }}>
                  A good interface should adapt to the person using it—not the other way around.
                </div>
              </div>
            </article>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="panel rounded-2xl p-4">
              <div className="text-[10px] uppercase tracking-[.16em] text-zinc-500">Current typography</div>
              <div className="mt-2 text-sm font-medium">{profile.fontSize}px · {profile.fontWeight} weight</div>
              <div className="mt-1 text-xs text-zinc-500">{profile.lineHeight.toFixed(2)} line height · {profile.letterSpacing.toFixed(2)}em tracking</div>
            </div>
            <div className="panel rounded-2xl p-4">
              <div className="text-[10px] uppercase tracking-[.16em] text-zinc-500">Profile storage</div>
              <div className="mt-2 flex items-center gap-2 text-sm font-medium"><Sparkles size={14} className="text-violet"/> This browser only</div>
              <div className="mt-1 text-xs text-zinc-500">No account or camera access required</div>
            </div>
          </div>
          <p className="mt-4 text-[11px] leading-5 text-zinc-600">These controls change the layout of this reading sample only. They do not measure eyesight, prescribe lenses or correct refractive errors.</p>
        </section>
      </div>
    </div>
  );
}
