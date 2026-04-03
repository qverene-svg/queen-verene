"use client";
import { useEffect, useState } from "react";
import { Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface Stylist {
  id: string;
  user_id: string;
  bio: string | null;
  specialty_tags: string[];
  rating: number;
  users: { full_name: string; avatar_url: string | null };
}

const DEMO_STYLISTS: Stylist[] = [
  {
    id: "s1", user_id: "u1",
    bio: "Specializing in natural hair, braiding, and silk presses.",
    specialty_tags: ["Braiding", "Natural Hair", "Silk Press"],
    rating: 4.9,
    users: { full_name: "Ama Osei", avatar_url: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=300&q=80" },
  },
  {
    id: "s2", user_id: "u2",
    bio: "Expert in wigs, makeup, and bridal beauty transformations.",
    specialty_tags: ["Wigs", "Makeup", "Bridal"],
    rating: 4.8,
    users: { full_name: "Efua Darko", avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&q=80" },
  },
  {
    id: "s3", user_id: "u3",
    bio: "Nail technician and pedicure specialist with 5 years experience.",
    specialty_tags: ["Pedicure", "Manicure", "Nail Art"],
    rating: 4.9,
    users: { full_name: "Abena Asante", avatar_url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=300&q=80" },
  },
];

export function StylistStep({
  onNext,
  onBack,
  selected,
}: {
  onNext: (data: { staffId: string; staffName: string }) => void;
  onBack: () => void;
  selected?: string;
}) {
  const [stylists, setStylists] = useState<Stylist[]>(DEMO_STYLISTS);
  const [picked, setPicked]     = useState<string | undefined>(selected);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("staff_profiles").select("*, users(full_name, avatar_url)")
      .then(({ data }) => { if (data && data.length > 0) setStylists(data as unknown as Stylist[]); });
  }, []);

  const handleNext = () => {
    const stylist = stylists.find((s) => s.id === picked);
    if (!stylist) return;
    onNext({ staffId: stylist.id, staffName: stylist.users.full_name });
  };

  return (
    <div>
      <h2 className="font-[Playfair_Display] text-2xl text-[#0a0a0a] mb-1">Choose Your Specialist</h2>
      <p className="text-sm text-[#0a0a0a]/45 mb-10">Pick the artist you&apos;d like to work with.</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {stylists.map((stylist) => {
          const isSelected = picked === stylist.id;
          return (
            <button
              key={stylist.id}
              onClick={() => setPicked(stylist.id)}
              className={cn(
                "group text-left rounded-2xl overflow-hidden border-2 transition-all duration-300",
                isSelected
                  ? "border-[#b22222] shadow-lg shadow-[#b22222]/10"
                  : "border-black/8 bg-white hover:border-black/20 hover:shadow-md"
              )}
            >
              {/* Photo */}
              <div className="relative h-52 overflow-hidden">
                {stylist.users.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={stylist.users.avatar_url}
                    alt={stylist.users.full_name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-[#0a0a0a]/10 flex items-center justify-center">
                    <span className="text-5xl font-[Playfair_Display] text-[#0a0a0a]/20">
                      {stylist.users.full_name[0]}
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                {isSelected && (
                  <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-[#b22222] flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                {/* Rating badge */}
                <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                  <Star size={10} className="fill-[#d4af37] text-[#d4af37]" />
                  {stylist.rating.toFixed(1)}
                </div>
              </div>

              {/* Info */}
              <div className="p-4 bg-white">
                <h3 className="text-sm font-semibold text-[#0a0a0a] leading-snug mb-1">{stylist.users.full_name}</h3>
                <p className="text-[11px] text-[#0a0a0a]/40 leading-relaxed mb-3 line-clamp-2">{stylist.bio}</p>
                <div className="flex flex-wrap gap-1.5">
                  {stylist.specialty_tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="px-2.5 py-0.5 bg-black/5 rounded-full text-[10px] font-medium text-[#0a0a0a]/50">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-10 flex justify-between">
        <Button variant="outline" onClick={onBack} size="lg">Back</Button>
        <Button onClick={handleNext} disabled={!picked} size="lg" className="gap-2">
          Continue <ArrowRight size={16} />
        </Button>
      </div>
    </div>
  );
}
