import Link from "next/link";
import { db } from "@/lib/db";
import { ProductForm } from "@/components/admin/ProductForm";

export default async function NewProduct() {
  const categories = await db.category.findMany({ orderBy: { order: "asc" } });
  return (
    <div className="mx-auto max-w-6xl">
      <Link href="/admin/products" className="text-sm text-ink/70 hover:text-ink">
        ← All products
      </Link>
      <h1 className="display mt-3 text-5xl">New product</h1>
      <p className="mt-2 text-sm text-ink/70">New products start unpublished so you can preview them first.</p>
      <div className="mt-6">
        <ProductForm
          categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          media={{}}
          initial={{
            name: "",
            slug: "",
            categoryId: categories[0]?.id,
            summary: "",
            description: "",
            applications: [],
            quoteNote: "Pricing is quoted per project, based on quantity, grade and delivery location.",
            featured: false,
            published: false,
            coverId: null,
            galleryIds: [],
            focalX: 50,
            focalY: 50,
          }}
        />
      </div>
    </div>
  );
}
