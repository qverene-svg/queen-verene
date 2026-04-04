"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FloatingPageNav } from "@/components/layout/FloatingPageNav";
import { format } from "date-fns";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";

interface Job {
  id: string;
  title: string;
  description: string;
  requirements: string;
  date_posted: string;
  location?: string;
  type?: string;
}

const DEMO_JOBS: Job[] = [
  {
    id: "j1",
    title: "Senior Hair Stylist",
    description: "Join our elite team as a senior stylist specialising in natural hair, silk presses, and protective styles. You will work alongside gifted artisans in a refined studio environment, caring for a discerning clientele who expect nothing less than excellence.",
    requirements: "Minimum 3 years professional experience. Portfolio required. Certification in hair care preferred. Exemplary communication and a genuine passion for the craft.",
    date_posted: new Date().toISOString(),
    location: "Accra, Ghana",
    type: "Full-time",
  },
  {
    id: "j2",
    title: "Makeup Artist",
    description: "We are seeking a gifted makeup artist to join the Verene family. You will create flawless, enduring looks — from intimate everyday appointments to grand bridal transformations — each one a reflection of the Verene standard.",
    requirements: "Minimum 2 years professional experience. A compelling portfolio of bridal and editorial work. Weekend availability is essential. Own kit preferred.",
    date_posted: new Date().toISOString(),
    location: "Accra, Ghana",
    type: "Part-time",
  },
];

const PILLARS = [
  {
    roman: "I",
    title: "A Refined Workspace",
    body: "Our studio is an environment of calm luxury — premium tools, curated products, and an atmosphere that inspires mastery every day.",
  },
  {
    roman: "II",
    title: "Rewarding Compensation",
    body: "A transparent commission structure that recognises excellence and grows alongside your reputation within the studio.",
  },
  {
    roman: "III",
    title: "Continuous Growth",
    body: "Ongoing workshops, certification support, and mentorship from seasoned professionals invested in your long-term success.",
  },
];

/* ── Thin gold rule ─────────────────────────────────────────────────────────── */
function GoldRule({ width = 48 }: { width?: number }) {
  return <div style={{ width, height: 1, background: "linear-gradient(to right, #d4af37, rgba(212,175,55,0.2))", margin: "0 0 0 0" }} />;
}

