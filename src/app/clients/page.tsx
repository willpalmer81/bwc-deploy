import { Nav } from "@/components/nav";
import { ClientList } from "@/components/client-list";

export default function ClientsPage() {
  return (
    <>
      <Nav />
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="font-display text-3xl font-bold text-zinc-100 tracking-tight">
            Clients
          </h1>
          <p className="text-zinc-500 mt-1">
            All clients and their deployment details
          </p>
        </div>
        <ClientList />
      </main>
    </>
  );
}
