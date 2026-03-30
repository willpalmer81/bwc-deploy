import { Nav } from "@/components/nav";
import { ProductList } from "@/components/product-list";

export default function ProductsPage() {
  return (
    <>
      <Nav />
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-10">
          <h1 className="font-display text-3xl font-bold text-zinc-100 tracking-tight">
            Products
          </h1>
          <p className="text-zinc-500 mt-1">
            Product catalog for site deployments
          </p>
        </div>
        <ProductList />
      </main>
    </>
  );
}
