import Link from "next/link";
import { notFound } from "next/navigation";
import { LEGAL_PAGES, LEGAL_NAV_LINKS } from "@/lib/legalPages";

export default async function LegalInfoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = LEGAL_PAGES[slug];

  if (!page) {
    notFound();
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-10">
      {/* Sidebar Navigation */}
      <aside className="space-y-1">
        <p className="text-xs uppercase font-bold text-gray-500 mb-3">Legal & Business</p>
        {LEGAL_NAV_LINKS.map((item) => (
          <Link
            key={item.slug}
            href={`/info/${item.slug}`}
            className={`block px-3 py-2 rounded-lg text-sm transition ${
              item.slug === slug
                ? "bg-black text-white font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {item.title}
          </Link>
        ))}
        <Link href="/contact" className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100">
          Contact Us
        </Link>
        <Link href="/faq" className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100">
          FAQ
        </Link>
      </aside>

      {/* Main Content */}
      <article className="md:col-span-3 space-y-8">
        <div className="border-b pb-4">
          <h1 className="text-3xl font-bold">{page.title}</h1>
          <p className="text-xs text-gray-500 mt-1">Last updated: {page.updatedAt}</p>
        </div>

        <div className="space-y-6">
          {page.sections.map((sec) => (
            <section key={sec.heading} className="space-y-2">
              <h2 className="text-xl font-semibold">{sec.heading}</h2>
              <p className="text-gray-700 leading-relaxed">{sec.body}</p>
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}