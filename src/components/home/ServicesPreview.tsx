"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const services = [
  {
    title: "Braiding & Styling",
    description: "Traditional and modern braiding styles crafted by expert hands.",
    image: "https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?w=600&q=80",
    tag: "Most Popular",
  },
  {
    title: "Pedicure & Manicure",
    description: "Relaxing luxury nail treatments with premium products.",
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80",
    tag: null,
  },
  {
    title: "Wig Making & Revamp",
    description: "Custom wig creation and expert refurbishment services.",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80",
    tag: "Signature",
  },
  {
    title: "Makeup Artistry",
    description: "From everyday glam to full bridal transformations.",
    image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80",
    tag: null,
  },
];

export function ServicesPreview() {
  return (
    <section style={{ padding: "56px 40px", background: "#f9f7f2" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45 }}
            style={{ color: "#b22222", fontSize: 10, fontWeight: 700, letterSpacing: "0.32em", textTransform: "uppercase", marginBottom: 8 }}
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

        {/* 4-column desktop grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <Link href="/services" style={{ display: "block", textDecoration: "none" }}
                className="group">
                <div style={{ borderRadius: 12, overflow: "hidden", background: "#fff", boxShadow: "0 1px 4px rgba(0,0,0,0.07)", transition: "box-shadow 0.25s, transform 0.25s" }}
                  className="hover:shadow-md hover:-translate-y-px">
                  {/* Image — square-ish */}
                  <div style={{ position: "relative", aspectRatio: "4/5", overflow: "hidden", background: "#f0eeeb" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={service.image}
                      alt={service.title}
                      style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.6s" }}
                      className="group-hover:scale-105"
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
        <div style={{ textAlign: "center", marginTop: 28 }}>
          <Link
            href="/services"
            className={cn(
              "inline-flex items-center gap-2 text-sm font-semibold text-[#b22222]",
              "border-b border-[#b22222]/30 pb-0.5 hover:border-[#b22222] transition-all"
            )}
          >
            View All Services &amp; Book
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
