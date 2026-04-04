"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const services = [
  {
    title: "Braiding & Styling",
    description: "Traditional and modern braiding styles crafted by expert hands — from box braids to knotless, cornrows, and goddess locs.",
    image: "https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?w=800&q=85",
    tag: "Most Popular",
  },
  {
    title: "Pedicure & Manicure",
    description: "Relaxing luxury nail treatments using only premium products, for hands and feet that deserve the finest care.",
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&q=85",
    tag: null,
  },
  {
    title: "Wig Making & Revamp",
    description: "Custom wig creation and expert refurbishment — from raw hair to a flawless, bespoke piece tailored just for you.",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=800&q=85",
    tag: "Signature",
  },
  {
    title: "Makeup Artistry",
    description: "From everyday glam to full bridal transformations. Flawless, long-lasting finishes for every occasion.",
    image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&q=85",
    tag: null,
  },
];

export function ServicesPreview() {
  return (
    <section style={{ padding: "56px 40px", background: "#f9f7f2" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            style={{ color: "#b22222", fontSize: 10, fontWeight: 700, letterSpacing: "0.32em", textTransform: "uppercase", marginBottom: 10 }}
          >
            What We Offer
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.08 }}
            style={{ fontFamily: "var(--font-playfair),'Playfair Display',serif", fontSize: 32, color: "#0a0a0a", margin: 0 }}
          >
            Our Services
          </motion.h2>
        </div>

        {/* 4-column horizontal strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <Link href="/services" style={{ display: "block", textDecoration: "none" }}>
                <div
                  style={{ borderRadius: 12, overflow: "hidden", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", transition: "box-shadow 0.25s, transform 0.25s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.07)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; }}
                >
                  {/* Image — 4/5 portrait */}
                  <div style={{ position: "relative", aspectRatio: "4/5", overflow: "hidden", background: "#f0eeeb" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={service.image}
                      alt={service.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.6s" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1.06)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1)"; }}
                    />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.08) 55%, transparent 100%)" }} />
                    {service.tag && (
                      <span style={{
                        position: "absolute", top: 10, left: 10,
                        background: "#b22222", color: "#fff",
                        fontSize: 9, fontWeight: 700, letterSpacing: "0.18em",
                        textTransform: "uppercase", padding: "3px 9px", borderRadius: 999,
                      }}>
                        {service.tag}
                      </span>
                    )}
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px 12px" }}>
                      <p style={{ color: "#fff", fontSize: 12, fontWeight: 700, margin: "0 0 3px", lineHeight: 1.3 }}>{service.title}</p>
                      <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 10, margin: 0, lineHeight: 1.5,
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {service.description}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign: "center", marginTop: 36 }}>
          <Link
            href="/services"
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              fontSize: 13, fontWeight: 700, color: "#b22222", textDecoration: "none",
              borderBottom: "1px solid rgba(178,34,34,0.3)", paddingBottom: 2,
              transition: "border-color 0.18s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#b22222"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(178,34,34,0.3)"; }}
          >
            View All Services &amp; Book
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