export default function JobsPage() {
  const [jobs, setJobs]         = useState<Job[]>(DEMO_JOBS);
  const [selected, setSelected] = useState<Job | null>(null);
  const [applying, setApplying] = useState(false);
  const [form, setForm]         = useState({ name: "", email: "", phone: "", portfolio_url: "" });
  const [cv, setCv]             = useState<File | null>(null);
  const [loading, setLoading]   = useState(false);

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
      toast.success("Application submitted. We will be in touch.");
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
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: "var(--font-montserrat),sans-serif" }}>

      {/* ── Dark header — pt-16 clears fixed navbar ── */}
      <div style={{ background: "#0a0a0a", paddingTop: 64, position: "relative", overflow: "hidden" }}>
        {/* Ambient glow */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(212,175,55,0.07) 0%, transparent 70%)" }} />
        <FloatingPageNav />

        {/* ── Hero ── */}
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "72px 40px 80px", textAlign: "center", position: "relative", zIndex: 1 }}>
          {/* Ornament */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}
            style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 28 }}
          >
            <div style={{ height: 1, width: 60, background: "linear-gradient(to right, transparent, rgba(212,175,55,0.5))" }} />
            <span style={{ color: "#d4af37", fontSize: 9, fontWeight: 700, letterSpacing: "0.45em", textTransform: "uppercase" }}>
              Queen Verene · Careers
            </span>
            <div style={{ height: 1, width: 60, background: "linear-gradient(to left, transparent, rgba(212,175,55,0.5))" }} />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: [0.25, 0.4, 0.25, 1] }}
            style={{
              fontFamily: "var(--font-playfair),'Playfair Display',serif",
              fontSize: "clamp(38px, 6vw, 62px)", fontWeight: 700,
              color: "#fff", lineHeight: 1.1, margin: "0 0 24px",
              letterSpacing: "-0.01em",
            }}
          >
            Join the Art of Beauty
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.28 }}
            style={{ color: "rgba(255,255,255,0.42)", fontSize: 15, lineHeight: 1.75, maxWidth: 520, margin: "0 auto 36px" }}
          >
            We are building a collective of extraordinary talent — artists who believe
            that beauty is not merely an aesthetic, but an experience to be curated with intention.
          </motion.p>

          {/* Scroll cue */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            style={{ display: "flex", justifyContent: "center" }}
          >
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{ width: 1, height: 40, background: "linear-gradient(to bottom, rgba(212,175,55,0.6), transparent)" }} />
              <span style={{ fontSize: 8, letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(255,255,255,0.2)" }}>Scroll</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Body — light background below ── */}
      <div style={{ background: "#f9f7f2", color: "#0a0a0a" }}>

        {/* ── Pillars ── */}
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "72px 40px 0" }}>

          {/* Section label */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: "center", marginBottom: 56 }}
          >
            <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.4em", textTransform: "uppercase", color: "#b22222", marginBottom: 14 }}>
              Why Verene
            </p>
            <h2 style={{ fontFamily: "var(--font-playfair),'Playfair Display',serif", fontSize: 32, color: "#0a0a0a", margin: 0 }}>
              The Verene Standard
            </h2>
            <div style={{ width: 40, height: 1, background: "#d4af37", margin: "18px auto 0" }} />
          </motion.div>

          {/* 3-pillar row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, marginBottom: 80 }}>
            {PILLARS.map((p, i) => (
              <motion.div
                key={p.roman}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{
                  background: "#fff",
                  padding: "40px 36px",
                  borderTop: "3px solid #d4af37",
                  position: "relative",
                }}
              >
                <p style={{
                  fontFamily: "var(--font-playfair),'Playfair Display',serif",
                  fontSize: 48, fontWeight: 400, color: "rgba(212,175,55,0.18)",
                  margin: "0 0 20px", lineHeight: 1, letterSpacing: "-0.02em",
                }}>
                  {p.roman}
                </p>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0a0a0a", marginBottom: 12, letterSpacing: "0.01em" }}>
                  {p.title}
                </h3>
                <p style={{ fontSize: 13, color: "rgba(10,10,10,0.52)", lineHeight: 1.7 }}>{p.body}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ── Open Positions ── */}
        <div style={{ background: "#0a0a0a", padding: "72px 40px 80px" }}>
          <div style={{ maxWidth: 820, margin: "0 auto" }}>

            {/* Section header */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              style={{ marginBottom: 52 }}
            >
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.4em", textTransform: "uppercase", color: "#d4af37", marginBottom: 14 }}>
                Current Openings
              </p>
              <h2 style={{ fontFamily: "var(--font-playfair),'Playfair Display',serif", fontSize: 34, color: "#fff", margin: "0 0 16px" }}>
                Open Positions
              </h2>
              <div style={{ height: 1, width: "100%", background: "rgba(255,255,255,0.07)" }} />
            </motion.div>

            {/* Job cards */}
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {jobs.map((job, i) => (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <button
                    type="button"
                    onClick={() => setSelected(job)}
                    style={{
                      width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer",
                      borderBottom: "1px solid rgba(255,255,255,0.07)",
                      padding: "36px 0", display: "flex", alignItems: "flex-start",
                      justifyContent: "space-between", gap: 24,
                      transition: "padding-left 0.3s",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.paddingLeft = "12px"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.paddingLeft = "0"; }}
                  >
                    <div style={{ flex: 1 }}>
                      {/* Meta */}
                      <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 14 }}>
                        {job.type && (
                          <span style={{
                            fontSize: 9, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase",
                            color: "#d4af37", border: "1px solid rgba(212,175,55,0.35)",
                            padding: "3px 10px", borderRadius: 999,
                          }}>
                            {job.type}
                          </span>
                        )}
                        {job.location && (
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", letterSpacing: "0.04em" }}>
                            {job.location}
                          </span>
                        )}
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.22)" }}>
                          {format(new Date(job.date_posted), "MMMM yyyy")}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 style={{
                        fontFamily: "var(--font-playfair),'Playfair Display',serif",
                        fontSize: 24, fontWeight: 700, color: "#fff",
                        margin: "0 0 12px", lineHeight: 1.2,
                      }}>
                        {job.title}
                      </h3>

                      {/* Description excerpt */}
                      <p style={{
                        fontSize: 13, color: "rgba(255,255,255,0.42)", lineHeight: 1.7, margin: 0,
                        display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
                      }}>
                        {job.description}
                      </p>
                    </div>

                    {/* Arrow */}
                    <div style={{
                      width: 44, height: 44, borderRadius: "50%",
                      border: "1px solid rgba(212,175,55,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, marginTop: 8,
                      transition: "background 0.2s, border-color 0.2s",
                      color: "#d4af37", fontSize: 18,
                    }}>
                      →
                    </div>
                  </button>
                </motion.div>
              ))}
            </div>

            {jobs.length === 0 && (
              <div style={{ textAlign: "center", padding: "64px 0", color: "rgba(255,255,255,0.25)" }}>
                <p style={{ fontFamily: "var(--font-playfair),'Playfair Display',serif", fontSize: 22, marginBottom: 8 }}>
                  No open positions at this time
                </p>
                <p style={{ fontSize: 13 }}>
                  Please check back soon, or send your portfolio to{" "}
                  <a href="mailto:qverene@gmail.com" style={{ color: "#d4af37", textDecoration: "none" }}>qverene@gmail.com</a>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Closing quote ── */}
        <div style={{ background: "#f9f7f2", padding: "72px 40px", textAlign: "center" }}>
          <div style={{ maxWidth: 560, margin: "0 auto" }}>
            <div style={{ width: 1, height: 48, background: "linear-gradient(to bottom, #d4af37, transparent)", margin: "0 auto 32px" }} />
            <p style={{
              fontFamily: "var(--font-playfair),'Playfair Display',serif",
              fontSize: 20, fontStyle: "italic", color: "rgba(10,10,10,0.55)", lineHeight: 1.7,
              margin: "0 0 20px",
            }}>
              &ldquo;Every great stylist began with one appointment, one client, one moment of connection.&rdquo;
            </p>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "#d4af37" }}>
              — Queen Verene
            </p>
          </div>
        </div>
      </div>

      {/* ── Job detail modal ── */}
      <Modal open={!!selected && !applying} onClose={() => setSelected(null)} title={selected?.title || ""} size="lg">
        {selected && (
          <div>
            {/* Meta */}
            <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
              {selected.type && (
                <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "#b22222", border: "1px solid rgba(178,34,34,0.3)", padding: "3px 10px", borderRadius: 999 }}>
                  {selected.type}
                </span>
              )}
              {selected.location && (
                <span style={{ fontSize: 12, color: "rgba(10,10,10,0.4)" }}>{selected.location}</span>
              )}
            </div>
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "#b22222", marginBottom: 10 }}>About the Role</p>
              <p style={{ fontSize: 14, color: "rgba(10,10,10,0.68)", lineHeight: 1.8 }}>{selected.description}</p>
            </div>
            <div style={{ marginBottom: 32, padding: "18px 20px", background: "#f9f7f2", borderRadius: 12, borderLeft: "3px solid #d4af37" }}>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(10,10,10,0.4)", marginBottom: 8 }}>Requirements</p>
              <p style={{ fontSize: 13, color: "rgba(10,10,10,0.65)", lineHeight: 1.75 }}>{selected.requirements}</p>
            </div>
            <Button size="lg" onClick={() => setApplying(true)} className="w-full">
              Apply for This Role
            </Button>
          </div>
        )}
      </Modal>

      {/* ── Application modal ── */}
      <Modal open={applying} onClose={() => setApplying(false)} title={`Apply — ${selected?.title}`} size="lg">
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
