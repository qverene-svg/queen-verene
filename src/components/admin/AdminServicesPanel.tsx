"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Tag, ChevronDown, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import { DEFAULT_SERVICE_CATEGORIES } from "./serviceCategories";
import { AdminImageUpload } from "./AdminImageUpload";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ServiceRow = {
  id: string;
  name: string;
  duration_minutes: number;
  price: number;
  description: string | null;
  category: string;
  image_url: string | null;
  is_active: boolean;
};

interface CustomCategory {
  value: string;
  label: string;
  isDefault: boolean;
}

const STORAGE_KEY = "verene_service_categories";

function loadCategories(): CustomCategory[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const custom: { value: string; label: string }[] = raw ? JSON.parse(raw) : [];
    const defaults: CustomCategory[] = DEFAULT_SERVICE_CATEGORIES.map((c) => ({ value: c.value as string, label: c.label as string, isDefault: true }));
    const customWithFlag: CustomCategory[] = custom.map((c) => ({ ...c, isDefault: false }));
    // merge, avoid duplicates by value
    const merged = [...defaults];
    for (const c of customWithFlag) {
      if (!merged.find((m) => m.value === c.value)) merged.push(c);
    }
    return merged;
  } catch {
    return DEFAULT_SERVICE_CATEGORIES.map((c) => ({ ...c, isDefault: true }));
  }
}

function saveCustomCategories(categories: CustomCategory[]) {
  const custom = categories.filter((c) => !c.isDefault);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
}

// ── Empty form ────────────────────────────────────────────────────────────────

const emptyForm = {
  name: "",
  duration_minutes: 60,
  priceGhs: "" as string | number,
  description: "",
  category: "braiding",
  image_url: "",
  is_active: true,
};

// ── Component ─────────────────────────────────────────────────────────────────

