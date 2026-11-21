import Link from "next/link";
import { notFound } from "next/navigation";
import { Product } from "@/lib/api";
import ProductView from "@/components/ProductView";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"}/products/${slug}`, {
    cache: "no-store",
  });

  if (!res.ok) {
    notFound();
  }

  const product: Product = await res.json();

  return (
    <main className="max-w-5xl mx-auto px-6 py-10 space-y-6">
      <nav className="text-xs text-gray-500 flex items-center gap-2">
        <Link href="/" className="hover:underline">Home</Link>
        <span>/</span>
        <Link
          href={`/search?category=${encodeURIComponent(product.category.name)}`}
          className="hover:underline"
        >
          {product.category.name}
        </Link>
        <span>/</span>
        <span className="text-black font-medium">{product.name}</span>
      </nav>

      <ProductView product={product} />
    </main>
  );
}