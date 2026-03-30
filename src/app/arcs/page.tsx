import { Nav } from "@/components/nav";
import { ArcList } from "@/components/arc-list";

export default function ArcsPage() {
  return (
    <>
      <Nav />
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="font-display text-3xl font-bold text-zinc-100 tracking-tight">
            ARC Providers
          </h1>
          <p className="text-zinc-500 mt-1">
            Alarm Receiving Centres
          </p>
        </div>
        <ArcList />
      </main>
    </>
  );
}
