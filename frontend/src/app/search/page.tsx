import { getProducts } from "@/lib/api";
import SearchCatalog from "@/components/SearchCatalog";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const { q = "", category = "" } = await searchParams;
  const allProducts = await getProducts();

  return (
    <SearchCatalog
      allProducts={allProducts}
      initialQuery={q}
      initialCategory={category}
    />
  );
}