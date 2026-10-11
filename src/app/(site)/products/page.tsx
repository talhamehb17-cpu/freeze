import type { Metadata } from "next";
import { Beef, Fish, Leaf, Pill } from "lucide-react";

import { FinalCTA } from "@/components/sections/FinalCTA";
import { StorageOptions } from "@/components/sections/StorageOptions";
import { PageHero } from "@/components/layout/PageHero";
import { ProductCard } from "@/components/products/ProductCard";
import { ProductVault } from "@/components/products/ProductVault";
import { PRODUCTS } from "@/lib/site";

export const metadata: Metadata = {
  title: "Products we store",
  description:
    "Produce, meat, seafood and pharmaceuticals held in zoned, temperature-controlled cold rooms at Uuayrij Industrial Area, Baghdad. Profiles agreed per contract.",
  alternates: { canonical: "/products" },
};

const CATEGORY_ICONS = [Leaf, Beef, Fish, Pill];

/**
 * /products — the interactive vault first (one category at a time), then a full
 * dossier per category so a reader can scan specs without clicking anything.
 */
export default function ProductsPage() {
  return (
    <>
      <PageHero
        index="03"
        eyebrow="Product vault"
        lines={["Four categories.", "One cold chain."]}
        lead="Produce, protein, marine and pharmaceutical stock each need a different room, a different airflow and a different handling discipline. They are zoned, separated and tracked separately."
        image="/assets/product-meat.jpg"
        imageAlt="Chilled protein storage hanging and racked inside a cold room"
        imageCode="PRD-01"
        meta={[
          { label: "Categories", value: "4", tone: "cyan" },
          { label: "Separation", value: "Zoned" },
          { label: "Traceability", value: "Per batch" },
          { label: "Temperature", value: "Client configured", tone: "amber" },
        ]}
        aside={
          <ul className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-ice/14 bg-ice/10 backdrop-blur-sm">
            {PRODUCTS.map((p, i) => {
              const Icon = CATEGORY_ICONS[i]!;
              return (
                <li key={p.key}>
                  <a
                    href={`#product-${p.key}`}
                    className="group/cat flex items-center gap-3 bg-midnight/72 px-4 py-3.5 transition-colors duration-300 hover:bg-industrial/60"
                  >
                    <Icon
                      className="h-4 w-4 shrink-0 transition-transform duration-500 group-hover/cat:scale-110"
                      style={{ color: p.accent }}
                      aria-hidden
                    />
                    <span className="min-w-0">
                      <span className="block truncate font-display text-[0.9rem] font-bold tracking-[-0.01em] text-frost">
                        {p.name}
                      </span>
                      <span className="mt-0.5 block truncate font-mono text-[8px] tracking-[0.16em] text-silver/45 uppercase">
                        {p.kicker}
                      </span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        }
      />

      {/* interactive vault */}
      <ProductVault />

      {/* full dossiers */}
      <section
        aria-labelledby="product-dossiers"
        className="relative mx-auto w-full max-w-[1500px] px-5 py-20 sm:px-8 sm:py-24 lg:px-12"
      >
        <div className="mb-4 flex items-center gap-3">
          <span className="h-px w-8 bg-cyan-core" aria-hidden />
          <span className="font-mono text-[10px] tracking-[0.3em] text-ice uppercase">Category dossiers</span>
        </div>
        <h2
          id="product-dossiers"
          className="max-w-3xl font-display text-[clamp(1.9rem,4.6vw,3.2rem)] leading-[0.98] font-bold tracking-[-0.045em] text-frost"
        >
          What each room is built for.
        </h2>

        <div className="mt-14">
          {PRODUCTS.map((p, i) => (
            <ProductCard
              key={p.key}
              product={p}
              index={String(i + 1).padStart(2, "0")}
              flip={i % 2 === 1}
            />
          ))}
        </div>
      </section>

      <StorageOptions />
      <FinalCTA />
    </>
  );
}
