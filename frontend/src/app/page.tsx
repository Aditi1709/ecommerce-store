import { getProducts } from "@/lib/api";
import StorefrontHome from "@/components/StorefrontHome";

export default async function HomePage() {
  const products = await getProducts();
  return <StorefrontHome products={products} />;
}
