"use client";
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, cn } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import { AdminImageUpload } from "./AdminImageUpload";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ProductRow = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  stock_level: number;
  is_available: boolean;
  image_urls: string[];
  category: string;
  sku: string;
};

// ── Default categories ────────────────────────────────────────────────────────

const DEFAULT_PRODUCT_CATEGORIES = [
  "Hair Extensions",
  "Wigs",
  "Hair Care",
  "Nail Care",
  "Makeup & Beauty",
  "Accessories",
  "Tools & Equipment",
];

const PRODUCT_CAT_STORAGE_KEY = "verene_product_categories";

function loadProductCategories(): string[] {
  try {
    const raw = localStorage.getItem(PRODUCT_CAT_STORAGE_KEY);
    const custom: string[] = raw ? JSON.parse(raw) : [];
    // merge defaults + custom, deduplicate
    return Array.from(new Set([...DEFAULT_PRODUCT_CATEGORIES, ...custom]));
  } catch {
    return [...DEFAULT_PRODUCT_CATEGORIES];
  }
}

function saveCustomProductCategories(categories: string[]) {
  const custom = categories.filter((c) => !DEFAULT_PRODUCT_CATEGORIES.includes(c));
  localStorage.setItem(PRODUCT_CAT_STORAGE_KEY, JSON.stringify(custom));
}

// ── Empty form ────────────────────────────────────────────────────────────────

