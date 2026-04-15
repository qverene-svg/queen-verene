"use client";
import { useEffect, useRef, useState } from "react";
import { Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn, formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const CATEGORY_LABELS: Record<string, string> = {
  pedicure: "Pedicure",
  manicure: "Manicure",
  wig_making: "Wigs",
  wig_revamp: "Wig Revamp",
  makeup: "Makeup",
  braiding: "Braiding",
  styling: "Styling",
  hair_care: "Hair Care",
};

const CATEGORY_IMAGES: Record<string, string> = {
  braiding:   "https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?w=600&q=80",
  wig_making: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80",
  wig_revamp: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600&q=80",
  makeup:     "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=600&q=80",
  styling:    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=600&q=80",
  pedicure:   "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80",
  manicure:   "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=600&q=80",
  hair_care:  "https://images.unsplash.com/photo-1519415510236-818bdfcd6d3a?w=600&q=80",
};

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  description: string | null;
  category: string;
  image_url?: string | null;
}

const DEMO_SERVICES: Service[] = [
  { id: "1", name: "Classic Pedicure",    duration_minutes: 60,  price: 15000, description: "Relaxing foot soak, nail trim, cuticle care, and polish.",                         category: "pedicure"   },
  { id: "2", name: "Luxury Manicure",     duration_minutes: 45,  price: 12000, description: "Nail shaping, cuticle treatment, hand massage, and premium polish.",               category: "manicure"   },
  { id: "3", name: "Bridal Makeup",       duration_minutes: 120, price: 80000, description: "Full glam bridal look with lashes and long-lasting setting spray.",                 category: "makeup"     },
  { id: "4", name: "Wig Installation",    duration_minutes: 90,  price: 35000, description: "Professional wig fitting, styling, and customization.",                             category: "wig_making" },
  { id: "5", name: "Wig Revamp",          duration_minutes: 60,  price: 20000, description: "Deep conditioning, restyling, and refurbishment of existing wigs.",                 category: "wig_revamp" },
  { id: "6", name: "Ghana Braiding",      duration_minutes: 180, price: 45000, description: "Expertly crafted traditional or modern braiding styles.",                           category: "braiding"   },
  { id: "7", name: "Silk Press & Style",  duration_minutes: 120, price: 30000, description: "Professional silk press with blowout and flat iron finish.",                        category: "styling"    },
  { id: "8", name: "Deep Hair Treatment", duration_minutes: 60,  price: 18000, description: "Intensive moisturizing mask and scalp treatment.",                                  category: "hair_care"  },
];