export function AdminServicesPanel() {
  const [tab,        setTab]        = useState<"services" | "categories">("services");
  const [rows,       setRows]       = useState<ServiceRow[]>([]);
  const [categories, setCategories] = useState<CustomCategory[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editing,    setEditing]    = useState<ServiceRow | null>(null);
  const [form,       setForm]       = useState(emptyForm);
  const [saving,     setSaving]     = useState(false);

  // Category management state
  const [newCatName, setNewCatName] = useState("");
  const [addingCat,  setAddingCat]  = useState(false);

  // Load categories from localStorage on mount
  useEffect(() => {
    setCategories(loadCategories());
  }, []);

  const load = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.from("services").select("*").order("name");
    if (error) { toast.error(error.message); setRows([]); }
    else setRows((data as ServiceRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // ── Service CRUD ──────────────────────────────────────────────────────────

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm, priceGhs: "", category: categories[0]?.value ?? "braiding" });
    setModalOpen(true);
  };

  const openEdit = (row: ServiceRow) => {
    setEditing(row);
    setForm({
      name: row.name,
      duration_minutes: row.duration_minutes,
      priceGhs: (row.price / 100).toFixed(2),
      description: row.description || "",
      category: row.category,
      image_url: row.image_url || "",
      is_active: row.is_active,
    });
    setModalOpen(true);
  };

  const save = async () => {
    const priceNum = Number(form.priceGhs);
    if (!form.name.trim() || !Number.isFinite(priceNum) || priceNum < 0) {
      toast.error("Name and a valid price (GHS) are required."); return;
    }
    const pesewas = Math.round(priceNum * 100);
    setSaving(true);
    const supabase = createClient();
    const payload = {
      name:             form.name.trim(),
      duration_minutes: Math.max(1, Math.round(Number(form.duration_minutes)) || 60),
      price:            pesewas,
      description:      form.description.trim() || null,
      category:         form.category,
      image_url:        form.image_url.trim() || null,
      is_active:        form.is_active,
    };

    if (editing) {
      const { error } = await supabase.from("services").update(payload).eq("id", editing.id);
      if (error) toast.error(error.message);
      else { toast.success("Service updated."); setModalOpen(false); load(); }
    } else {
      const { error } = await supabase.from("services").insert(payload);
      if (error) toast.error(error.message);
      else { toast.success("Service created."); setModalOpen(false); load(); }
    }
    setSaving(false);
  };

  const remove = async (row: ServiceRow) => {
    if (!confirm(`Delete service "${row.name}"? This cannot be undone.`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("services").delete().eq("id", row.id);
    if (error) toast.error(error.message);
    else { toast.success("Service deleted."); load(); }
  };

  // ── Category CRUD ─────────────────────────────────────────────────────────

  const addCategory = () => {
    const name = newCatName.trim();
    if (!name) { toast.error("Category name is required."); return; }
    const value = name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    if (categories.find((c) => c.value === value)) {
      toast.error("A category with that name already exists."); return;
    }
    const updated = [...categories, { value, label: name, isDefault: false }];
    setCategories(updated);
    saveCustomCategories(updated);
    setNewCatName("");
    setAddingCat(false);
    toast.success(`Category "${name}" added.`);
  };

  const deleteCategory = (cat: CustomCategory) => {
    if (cat.isDefault) { toast.error("Default categories cannot be removed."); return; }
    if (!confirm(`Remove category "${cat.label}"? Services using it won't be affected.`)) return;
    const updated = categories.filter((c) => c.value !== cat.value);
    setCategories(updated);
    saveCustomCategories(updated);
    toast.success(`Category "${cat.label}" removed.`);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Section header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#b22222]">Catalog</p>
          <h2 className="font-[Playfair_Display] text-2xl text-[#0a0a0a]">Services</h2>
        </div>
        {tab === "services" && (
          <Button onClick={openNew} className="gap-2 shrink-0">
            <Plus size={15} /> New Service
          </Button>
        )}
        {tab === "categories" && (
          <Button onClick={() => setAddingCat(true)} className="gap-2 shrink-0">
            <Plus size={15} /> Add Category
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white/[0.07] rounded-xl p-1 w-fit">
        {(["services", "categories"] as const).map((t) => (
          <button key={t} type="button"
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all",
              tab === t ? "bg-white text-[#0a0a0a] shadow-sm" : "text-white/50 hover:text-white/80"
            )}
          >
            {t === "services" ? "Services" : "Categories"}
          </button>
        ))}
      </div>

      {/* ── Services list ── */}
      {tab === "services" && (
        <>
          {loading ? (
            <p className="text-sm text-[#0a0a0a]/40 py-12 text-center">Loading services…</p>
          ) : (
            <div className="bg-white rounded-2xl border border-black/[0.06] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-black/[0.05] bg-[#fafafa]">
                      {["Name", "Category", "Duration", "Price", "Active", ""].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#0a0a0a]/30">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04]">
                    {rows.map((r) => (
                      <tr key={r.id} className="hover:bg-black/[0.015] transition-colors">
                        <td className="px-4 py-3 font-semibold text-[#0a0a0a]">{r.name}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wide bg-black/[0.05] text-[#0a0a0a]/55 px-2 py-0.5 rounded-full capitalize">
                            <Tag size={9} />
                            {r.category.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#0a0a0a]/50 text-xs">{r.duration_minutes} min</td>
                        <td className="px-4 py-3 font-semibold text-[#0a0a0a]">{formatCurrency(r.price)}</td>
                        <td className="px-4 py-3">
                          <span className={cn("text-[10px] font-bold uppercase", r.is_active ? "text-emerald-600" : "text-[#0a0a0a]/30")}>
                            {r.is_active ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-0.5">
                            <button type="button" onClick={() => openEdit(r)}
                              className="p-2 rounded-lg text-[#b22222] hover:bg-[#b22222]/10 transition-colors" aria-label="Edit">
                              <Pencil size={14} />
                            </button>
                            <button type="button" onClick={() => remove(r)}
                              className="p-2 rounded-lg text-[#0a0a0a]/30 hover:text-[#b22222] hover:bg-[#b22222]/10 transition-colors" aria-label="Delete">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {rows.length === 0 && (
                <p className="py-12 text-center text-sm text-[#0a0a0a]/35">No services yet. Add one or run schema seed.</p>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Categories list ── */}
      {tab === "categories" && (
        <div>
          {/* Add category inline form */}
          {addingCat && (
            <div className="bg-white rounded-2xl border border-[#b22222]/20 shadow-sm p-4 mb-4 flex items-center gap-3">
              <input
                autoFocus
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCategory()}
                placeholder="Category name (e.g. Locs, Threading…)"
                className="flex-1 px-3 py-2 rounded-lg border border-black/10 text-sm text-[#0a0a0a] focus:outline-none focus:border-[#b22222]/50"
              />
              <Button onClick={addCategory} className="shrink-0">Add</Button>
              <Button variant="outline" onClick={() => { setAddingCat(false); setNewCatName(""); }} className="shrink-0">Cancel</Button>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-black/[0.05] bg-[#fafafa]">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#0a0a0a]/30">
                {categories.length} categories — {categories.filter((c) => !c.isDefault).length} custom
              </p>
            </div>
            <ul className="divide-y divide-black/[0.04]">
              {categories.map((cat) => (
                <li key={cat.value} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-[#b22222]/8 flex items-center justify-center">
                      <Tag size={12} className="text-[#b22222]" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-[#0a0a0a]">{cat.label}</p>
                      <p className="text-[10px] text-[#0a0a0a]/35 font-mono">{cat.value}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {cat.isDefault && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#0a0a0a]/25 bg-black/[0.05] px-2 py-0.5 rounded-full">
                        Default
                      </span>
                    )}
                    {!cat.isDefault && (
                      <button type="button" onClick={() => deleteCategory(cat)}
                        className="p-1.5 rounded-lg text-[#0a0a0a]/30 hover:text-[#b22222] hover:bg-[#b22222]/10 transition-colors" aria-label="Remove">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* ── Service form modal ── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? "Edit Service" : "New Service"} size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0a0a0a]/50 mb-1">Service Name</label>
            <input value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm text-[#0a0a0a] focus:outline-none focus:border-[#b22222]/40 transition-colors" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0a0a0a]/50 mb-1">Duration (minutes)</label>
              <input type="number" min={1} value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm text-[#0a0a0a] focus:outline-none focus:border-[#b22222]/40 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0a0a0a]/50 mb-1">Price (GHS)</label>
              <input type="number" step="0.01" min={0} value={form.priceGhs}
                onChange={(e) => setForm({ ...form, priceGhs: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm text-[#0a0a0a] focus:outline-none focus:border-[#b22222]/40 transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0a0a0a]/50 mb-1">Category</label>
            <select value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm text-[#0a0a0a] bg-white focus:outline-none focus:border-[#b22222]/40 transition-colors">
              {categories.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
            <p className="text-[10px] text-[#0a0a0a]/30 mt-1">
              Add more categories in the Categories tab.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0a0a0a]/50 mb-1">Description</label>
            <textarea rows={3} value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm text-[#0a0a0a] resize-none focus:outline-none focus:border-[#b22222]/40 transition-colors" />
          </div>

          <AdminImageUpload label="Service image" folder="services"
            value={form.image_url}
            onUrlChange={(url) => setForm({ ...form, image_url: url })} />

          <label className="flex items-center gap-2 text-sm text-[#0a0a0a]/70 cursor-pointer">
            <input type="checkbox" checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active (visible on booking page)
          </label>

          <div className="flex justify-end gap-2 pt-4 border-t border-black/[0.06]">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? "Save Changes" : "Create Service"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
