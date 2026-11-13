import { ArrowUpRight, BookOpen, CircleHelp, Eye, Focus, Sparkles, Waves } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { StatCard } from "@/components/stat-card";

export default function Home() {
  return (
    <main className="flex min-h-screen">
      <Sidebar />
      <section className="min-w-0 flex-1 px-5 py-6 sm:px-8 lg:px-11 lg:py-9">
        <header className="flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-500">AEB / PERSONAL WORKSPACE</div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Your visual workspace</h1>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[.03] px-3 py-2 text-xs text-zinc-400">
            <span className="h-2 w-2 rounded-full bg-amber-400" /> Setup in progress
          </div>
        </header>

        <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Vision tracking" value="Not active" note="Camera permission not requested" />
          <StatCard label="Reading profile" value="Default" note="Personal calibration pending" />
          <StatCard label="Display mode" value="Standard" note="Adaptive controls coming next" />
          <StatCard label="Session status" value="Ready" note="Local prototype environment" />
        </div>

        <div className="mt-7 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
          <div className="panel overflow-hidden rounded-3xl">
            <div className="flex items-center justify-between border-b border-white/[.07] px-6 py-5">
              <div><div className="text-sm font-medium">Adaptive reading environment</div><div className="mt-1 text-xs text-zinc-500">A preview of your personalized reading space</div></div>
              <span className="rounded-full bg-violet/10 px-3 py-1 text-[10px] text-violet">PREVIEW</span>
            </div>
            <div className="p-6 sm:p-9">
              <div className="mb-7 flex items-center gap-2 text-xs text-zinc-500"><BookOpen size={14}/> READING SAMPLE <span className="ml-auto">2 MIN READ</span></div>
              <h2 className="max-w-xl text-3xl font-medium leading-tight tracking-tight sm:text-4xl">Make room for a more comfortable way to read.</h2>
              <p className="mt-5 max-w-2xl text-[15px] leading-8 text-zinc-400">A good reading experience should feel clear, calm and effortless. AEB is being designed to adapt the presentation of digital content to your preferences and viewing conditions.</p>
              <p className="mt-4 max-w-2xl text-[15px] leading-8 text-zinc-400">This preview is a starting point. In the next milestone, you will be able to tune text size, line spacing, letter spacing and contrast, then save a personal reading profile.</p>
              <a href="/reading-lab" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-violet px-4 py-3 text-sm font-semibold text-[#100d1c] transition hover:brightness-110">Open reading lab <ArrowUpRight size={16}/></a>
            </div>
          </div>

          <div className="space-y-5">
            <div className="panel rounded-3xl p-6">
              <div className="flex items-center gap-2 text-sm font-medium"><Focus size={17} className="text-violet"/> System readiness</div>
              <div className="mt-6 space-y-5">
                {[
                  ["Adaptive reading UI", "Foundation"],
                  ["Local preference storage", "Next milestone"],
                  ["Webcam vision engine", "Planned"],
                  ["Automatic adaptation", "Planned"]
                ].map(([name, status], i) => (
                  <div key={name} className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3"><span className={`h-2 w-2 rounded-full ${i === 0 ? "bg-emerald-300" : "bg-zinc-700"}`}/><span className="text-xs text-zinc-300">{name}</span></div>
                    <span className="text-[10px] text-zinc-500">{status}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-violet/15 bg-gradient-to-br from-violet/[.13] to-transparent p-6 shadow-glow">
              <div className="flex items-center gap-2 text-sm font-medium"><Waves size={17} className="text-violet"/> Built around you</div>
              <p className="mt-3 text-sm leading-6 text-zinc-400">AEB will begin with your own reading preferences. Camera-based signals will be introduced only after the reading controls are working reliably.</p>
              <div className="mt-5 flex items-center gap-2 text-xs text-violet"><Sparkles size={14}/> Personalization-first design</div>
            </div>
          </div>
        </div>
        <footer className="mt-8 flex items-center gap-2 text-[11px] text-zinc-600"><CircleHelp size={13}/> AEB is a readability prototype, not a medical vision-correction device.</footer>
      </section>
    </main>
  );
}