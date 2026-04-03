"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import { format } from "date-fns";

export type JobRow = {
  id: string;
  title: string;
  description: string;
  requirements: string;
  is_active: boolean;
  date_posted: string;
};

const emptyForm = {
  title: "",
  description: "",
  requirements: "",
  is_active: true,
};

export function AdminCareersPanel() {
  const [rows, setRows] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<JobRow | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("job_openings")
      .select("*")
      .order("date_posted", { ascending: false });
    if (error) {
      toast.error(error.message);
      setRows([]);
    } else {
      setRows((data as JobRow[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm });
    setModalOpen(true);
  };

  const openEdit = (row: JobRow) => {
    setEditing(row);
    setForm({
      title: row.title,
      description: row.description,
      requirements: row.requirements,
      is_active: row.is_active,
    });
    setModalOpen(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.description.trim() || !form.requirements.trim()) {
      toast.error("Title, description, and requirements are required.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      requirements: form.requirements.trim(),
      is_active: form.is_active,
    };

    if (editing) {
      const { error } = await supabase.from("job_openings").update(payload).eq("id", editing.id);
      if (error) toast.error(error.message);
      else {
        toast.success("Job updated.");
        setModalOpen(false);
        load();
      }
    } else {
      const { error } = await supabase.from("job_openings").insert(payload);
      if (error) toast.error(error.message);
      else {
        toast.success("Job listing created.");
        setModalOpen(false);
        load();
      }
    }
    setSaving(false);
  };

  const remove = async (row: JobRow) => {
    if (!confirm(`Delete job “${row.title}”? This cannot be undone.`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("job_openings").delete().eq("id", row.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Job listing deleted.");
      load();
    }
  };

  if (loading) {
    return <p className="text-sm text-[#0a0a0a]/40 py-12 text-center">Loading job openings…</p>;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] font-semibold tracking-widest uppercase text-[#b22222]">Careers</p>
          <h2 className="font-[Playfair_Display] text-2xl text-[#0a0a0a]">Job openings</h2>
        </div>
        <Button onClick={openNew} className="gap-2 shrink-0">
          <Plus size={16} />
          New listing
        </Button>
      </div>

      <div className="space-y-4">
        {rows.map((r) => (
          <div
            key={r.id}
            className="bg-white rounded-2xl border border-black/5 p-5 shadow-sm flex flex-col sm:flex-row sm:items-start gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="font-semibold text-[#0a0a0a]">{r.title}</h3>
                <span className="text-[10px] uppercase tracking-wider text-[#0a0a0a]/35">
                  {r.is_active ? "Active" : "Hidden"}
                </span>
              </div>
              <p className="text-xs text-[#0a0a0a]/45 mb-2 line-clamp-2">{r.description}</p>
              <p className="text-[10px] text-[#0a0a0a]/30">
                Posted {format(new Date(r.date_posted), "MMM d, yyyy")}
              </p>
            </div>
            <div className="shrink-0 flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => openEdit(r)}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-[#b22222] border border-[#b22222]/30 hover:bg-[#b22222]/10"
              >
                <Pencil size={14} />
                Edit
              </button>
              <button
                type="button"
                onClick={() => remove(r)}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-[#0a0a0a]/45 border border-black/10 hover:border-[#b22222]/40 hover:text-[#b22222]"
              >
                <Trash2 size={14} />
                Delete
              </button>
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="py-12 text-center text-sm text-[#0a0a0a]/35 bg-white rounded-2xl border border-black/5">
            No job listings. Add one or run schema seed.
          </p>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Edit job" : "New job listing"} size="lg">
        <div className="space-y-4">
          <label className="block text-xs font-semibold text-[#0a0a0a]/50">Title</label>
          <input
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm"
          />
          <div>
            <label className="block text-xs font-semibold text-[#0a0a0a]/50 mb-1">Description</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#0a0a0a]/50 mb-1">Requirements</label>
            <textarea
              rows={4}
              value={form.requirements}
              onChange={(e) => setForm({ ...form, requirements: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm resize-none"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-[#0a0a0a]/70">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Active (visible on careers page)
          </label>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? "Save changes" : "Publish"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
