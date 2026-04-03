"use client";
import { useEffect, useState } from "react";
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

      {/* Service cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((service) => {
          const isSelected = picked === service.id;
          return (
            <button
              key={service.id}
              onClick={() => setPicked(service.id)}
              className={cn(
                "group text-left rounded-2xl overflow-hidden border-2 transition-all duration-300",
                isSelected
                  ? "border-[#b22222] shadow-lg shadow-[#b22222]/10"
                  : "border-black/8 bg-white hover:border-black/20 hover:shadow-md"
              )}
            >
              {/* Image strip */}
              <div className="relative h-36 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    (service.image_url && service.image_url.trim()) ||
                    CATEGORY_IMAGES[service.category] ||
                    CATEGORY_IMAGES.styling
                  }
                  alt={service.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className={cn(
                  "absolute inset-0 transition-all duration-300",
                  isSelected ? "bg-[#b22222]/20" : "bg-black/20 group-hover:bg-black/10"
                )} />
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#b22222] flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <span className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-sm text-white text-[10px] font-semibold tracking-widest uppercase px-2.5 py-1 rounded-full">
                  {CATEGORY_LABELS[service.category] || service.category}
                </span>
              </div>

              {/* Content */}
              <div className="p-4 bg-white">
                <h3 className="text-sm font-semibold text-[#0a0a0a] leading-snug mb-1"
                  style={{ fontFamily: "var(--font-outfit), sans-serif", fontWeight: 700 }}>{service.name}</h3>
                <p className="text-[11px] text-[#0a0a0a]/40 leading-relaxed mb-3 line-clamp-2">{service.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-base font-semibold text-[#0a0a0a]">{formatCurrency(service.price)}</span>
                  <span className="flex items-center gap-1 text-[10px] text-[#0a0a0a]/35 tracking-wide">
                    <Clock size={10} /> {service.duration_minutes} min
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-10 flex justify-end">
        <Button onClick={handleNext} disabled={!picked} size="lg" className="gap-2">
          Continue <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
}