export function ServiceStep({
  onNext,
  selected,
}: {
  onNext: (data: { serviceId: string; serviceName: string; servicePrice: number; serviceDuration: number }) => void;
  selected?: string;
}) {
  const [services, setServices]   = useState<Service[]>(DEMO_SERVICES);
  const [picked, setPicked]       = useState<string | undefined>(selected);
  const [filter, setFilter]       = useState<string>("all");
  const continueRef               = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("services").select("*").eq("is_active", true)
      .then(({ data }) => { if (data && data.length > 0) setServices(data as Service[]); });
  }, []);

  const categories    = ["all", ...Array.from(new Set(services.map((s) => s.category)))];
  const filtered      = filter === "all" ? services : services.filter((s) => s.category === filter);
  const pickedService = services.find((s) => s.id === picked);

  const handleNext = () => {
    if (!pickedService) return;
    onNext({ serviceId: pickedService.id, serviceName: pickedService.name, servicePrice: pickedService.price, serviceDuration: pickedService.duration_minutes });
  };

  const handleSelect = (serviceId: string) => {
    setPicked(serviceId);
    // Scroll the Continue button into view so the user sees it immediately
    setTimeout(() => {
      continueRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 120);
  };

  return (
    <div>
      <h2 className="font-[Playfair_Display] text-2xl text-[#0a0a0a] mb-1">Choose a Service</h2>
      <p className="text-sm text-[#0a0a0a]/45 mb-8">Select the treatment you&apos;d like to book.</p>

      {/* Category filter pills */}
      <div className="flex gap-2 flex-wrap mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={cn(
              "px-4 py-1.5 rounded-full text-[11px] font-semibold tracking-widest uppercase transition-all duration-200",
              filter === cat
                ? "bg-[#0a0a0a] text-white"
                : "bg-black/6 text-[#0a0a0a]/55 hover:bg-black/10"
            )}
          >
            {cat === "all" ? "All" : CATEGORY_LABELS[cat] || cat}
          </button>
        ))}
      </div>

      {/* Service cards — responsive grid */}
      <style>{`
        .svc-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        @media (min-width: 640px) { .svc-grid { grid-template-columns: repeat(3, 1fr); gap: 12px; } }
        @media (min-width: 1024px) { .svc-grid { grid-template-columns: repeat(4, 1fr); gap: 14px; } }
      `}</style>
      <div className="svc-grid">
        {filtered.map((service) => {
          const isSelected = picked === service.id;
          return (
            <button
              key={service.id}
              onClick={() => handleSelect(service.id)}
              style={{
                textAlign: "left", background: "#fff", borderRadius: 12, overflow: "hidden", padding: 0,
                border: `2px solid ${isSelected ? "#b22222" : "rgba(0,0,0,0.07)"}`,
                boxShadow: isSelected ? "0 4px 20px rgba(178,34,34,0.15)" : "0 1px 4px rgba(0,0,0,0.05)",
                cursor: "pointer", transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s",
              }}
              onMouseEnter={(e) => { if (!isSelected) { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.18)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 18px rgba(0,0,0,0.1)"; } }}
              onMouseLeave={(e) => { if (!isSelected) { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.07)"; (e.currentTarget as HTMLElement).style.transform = "translateY(0)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)"; } }}
            >
              {/* Image — portrait 4/5 */}
              <div style={{ position: "relative", aspectRatio: "4/5", overflow: "hidden", background: "#f0eeeb" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    (service.image_url && service.image_url.trim()) ||
                    CATEGORY_IMAGES[service.category] ||
                    CATEGORY_IMAGES.styling
                  }
                  alt={service.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.5s" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1.06)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLImageElement).style.transform = "scale(1)"; }}
                />
                {/* Gradient overlay */}
                <div style={{
                  position: "absolute", inset: 0,
                  background: isSelected
                    ? "linear-gradient(to top, rgba(178,34,34,0.55) 0%, rgba(178,34,34,0.08) 55%, transparent 100%)"
                    : "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.08) 55%, transparent 100%)",
                  transition: "background 0.2s",
                }} />
                {/* Selected checkmark */}
                {isSelected && (
                  <div style={{ position: "absolute", top: 10, right: 10, width: 24, height: 24, borderRadius: "50%", background: "#b22222", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {/* Category label */}
                <span style={{
                  position: "absolute", bottom: 10, left: 10,
                  background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)",
                  color: "#fff", fontSize: 8, fontWeight: 700, letterSpacing: "0.18em",
                  textTransform: "uppercase", padding: "3px 8px", borderRadius: 999,
                }}>
                  {CATEGORY_LABELS[service.category] || service.category}
                </span>
              </div>

              {/* Content */}
              <div style={{ padding: "10px 12px 12px", background: "#fff" }}>
                <h3 style={{
                  fontSize: 12, fontWeight: 700, color: "#0a0a0a", margin: "0 0 4px", lineHeight: 1.3,
                  fontFamily: "var(--font-outfit),sans-serif",
                  display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical", overflow: "hidden",
                }}>
                  {service.name}
                </h3>
                <p style={{
                  fontSize: 10, color: "rgba(10,10,10,0.4)", margin: "0 0 8px", lineHeight: 1.5,
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                }}>
                  {service.description}
                </p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: isSelected ? "#b22222" : "#0a0a0a" }}>
                    {formatCurrency(service.price)}
                  </span>
                  <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 9, color: "rgba(10,10,10,0.35)", letterSpacing: "0.04em" }}>
                    <Clock size={9} /> {service.duration_minutes} min
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div ref={continueRef} className="mt-10 flex justify-end">
        <Button onClick={handleNext} disabled={!picked} size="lg" className="gap-2 w-full sm:w-auto">
          Continue <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
}
