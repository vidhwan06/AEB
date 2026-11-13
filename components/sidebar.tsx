import Link from "next/link";
import { Activity, BookOpen, Eye, Gauge, Settings2, Sparkles } from "lucide-react";

const links = [
  { label: "Overview", href: "/", icon: Gauge, key: "overview", available: true },
  { label: "Reading lab", href: "/reading-lab", icon: BookOpen, key: "reading-lab", available: true },
  { label: "Vision monitor", href: "#", icon: Eye, key: "vision-monitor", available: false },
  { label: "Calibration", href: "#", icon: Activity, key: "calibration", available: false },
  { label: "Preferences", href: "#", icon: Settings2, key: "preferences", available: false }
];

export function Sidebar({ activePath = "overview" }: { activePath?: string }) {
  return (
    <aside className="hidden w-64 shrink-0 border-r border-white/[0.07] px-5 py-7 lg:flex lg:flex-col">
      <Link href="/" className="mb-14 flex items-center gap-3 px-2">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-violet/15 text-violet">
          <Eye size={21} />
        </div>
        <div>
          <div className="text-[15px] font-semibold tracking-[.18em]">AEB</div>
          <div className="text-[10px] tracking-[.2em] text-zinc-500">ADAPTIVE EYE BALANCE</div>
        </div>
      </Link>

      <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[.2em] text-zinc-600">Workspace</div>
      <nav className="space-y-1" aria-label="Main navigation">
        {links.map(({ label, href, icon: Icon, key, available }) => {
          const active = activePath === key;
          const className = `flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition ${active ? "bg-violet/10 text-violet" : "text-zinc-400"}`;

          if (!available) {
            return (
              <div key={key} aria-disabled="true" title="Coming soon" className={`${className} cursor-not-allowed opacity-45`}>
                <Icon size={17} strokeWidth={1.8} />
                {label}
                <span className="ml-auto text-[9px] uppercase tracking-wider text-zinc-600">Soon</span>
              </div>
            );
          }

          return (
            <Link key={key} href={href} aria-current={active ? "page" : undefined} className={active ? className : `${className} hover:bg-white/[.04] hover:text-white`}>
              <Icon size={17} strokeWidth={1.8} />
              {label}
              {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-violet" />}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-violet/15 bg-violet/[.06] p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-violet"><Sparkles size={14}/> Prototype mode</div>
        <p className="text-xs leading-5 text-zinc-400">AEB currently adapts reading content inside this workspace. Vision tracking is a separate upcoming milestone.</p>
      </div>
      <div className="mt-5 flex items-center gap-3 px-2">
        <div className="grid h-8 w-8 place-items-center rounded-full bg-zinc-800 text-xs font-semibold">U</div>
        <div><div className="text-xs font-medium">Local profile</div><div className="text-[10px] text-zinc-500">Stored on this device</div></div>
      </div>
    </aside>
  );
}
