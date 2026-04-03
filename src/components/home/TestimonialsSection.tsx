"use client";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Abena Mensah",
    role: "Loyal Client",
    text: "Verene transformed my hair completely. The stylist was professional, attentive, and the results were beyond my expectations. I won't go anywhere else!",
    rating: 5,
  },
  {
    name: "Efua Asante",
    role: "Bridal Client",
    text: "I booked my bridal makeup and it was absolutely perfect. The team understood my vision and executed it flawlessly. Everyone at my wedding was asking who did my makeup.",
    rating: 5,
  },
  {
    name: "Akua Boateng",
    role: "Regular Client",
    text: "The booking system is so easy and the reminders are super helpful. I love how luxurious the whole experience feels — from booking to the final result.",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-24 px-6 bg-[#f9f7f2]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-[#b22222] text-xs font-semibold tracking-[0.3em] uppercase mb-3"
          >
            Client Love
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-[Playfair_Display] text-4xl sm:text-5xl text-[#0a0a0a]"
          >
            What Our Clients Say
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="bg-white rounded-2xl p-8 shadow-sm border border-black/5 relative"
            >
              {/* Gold accent */}
              <div className="absolute top-0 left-8 right-8 h-0.5 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent" />
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} size={14} className="fill-[#d4af37] text-[#d4af37]" />
                ))}
              </div>
              <p className="text-[#0a0a0a]/70 text-sm leading-relaxed mb-6 italic">
                &ldquo;{t.text}&rdquo;
              </p>
              <div>
                <p className="font-[Playfair_Display] text-[#0a0a0a] font-semibold">{t.name}</p>
                <p className="text-xs text-[#0a0a0a]/40 tracking-wider uppercase mt-0.5">{t.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