const emptyForm = {
  name:         "",
  description:  "",
  priceGhs:     "" as string | number,
  stock_level:  0,
  is_available: true,
  category:     DEFAULT_PRODUCT_CATEGORIES[0],
  sku:          "",
  image_url:    "",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function AdminProductsPanel() {
  const [tab,          setTab]         = useState<"products" | "categories">("products");
  const [rows,         setRows]        = useState<ProductRow[]>([]);
  const [allCats,      setAllCats]     = useState<string[]>([]);
  const [loading,      setLoading]     = useState(true);
  const [modalOpen,    setModalOpen]   = useState(false);
  const [editing,      setEditing]     = useState<ProductRow | null>(null);
  const [form,         setForm]        = useState(emptyForm);
  const [saving,       setSaving]      = useState(false);
  const [newCatName,   setNewCatName]  = useState("");
  const [addingCat,    setAddingCat]   = useState(false);

  useEffect(() => {
    setAllCats(loadProductCategories());
  }, []);

  const load = async () => {
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.from("products").select("*").order("name");
    if (error) { toast.error(error.message); setRows([]); }
    else setRows((data as ProductRow[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // ── Product CRUD ──────────────────────────────────────────────────────────

  const openNew = () => {
    setEditing(null);
    setForm({ ...emptyForm, priceGhs: "", sku: `SKU-${Date.now().toString(36).toUpperCase()}`, category: allCats[0] ?? DEFAULT_PRODUCT_CATEGORIES[0] });
    setModalOpen(true);
  };

  const openEdit = (row: ProductRow) => {
    setEditing(row);
    setForm({
      name:         row.name,
      description:  row.description || "",
      priceGhs:     (row.price / 100).toFixed(2),
      stock_level:  row.stock_level,
      is_available: row.is_available,
      category:     row.category,
      sku:          row.sku,
      image_url:    row.image_urls?.[0] || "",
    });
    setModalOpen(true);
  };

  const save = async () => {
    const priceNum = Number(form.priceGhs);
    if (!form.name.trim() || !form.sku.trim() || !Number.isFinite(priceNum) || priceNum < 0) {
      toast.error("Name, SKU, and a valid price (GHS) are required."); return;
    }
    const pesewas  = Math.round(priceNum * 100);
    setSaving(true);
    const supabase = createClient();
    const imageUrls = form.image_url.trim() ? [form.image_url.trim()] : [];
    const payload = {
      name:         form.name.trim(),
      description:  form.description.trim() || null,
      price:        pesewas,
      stock_level:  Math.max(0, Math.round(Number(form.stock_level)) || 0),
      is_available: form.is_available,
      category:     form.category.trim() || "General",
      sku:          form.sku.trim(),
      image_urls:   imageUrls,
    };

    if (editing) {
      const { error } = await supabase.from("products").update(payload).eq("id", editing.id);
      if (error) toast.error(error.message);
      else { toast.success("Product updated."); setModalOpen(false); load(); }
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) toast.error(error.message);
      else { toast.success("Product created."); setModalOpen(false); load(); }
    }
    setSaving(false);
  };

  const remove = async (row: ProductRow) => {
    if (!confirm(`Delete product "${row.name}"? This cannot be undone.`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("products").delete().eq("id", row.id);
    if (error) toast.error(error.message);
    else { toast.success("Product deleted."); load(); }
  };

  // ── Category CRUD ─────────────────────────────────────────────────────────

  const addCategory = () => {
    const name = newCatName.trim();
    if (!name) { toast.error("Category name is required."); return; }
    if (allCats.includes(name)) { toast.error("Category already exists."); return; }
    const updated = [...allCats, name];
    setAllCats(updated);
    saveCustomProductCategories(updated);
    setNewCatName("");
    setAddingCat(false);
    toast.success(`Category "${name}" added.`);
  };

  const deleteCategory = (cat: string) => {
    if (DEFAULT_PRODUCT_CATEGORIES.includes(cat)) { toast.error("Default categories cannot be removed."); return; }
    if (!confirm(`Remove category "${cat}"? Products using it won't be affected.`)) return;
    const updated = allCats.filter((c) => c !== cat);
    setAllCats(updated);
    saveCustomProductCategories(updated);
    toast.success(`Category "${cat}" removed.`);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Section header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-[10px] font-bold tracking-[0.25em] uppercase text-[#b22222]">Shop</p>
          <h2 className="font-[Playfair_Display] text-2xl text-[#0a0a0a]">Products</h2>
        </div>
        {tab === "products" && (
          <Button onClick={openNew} className="gap-2 shrink-0">
            <Plus size={15} /> New Product
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
        {(["products", "categories"] as const).map((t) => (
          <button key={t} type="button"
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 rounded-lg text-xs font-semibold tracking-wider uppercase transition-all",
              tab === t ? "bg-white text-[#0a0a0a] shadow-sm" : "text-white/50 hover:text-white/80"
            )}
          >
            {t === "products" ? "Products" : "Categories"}
          </button>
        ))}
      </div>

      {/* ── Products list ── */}
      {tab === "products" && (
        <>
          {loading ? (
            <p className="text-sm text-[#0a0a0a]/40 py-12 text-center">Loading products…</p>
          ) : (
            <div className="bg-white rounded-2xl border border-black/[0.06] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-black/[0.05] bg-[#fafafa]">
                      {["Name", "SKU", "Category", "Price", "Stock", "Listed", ""].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-[#0a0a0a]/30">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04]">
                    {rows.map((r) => (
                      <tr key={r.id} className="hover:bg-black/[0.015] transition-colors">
                        <td className="px-4 py-3 font-semibold text-[#0a0a0a]">{r.name}</td>
                        <td className="px-4 py-3 text-xs text-[#0a0a0a]/40 font-mono">{r.sku}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-black/[0.05] text-[#0a0a0a]/55 px-2 py-0.5 rounded-full">
                            <Tag size={9} />
                            {r.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#0a0a0a]">{formatCurrency(r.price)}</td>
                        <td className="px-4 py-3 text-[#0a0a0a]/50">{r.stock_level}</td>
                        <td className="px-4 py-3">
                          <span className={cn("text-[10px] font-bold uppercase", r.is_available ? "text-emerald-600" : "text-[#0a0a0a]/30")}>
                            {r.is_available ? "Yes" : "No"}
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
                <p className="py-12 text-center text-sm text-[#0a0a0a]/35">No products yet. Add one to populate the shop.</p>
              )}
            </div>
          )}
        </>
      )}

      {/* ── Categories list ── */}
      {tab === "categories" && (
        <div>
          {addingCat && (
            <div className="bg-white rounded-2xl border border-[#b22222]/20 shadow-sm p-4 mb-4 flex items-center gap-3">
              <input autoFocus value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCategory()}
                placeholder="Category name (e.g. Skincare, Fragrances…)"
                className="flex-1 px-3 py-2 rounded-lg border border-black/10 text-sm text-[#0a0a0a] focus:outline-none focus:border-[#b22222]/50" />
              <Button onClick={addCategory} className="shrink-0">Add</Button>
              <Button variant="outline" onClick={() => { setAddingCat(false); setNewCatName(""); }} className="shrink-0">Cancel</Button>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-black/[0.06] shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-black/[0.05] bg-[#fafafa]">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#0a0a0a]/30">
                {allCats.length} categories — {allCats.filter((c) => !DEFAULT_PRODUCT_CATEGORIES.includes(c)).length} custom
              </p>
            </div>
            <ul className="divide-y divide-black/[0.04]">
              {allCats.map((cat) => {
                const isDefault = DEFAULT_PRODUCT_CATEGORIES.includes(cat);
                return (
                  <li key={cat} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-[#b22222]/8 flex items-center justify-center">
                        <Tag size={12} className="text-[#b22222]" />
                      </span>
                      <p className="text-sm font-semibold text-[#0a0a0a]">{cat}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isDefault && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#0a0a0a]/25 bg-black/[0.05] px-2 py-0.5 rounded-full">
                          Default
                        </span>
                      )}
                      {!isDefault && (
                        <button type="button" onClick={() => deleteCategory(cat)}
                          className="p-1.5 rounded-lg text-[#0a0a0a]/30 hover:text-[#b22222] hover:bg-[#b22222]/10 transition-colors" aria-label="Remove">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {/* ── Product form modal ── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editing ? "Edit Product" : "New Product"} size="lg">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#0a0a0a]/50 mb-1">Product Name</label>
            <input value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm text-[#0a0a0a] focus:outline-none focus:border-[#b22222]/40 transition-colors" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0a0a0a]/50 mb-1">SKU (unique)</label>
              <input value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
                disabled={!!editing}
                className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm text-[#0a0a0a] disabled:opacity-50 focus:outline-none focus:border-[#b22222]/40 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0a0a0a]/50 mb-1">Category</label>
              <select value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm text-[#0a0a0a] bg-white focus:outline-none focus:border-[#b22222]/40 transition-colors">
                {allCats.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#0a0a0a]/50 mb-1">Price (GHS)</label>
              <input type="number" step="0.01" min={0} value={form.priceGhs}
                onChange={(e) => setForm({ ...form, priceGhs: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm text-[#0a0a0a] focus:outline-none focus:border-[#b22222]/40 transition-colors" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0a0a0a]/50 mb-1">Stock Level</label>
              <input type="number" min={0} value={form.stock_level}
                onChange={(e) => setForm({ ...form, stock_level: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm text-[#0a0a0a] focus:outline-none focus:border-[#b22222]/40 transition-colors" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0a0a0a]/50 mb-1">Description</label>
            <textarea rows={3} value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm text-[#0a0a0a] resize-none focus:outline-none focus:border-[#b22222]/40 transition-colors" />
          </div>

          <AdminImageUpload label="Product image" folder="products"
            value={form.image_url}
            onUrlChange={(url) => setForm({ ...form, image_url: url })} />

          <label className="flex items-center gap-2 text-sm text-[#0a0a0a]/70 cursor-pointer">
            <input type="checkbox" checked={form.is_available}
              onChange={(e) => setForm({ ...form, is_available: e.target.checked })} />
            Available on shop page
          </label>

          <div className="flex justify-end gap-2 pt-4 border-t border-black/[0.06]">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={save} loading={saving}>{editing ? "Save Changes" : "Create Product"}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
