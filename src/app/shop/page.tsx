"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, MessageCircle } from "lucide-react";
import { FloatingPageNav } from "@/components/layout/FloatingPageNav";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  is_available: boolean;
  image_urls: string[];
  category: string;
  sku: string;
}

const DEMO_PRODUCTS: Product[] = [
  { id: "p1", name: "Brazilian Wavy Bundle",         description: "100% virgin Brazilian hair, 3-bundle deal. Silky texture with natural wave pattern.",              price: 120000, is_available: true,  image_urls: ["https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&q=80"], category: "Hair Extensions", sku: "BRAZ-WVY-001" },
  { id: "p2", name: "Peruvian Straight Bundle",      description: "Premium Peruvian straight hair. Ultra-smooth, easy to style and colour.",                           price: 110000, is_available: true,  image_urls: ["https://images.unsplash.com/photo-1519415510236-818bdfcd6d3a?w=400&q=80"], category: "Hair Extensions", sku: "PERU-STR-001" },
  { id: "p3", name: "Closure Wig — Kinky Curly",    description: "Full lace closure wig. Natural kinky curly texture, adjustable band.",                              price: 280000, is_available: true,  image_urls: ["https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&q=80"], category: "Wigs",            sku: "WIG-KNK-001" },
  { id: "p4", name: "Moisturising Hair Mask",        description: "Deep conditioning treatment. Restores moisture and shine. Suitable for all hair types.",            price: 8500,   is_available: true,  image_urls: ["https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400&q=80"], category: "Hair Care",       sku: "MASK-MOI-001" },
  { id: "p5", name: "Frontal Lace Wig — Loose Wave", description: "13×4 frontal lace wig with loose wave pattern. Pre-plucked hairline.",                             price: 320000, is_available: true,  image_urls: ["https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400&q=80"], category: "Wigs",            sku: "WIG-LWV-001" },
  { id: "p6", name: "Scalp Oil Treatment",           description: "Nourishing scalp oil with rosemary and castor oil blend. Promotes growth.",                        price: 6500,   is_available: false, image_urls: ["https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?w=400&q=80"], category: "Hair Care",       sku: "OIL-SCP-001" },
];

export default function ShopPage() {
  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [search, setSearch]     = useState("");
  const [filter, setFilter]     = useState("All");

  useEffect(() => {
    const supabase = createClient();
    supabase.from("products").select("*").then(({ data }) => {
      if (data && data.length > 0) setProducts(data as Product[]);
    });
  }, []);

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];
  const filtered   = products.filter(
    (p) => (filter === "All" || p.category === filter) &&
           p.name.toLowerCase().includes(search.toLowerCase())
  );

  const inquire = (product: Product) => {
    const wa  = process.env.NEXT_PUBLIC_WHATSAPP_BUSINESS_NUMBER || "+233000000000";
    const msg = encodeURIComponent(
      `Hi Verene! I'm interested in: *${product.name}* (SKU: ${product.sku}) — ${formatCurrency(product.price)}.`
    );
    window.open(`https://wa.me/${wa.replace(/\D/g, "")}?text=${msg}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#f9f7f2]">

      {/* ── Header ──────────────────────────────────────── */}
      <div className="bg-[#0a0a0a] px-6 text-center">
        <FloatingPageNav />
        <div className="py-10">
        <p className="text-[#d4af37] text-[10px] font-semibold tracking-[0.35em] uppercase mb-3">Our Collection</p>
        <h1 className="text-4xl sm:text-5xl text-white font-extrabold tracking-tight"
          style={{ fontFamily: "var(--font-outfit), sans-serif" }}>The Verene Shop</h1>
        <p className="text-white/40 mt-3 max-w-sm mx-auto text-sm leading-relaxed">
          Premium hair extensions, wigs, and care products.
        </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* ── Filters ─────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-10 pb-6 border-b border-black/8">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0a0a0a]/30" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="w-full pl-8 pr-4 py-2 rounded-lg border border-black/10 bg-white text-xs focus:outline-none focus:border-[#d4af37] transition-colors"
            />
          </div>

          {/* Category pills */}
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all ${
                  filter === cat
                    ? "bg-[#0a0a0a] text-white"
                    : "bg-white border border-black/10 text-[#0a0a0a]/50 hover:bg-black/5"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Count */}
          <p className="ml-auto text-[10px] text-[#0a0a0a]/35 font-medium tracking-wide whitespace-nowrap hidden sm:block">
            {filtered.length} {filtered.length === 1 ? "item" : "items"}
          </p>
        </div>

        {/* ── Product grid — 2-col mobile → 4-col desktop ── */}
        <style>{`
          .shop-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          @media (min-width: 640px)  { .shop-grid { grid-template-columns: repeat(2, 1fr); gap: 14px; } }
          @media (min-width: 900px)  { .shop-grid { grid-template-columns: repeat(3, 1fr); } }
          @media (min-width: 1200px) { .shop-grid { grid-template-columns: repeat(4, 1fr); } }
        `}</style>
        <div className="shop-grid">
          {filtered.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04 }}
              className="group"
              style={{ background: "#fff", borderRadius: 10, overflow: "hidden", border: "1px solid rgba(0,0,0,0.06)", transition: "box-shadow 0.2s, border-color 0.2s" }}
            >
              {/* Image */}
              <div style={{ position: "relative", aspectRatio: "4/3", overflow: "hidden", background: "#f5f5f5" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={product.image_urls[0]}
                  alt={product.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s" }}
                  className="group-hover:scale-105"
                />
                {!product.is_available && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ color: "#fff", fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", background: "rgba(0,0,0,0.6)", padding: "3px 10px", borderRadius: 999 }}>
                      Out of Stock
                    </span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: "12px 14px 14px" }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "#b22222", margin: "0 0 4px" }}>{product.category}</p>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: "#0a0a0a", margin: "0 0 5px", lineHeight: 1.3,
                  fontFamily: "var(--font-outfit),sans-serif",
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {product.name}
                </h3>
                <p style={{ fontSize: 12, color: "rgba(10,10,10,0.45)", margin: "0 0 12px", lineHeight: 1.5,
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {product.description}
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#0a0a0a" }}>{formatCurrency(product.price)}</span>
                  {product.is_available ? (
                    <button
                      onClick={() => inquire(product)}
                      style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", background: "#0a0a0a", color: "#fff", fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", borderRadius: 8, border: "none", cursor: "pointer", transition: "background 0.18s", minHeight: 36 }}
                      className="hover:!bg-[#b22222]"
                    >
                      <MessageCircle size={12} />
                      Enquire
                    </button>
                  ) : (
                    <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(10,10,10,0.25)" }}>Unavailable</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-[#0a0a0a]/35">
            <p className="text-base font-semibold mb-1">No products found</p>
            <p className="text-xs">Try adjusting your search or filter.</p>
          </div>
        )}

        {/* ── Footer note ─────────────────────────────────── */}
        <p className="mt-12 text-center text-[10px] text-[#0a0a0a]/30 tracking-wide">
          All enquiries are handled via WhatsApp for a personalised consultation.
        </p>
      </div>
    </div>
  );
}
