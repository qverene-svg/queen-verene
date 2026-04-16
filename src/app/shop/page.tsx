"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, MessageCircle, CreditCard, X, User, Phone, Package, Truck } from "lucide-react";
import { FloatingPageNav } from "@/components/layout/FloatingPageNav";
import { formatCurrency, formatPhone } from "@/lib/utils";
import { businessWhatsAppHref } from "@/lib/contact";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

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

export default function ShopPage() {
  const [products,  setProducts]  = useState<Product[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [filter,    setFilter]    = useState("All");

  // ── Checkout modal state ───────────────────────────────────────────────────
  const [checkoutProduct,     setCheckoutProduct]     = useState<Product | null>(null);
  const [checkoutName,        setCheckoutName]        = useState("");
  const [checkoutPhone,       setCheckoutPhone]       = useState("");
  const [checkoutFulfillment, setCheckoutFulfillment] = useState<"pickup" | "delivery">("pickup");
  const [checkoutLoading,     setCheckoutLoading]     = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("products").select("*").order("name", { ascending: true }).then(({ data }) => {
      setProducts((data as Product[]) || []);
      setLoading(false);
    });
  }, []);

  const categories = ["All", ...Array.from(new Set(products.map((p) => p.category)))];
  const filtered   = products.filter(
    (p) => (filter === "All" || p.category === filter) &&
           p.name.toLowerCase().includes(search.toLowerCase())
  );

  // ── Open checkout modal ────────────────────────────────────────────────────
  const openCheckout = (product: Product) => {
    setCheckoutProduct(product);
    setCheckoutName("");
    setCheckoutPhone("");
    setCheckoutFulfillment("pickup");
  };

  const closeCheckout = () => {
    if (checkoutLoading) return;
    setCheckoutProduct(null);
  };

  // ── Submit checkout — identical flow to the booking form ──────────────────
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutProduct) return;
    if (!checkoutName.trim()) { toast.error("Please enter your name"); return; }
    if (!checkoutPhone.trim()) { toast.error("Please enter your phone number"); return; }

    setCheckoutLoading(true);

    const product = checkoutProduct;
    const skuSafe = product.sku.replace(/[^a-zA-Z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 12) || "item";
    const clientReference = `shop-${skuSafe}-${String(Date.now()).slice(-8)}`;

    // Format phone exactly as the booking form does
    const formattedPhone = formatPhone(checkoutPhone.trim());

    try {
      const res = await fetch("/api/payments/shop", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount:          product.price / 100,
          description:     `Verene Shop - ${product.name}`,
          clientReference,
          customerName:    checkoutName.trim(),
          customerPhone:   formattedPhone,
          fulfillment:     checkoutFulfillment,
        }),
      });

      const { paymentUrl, error } = await res.json();
      if (error || !paymentUrl) {
        toast.error(error || "Could not start payment");
        setCheckoutLoading(false);
        return;
      }
      window.location.href = paymentUrl;
    } catch {
      toast.error("Something went wrong. Please try again.");
      setCheckoutLoading(false);
    }
  };

  const inquire = (product: Product) => {
    const msg = `Hi Verene! I'm interested in: *${product.name}* (SKU: ${product.sku}) — ${formatCurrency(product.price)}.`;
    window.open(businessWhatsAppHref(msg), "_blank");
  };

  return (
    <div className="min-h-screen bg-[#f9f7f2]">

      {/* ── Header ──────────────────────────────────────── */}
      <div className="bg-[#0a0a0a] px-6 text-center pt-16">
        <FloatingPageNav />
        <div className="py-10">
          <p className="text-[#d4af37] text-[10px] font-semibold tracking-[0.35em] uppercase mb-3">Our Collection</p>
          <h1 className="text-white font-extrabold tracking-tight"
            style={{ fontFamily: "var(--font-outfit), sans-serif", fontSize: "clamp(2rem, 8vw, 3.5rem)" }}>
            The Verene Shop
          </h1>
          <p className="text-white/40 mt-3 max-w-sm mx-auto text-sm leading-relaxed">
            Premium hair extensions, wigs, and care products.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* ── Filters ─────────────────────────────────────── */}
        <style>{`
          .shop-filters { display: flex; flex-direction: column; gap: 12px; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 1px solid rgba(0,0,0,0.08); }
          @media (min-width: 640px) { .shop-filters { flex-direction: row; align-items: center; gap: 16px; } }
          .shop-search { width: 100%; }
          @media (min-width: 640px) { .shop-search { width: 260px; flex-shrink: 0; } }
        `}</style>
        <div className="shop-filters">
          <div className="shop-search" style={{ position: "relative" }}>
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#0a0a0a]/30" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products…"
              className="w-full pl-8 pr-4 py-2 rounded-lg border border-black/10 bg-white text-xs focus:outline-none focus:border-[#d4af37] transition-colors"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setFilter(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all ${
                  filter === cat ? "bg-[#0a0a0a] text-white" : "bg-white border border-black/10 text-[#0a0a0a]/50 hover:bg-black/5"
                }`}>
                {cat}
              </button>
            ))}
          </div>
          <p style={{ marginLeft: "auto", fontSize: 10, color: "rgba(10,10,10,0.35)", fontWeight: 500, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
            {filtered.length} {filtered.length === 1 ? "item" : "items"}
          </p>
        </div>

        {/* ── Product grid ── */}
        <style>{`
          .shop-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
          @media (min-width: 640px) { .shop-grid { grid-template-columns: repeat(3, 1fr); gap: 16px; } }
          @media (min-width: 1024px) { .shop-grid { grid-template-columns: repeat(4, 1fr); gap: 18px; } }
        `}</style>
        <div className="shop-grid">
          {!loading && filtered.map((product, i) => (
            <motion.div key={product.id}
              initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              style={{
                background: "#fff", borderRadius: 14, overflow: "hidden",
                border: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
                transition: "box-shadow 0.25s, transform 0.25s", display: "flex", flexDirection: "column",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 12px 32px rgba(0,0,0,0.12)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 10px rgba(0,0,0,0.05)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
            >
              <div style={{ position: "relative", aspectRatio: "1/1", overflow: "hidden", background: "#f0eeeb", flexShrink: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.image_urls?.[0] || "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80"}
                  alt={product.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.55s ease" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1.08)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1)"; }}
                />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "40%", background: "linear-gradient(to top, rgba(0,0,0,0.28) 0%, transparent 100%)", pointerEvents: "none" }} />
                <span style={{ position: "absolute", top: 10, left: 10, background: "rgba(10,10,10,0.7)", backdropFilter: "blur(6px)", color: "#fff", fontSize: 8, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", padding: "3px 9px", borderRadius: 999 }}>
                  {product.category}
                </span>
                {!product.is_available && (
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", backdropFilter: "blur(2px)" }}>
                    <span style={{ color: "#fff", fontSize: 9, fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", background: "rgba(0,0,0,0.65)", padding: "5px 14px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.2)" }}>Out of Stock</span>
                  </div>
                )}
              </div>

              <div style={{ padding: "14px 15px 15px", flex: 1, display: "flex", flexDirection: "column" }}>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: "#0a0a0a", margin: "0 0 5px", lineHeight: 1.35, fontFamily: "var(--font-outfit),sans-serif", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {product.name}
                </h3>
                <p style={{ fontSize: 10, color: "rgba(10,10,10,0.42)", margin: "0 0 12px", lineHeight: 1.55, flex: 1, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {product.description}
                </p>
                <div style={{ paddingTop: 10, borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#0a0a0a", letterSpacing: "-0.01em", display: "block", marginBottom: 8 }}>{formatCurrency(product.price)}</span>
                  {product.is_available ? (
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => openCheckout(product)}
                        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "7px 8px", background: "#b22222", color: "#fff", fontSize: 8, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", borderRadius: 8, border: "none", cursor: "pointer", transition: "background 0.18s" }}>
                        <CreditCard size={9} /> Make Payment
                      </button>
                      <button onClick={() => inquire(product)} title="Enquire via WhatsApp"
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "7px 10px", background: "rgba(0,0,0,0.06)", color: "#0a0a0a", borderRadius: 8, border: "none", cursor: "pointer", transition: "background 0.18s", flexShrink: 0 }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.12)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(0,0,0,0.06)"; }}>
                        <MessageCircle size={11} />
                      </button>
                    </div>
                  ) : (
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(10,10,10,0.22)" }}>Unavailable</span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {loading && (
          <div className="text-center py-20 text-[#0a0a0a]/35">
            <p className="text-base font-semibold mb-1">Loading products...</p>
          </div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-20 text-[#0a0a0a]/35">
            <p className="text-base font-semibold mb-1">No products found</p>
            <p className="text-xs">Try adjusting your search or filter.</p>
          </div>
        )}

        <p className="mt-12 text-center text-[10px] text-[#0a0a0a]/30 tracking-wide">
          All enquiries are handled via WhatsApp for a personalised consultation.
        </p>
      </div>

      {/* ── Checkout modal ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {checkoutProduct && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}
            onClick={(e) => { if (e.target === e.currentTarget) closeCheckout(); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 16, scale: 0.97 }}
              style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 440, overflow: "hidden", boxShadow: "0 32px 80px rgba(0,0,0,0.22)" }}
            >
              {/* Header */}
              <div style={{ background: "#0a0a0a", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "#d4af37", marginBottom: 2 }}>Checkout</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#fff", margin: 0 }}>{checkoutProduct.name}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontSize: 16, fontWeight: 800, color: "#d4af37" }}>{formatCurrency(checkoutProduct.price)}</span>
                  <button onClick={closeCheckout} disabled={checkoutLoading}
                    style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 8, padding: 7, color: "rgba(255,255,255,0.5)", cursor: "pointer" }}>
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleCheckoutSubmit} style={{ padding: "24px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                  {/* Name */}
                  <div>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(10,10,10,0.45)", marginBottom: 7 }}>
                      <User size={11} /> Full Name *
                    </label>
                    <input
                      required value={checkoutName}
                      onChange={(e) => setCheckoutName(e.target.value)}
                      placeholder="e.g. Akua Mensah"
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid rgba(0,0,0,0.12)", fontSize: 13, color: "#0a0a0a", outline: "none", boxSizing: "border-box", transition: "border-color 0.18s" }}
                      onFocus={(e) => { e.target.style.borderColor = "#b22222"; }}
                      onBlur={(e)  => { e.target.style.borderColor = "rgba(0,0,0,0.12)"; }}
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(10,10,10,0.45)", marginBottom: 7 }}>
                      <Phone size={11} /> Phone Number *
                    </label>
                    <input
                      required type="tel" value={checkoutPhone}
                      onChange={(e) => setCheckoutPhone(e.target.value)}
                      placeholder="e.g. 0244 000 000"
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid rgba(0,0,0,0.12)", fontSize: 13, color: "#0a0a0a", outline: "none", boxSizing: "border-box", transition: "border-color 0.18s" }}
                      onFocus={(e) => { e.target.style.borderColor = "#b22222"; }}
                      onBlur={(e)  => { e.target.style.borderColor = "rgba(0,0,0,0.12)"; }}
                    />
                  </div>

                  {/* Pickup / Delivery */}
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(10,10,10,0.45)", marginBottom: 10, display: "block" }}>
                      Fulfilment *
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                      {(["pickup", "delivery"] as const).map((opt) => (
                        <button key={opt} type="button"
                          onClick={() => setCheckoutFulfillment(opt)}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                            padding: "11px 14px", borderRadius: 10, border: `1.5px solid ${checkoutFulfillment === opt ? "#b22222" : "rgba(0,0,0,0.12)"}`,
                            background: checkoutFulfillment === opt ? "rgba(178,34,34,0.06)" : "#fff",
                            color: checkoutFulfillment === opt ? "#b22222" : "rgba(10,10,10,0.5)",
                            fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
                            cursor: "pointer", transition: "all 0.18s",
                          }}>
                          {opt === "pickup" ? <Package size={13} /> : <Truck size={13} />}
                          {opt === "pickup" ? "Pick Up" : "Delivery"}
                        </button>
                      ))}
                    </div>

                    {/* Delivery note */}
                    {checkoutFulfillment === "delivery" && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                        style={{ marginTop: 10, padding: "10px 14px", background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 10 }}>
                        <p style={{ fontSize: 11, color: "#8a6d00", lineHeight: 1.55, margin: 0 }}>
                          <strong>Note:</strong> Delivery charges are <strong>not included</strong> in this payment. Our team will contact you to arrange delivery and confirm the additional fee.
                        </p>
                      </motion.div>
                    )}
                  </div>

                  {/* Order summary */}
                  <div style={{ padding: "12px 16px", background: "rgba(0,0,0,0.03)", borderRadius: 10, border: "1px solid rgba(0,0,0,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ fontSize: 10, color: "rgba(10,10,10,0.4)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 2 }}>You are paying</p>
                      <p style={{ fontSize: 18, fontWeight: 800, color: "#0a0a0a", margin: 0 }}>{formatCurrency(checkoutProduct.price)}</p>
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: checkoutFulfillment === "delivery" ? "#b22222" : "rgba(10,10,10,0.3)", letterSpacing: "0.1em" }}>
                      {checkoutFulfillment === "delivery" ? "Delivery" : "Pick up in store"}
                    </span>
                  </div>

                  {/* Submit */}
                  <button type="submit" disabled={checkoutLoading || !checkoutName.trim() || !checkoutPhone.trim()}
                    style={{
                      width: "100%", padding: "13px", borderRadius: 12, border: "none",
                      background: (checkoutLoading || !checkoutName.trim() || !checkoutPhone.trim()) ? "rgba(178,34,34,0.4)" : "#b22222",
                      color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: "0.1em",
                      textTransform: "uppercase", cursor: (checkoutLoading || !checkoutName.trim() || !checkoutPhone.trim()) ? "not-allowed" : "pointer",
                      transition: "background 0.2s",
                    }}>
                    {checkoutLoading ? "Redirecting to payment…" : "Proceed to Payment →"}
                  </button>

                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
