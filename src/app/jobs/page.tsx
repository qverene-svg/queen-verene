"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, Calendar, ChevronRight } from "lucide-react";
import { FloatingPageNav } from "@/components/layout/FloatingPageNav";
import { format } from "date-fns";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string;
  date_posted: string;
}

const DEMO_JOBS: Job[] = [
  { id: "j1", title: "Senior Hair Stylist", description: "Join our elite team as a senior stylist specializing in natural hair and silk presses. You will work with a discerning clientele in a luxury salon environment.", requirements: "Minimum 3 years professional experience. Portfolio required. Certification in hair care preferred.", date_posted: new Date().toISOString() },
  { id: "j2", title: "Makeup Artist", description: "We are looking for a talented makeup artist to join the Verene family. Bridal and event makeup experience is a plus.", requirements: "Minimum 2 years experience. Strong portfolio of bridal and editorial looks. Available for weekends.", date_posted: new Date().toISOString() },
];

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>(DEMO_JOBS);
  const [selected, setSelected] = useState<Job | null>(null);
  const [applying, setApplying] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", portfolio_url: "" });
  const [cv, setCv] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("job_openings").select("*").eq("is_active", true).then(({ data }) => {
      if (data && data.length > 0) setJobs(data as Job[]);
    });
  }, []);

  const handleApply = async () => {
    if (!form.name || !form.email || !form.phone) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setLoading(true);
    try {
      const body = new FormData();
      Object.entries(form).forEach(([k, v]) => body.append(k, v));
      body.append("job_id", selected!.id);
      if (cv) body.append("cv", cv);

      const res = await fetch("/api/careers/apply", { method: "POST", body });
      if (!res.ok) throw new Error("Failed to submit");
      toast.success("Application submitted! We'll be in touch.");
      setApplying(false);
      setSelected(null);
      setForm({ name: "", email: "", phone: "", portfolio_url: "" });
    } catch {
      toast.error("Submission failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f9f7f2]">
      {/* Header */}
      <div className="bg-[#0a0a0a] px-6 text-center relative overflow-hidden">
        <FloatingPageNav />
        <div className="py-16 relative">
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 50% 50%, #d4af37, transparent 60%)" }} />
          <p className="text-[#d4af37] text-xs font-semibold tracking-[0.3em] uppercase mb-3 relative z-10">Join the Team</p>
          <h1 className="font-[Playfair_Display] text-4xl sm:text-5xl text-white relative z-10">Jobs at Verene</h1>
          <p className="text-white/50 mt-4 max-w-lg mx-auto text-sm leading-relaxed relative z-10">
            We&apos;re building a team of passionate beauty professionals. If you have talent and ambition, we want to hear from you.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 sm:py-12">
        {/* Culture section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {[
            { title: "Luxury Environment", desc: "Work in an upscale, modern salon with premium tools and products." },
            { title: "Competitive Pay", desc: "Commission-based earnings with transparent, rewarding pay structure." },
            { title: "Growth & Training", desc: "Regular skill development workshops and certification support." },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-white rounded-xl p-4 border border-black/5"
            >
              <div className="w-6 h-0.5 bg-[#b22222] mb-3" />
              <h3 className="text-xs font-semibold text-[#0a0a0a] mb-1.5">{item.title}</h3>
              <p className="text-[10px] text-[#0a0a0a]/55 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Job listings */}
        <h2 className="font-[Playfair_Display] text-3xl text-[#0a0a0a] mb-6">Open Positions</h2>
        <div className="space-y-5">
          {jobs.map((job, i) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-white rounded-2xl border border-black/5 hover:border-[#b22222]/40 hover:shadow-lg transition-all cursor-pointer group overflow-hidden"
              onClick={() => setSelected(job)}
            >
              {/* Accent bar */}
              <div className="h-1 bg-gradient-to-r from-[#b22222] to-[#d4af37] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="p-5 sm:p-7 lg:p-9">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    {/* Role badge row */}
                    <div className="flex items-center gap-3 mb-3 flex-wrap">
                      <div className="w-9 h-9 rounded-xl bg-[#b22222]/10 flex items-center justify-center shrink-0">
                        <Briefcase size={17} className="text-[#b22222]" />
                      </div>
                      <Badge variant="crimson">Now Hiring</Badge>
                      <div className="flex items-center gap-1 text-[11px] text-[#0a0a0a]/35 tracking-wide">
                        <Calendar size={11} />
                        Posted {format(new Date(job.date_posted), "MMMM d, yyyy")}
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-[Playfair_Display] text-xl sm:text-2xl text-[#0a0a0a] mb-3 leading-snug">{job.title}</h3>

                    {/* Description — full, not truncated */}
                    <p className="text-sm text-[#0a0a0a]/60 leading-relaxed mb-4">{job.description}</p>

                    {/* Requirements preview */}
                    <div className="bg-[#f9f7f2] rounded-xl px-4 py-3 border border-black/5">
                      <p className="text-[10px] font-semibold tracking-widest uppercase text-[#b22222] mb-1.5">Requirements</p>
                      <p className="text-xs text-[#0a0a0a]/60 leading-relaxed">{job.requirements}</p>
                    </div>

                    {/* CTA hint */}
                    <p className="text-xs text-[#b22222] font-semibold mt-5 group-hover:underline underline-offset-2 flex items-center gap-1.5">
                      View details & apply <ChevronRight size={13} />
                    </p>
                  </div>

                  {/* Desktop arrow */}
                  <div className="hidden sm:flex w-10 h-10 rounded-full border border-black/8 items-center justify-center shrink-0 mt-1 group-hover:bg-[#b22222] group-hover:border-[#b22222] transition-all">
                    <ChevronRight size={16} className="text-[#0a0a0a]/30 group-hover:text-white transition-colors" />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {jobs.length === 0 && (
          <div className="text-center py-20 text-[#0a0a0a]/40">
            <p className="font-[Playfair_Display] text-2xl mb-2">No open positions right now</p>
            <p className="text-sm">Check back soon or send your CV to hello@verene.com</p>
          </div>
        )}
      </div>

      {/* Job detail modal */}
      <Modal
        open={!!selected && !applying}
        onClose={() => setSelected(null)}
        title={selected?.title || ""}
        size="lg"
      >
        {selected && (
          <div>
            <div className="mb-6">
              <p className="text-xs font-semibold tracking-widest uppercase text-[#b22222] mb-3">About the Role</p>
              <p className="text-sm text-[#0a0a0a]/70 leading-relaxed">{selected.description}</p>
            </div>
            <div className="mb-8">
              <p className="text-xs font-semibold tracking-widest uppercase text-[#0a0a0a]/50 mb-3">Requirements</p>
              <p className="text-sm text-[#0a0a0a]/70 leading-relaxed">{selected.requirements}</p>
            </div>
            <Button size="lg" onClick={() => setApplying(true)} className="w-full">
              Apply for This Role
            </Button>
          </div>
        )}
      </Modal>

      {/* Application modal */}
      <Modal
        open={applying}
        onClose={() => setApplying(false)}
        title={`Apply — ${selected?.title}`}
        size="lg"
      >
        <div className="space-y-6">
          <Input label="Full Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Akua Mensah" />
          <Input label="Email *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" />
          <Input label="Phone *" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="0244 000 000" />
          <Input label="Portfolio URL (optional)" value={form.portfolio_url} onChange={(e) => setForm({ ...form, portfolio_url: e.target.value })} placeholder="https://yourportfolio.com" />
          <div>
            <label className="block text-xs font-semibold tracking-widest uppercase text-[#0a0a0a]/60 mb-2">CV / Resume (PDF)</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setCv(e.target.files?.[0] || null)}
              className="w-full text-sm text-[#0a0a0a]/60 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#0a0a0a] file:text-white hover:file:bg-[#1a1a1a] transition-all"
            />
          </div>
          <Button size="lg" loading={loading} onClick={handleApply} className="w-full mt-4">
            Submit Application
          </Button>
        </div>
      </Modal>
    </div>
  );
}
