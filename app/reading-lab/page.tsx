import { Sidebar } from "@/components/sidebar";
import { ReadingLabClient } from "@/components/reading-lab-client";

export default function ReadingLabPage() {
  return (
    <main className="flex min-h-screen">
      <Sidebar activePath="reading-lab" />
      <ReadingLabClient />
    </main>
  );
}
