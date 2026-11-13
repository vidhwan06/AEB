import { Sidebar } from "@/components/sidebar";
import { VisionMonitorClient } from "@/components/vision-monitor-client";

export default function VisionMonitorPage() {
  return (
    <main className="flex min-h-screen">
      <Sidebar activePath="vision-monitor" />
      <VisionMonitorClient />
    </main>
  );
}
