"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus, Pencil, Trash2, Check, X, Shield, Eye,
  RefreshCw, Mail, Phone, User, Layout,
} from "lucide-react";
import toast from "react-hot-toast";

interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  phone: string | null;
  created_at: string;
  portal_access: string[] | null;
}

const ROLES = ["admin", "manager", "staff", "viewer"] as const;
type Role = (typeof ROLES)[number];

// All navigable sections in the admin panel
const ALL_PORTALS = [
  "Overview",
  "Services",
  "Shop",
  "Careers",
  "New Booking",
  "Walk-in Pay",
  "Users",
] as const;
type Portal = (typeof ALL_PORTALS)[number];

const ROLE_META: Record<Role, { color: string; bg: string; border: string; label: string; desc: string }> = {
  admin:   { color: "#f87171", bg: "rgba(248,113,113,0.1)",  border: "rgba(248,113,113,0.3)",  label: "Admin",   desc: "Full access to all panels and settings" },
  manager: { color: "#d4af37", bg: "rgba(212,175,55,0.1)",   border: "rgba(212,175,55,0.3)",   label: "Manager", desc: "Access to bookings, services, shop, careers" },
  staff:   { color: "#60a5fa", bg: "rgba(96,165,250,0.1)",   border: "rgba(96,165,250,0.3)",   label: "Staff",   desc: "View-only access to bookings & overview" },
  viewer:  { color: "#a3a3a3", bg: "rgba(163,163,163,0.08)", border: "rgba(163,163,163,0.2)",  label: "Viewer",  desc: "Read-only access, no edit or delete" },
};

function RolePill({ role }: { role: string }) {
  const r = role as Role;
  const m = ROLE_META[r] ?? { color: "#aaa", bg: "rgba(255,255,255,0.06)", border: "rgba(255,255,255,0.1)", label: role };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: m.bg, color: m.color, border: `1px solid ${m.border}`,
      borderRadius: 999, padding: "3px 10px", fontSize: 10, fontWeight: 700,
      textTransform: "uppercase", letterSpacing: "0.08em",
    }}>
      <Shield size={9} />
      {m.label}
    </span>
  );
}

/** Compact portal tags shown in the user table when not editing */
function PortalTags({ portals }: { portals: string[] | null }) {
  if (!portals || portals.length === 0) {
    return <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>all portals (role default)</span>;
  }
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
      {portals.map((p) => (
        <span key={p} style={{
          fontSize: 9, fontWeight: 600, letterSpacing: "0.05em",
          background: "rgba(212,175,55,0.1)", color: "#d4af37",
          border: "1px solid rgba(212,175,55,0.25)", borderRadius: 6,
          padding: "2px 7px",
        }}>{p}</span>
      ))}
    </div>
  );
}

/** Portal checkbox grid — always visible, no toggle */
function PortalCheckboxes({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (portal: Portal) => {
    const next = selected.includes(portal)
      ? selected.filter((p) => p !== portal)
      : [...selected, portal];
    onChange(next);
  };

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
      gap: 8,
    }}>
      {ALL_PORTALS.map((portal) => {
        const checked = selected.includes(portal);
        return (
          <label
            key={portal}
            style={{
              display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
              padding: "7px 10px", borderRadius: 8,
              background: checked ? "rgba(212,175,55,0.1)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${checked ? "rgba(212,175,55,0.3)" : "rgba(255,255,255,0.07)"}`,
              transition: "all 0.15s",
            }}
          >
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggle(portal)}
              style={{ accentColor: "#d4af37", width: 13, height: 13, flexShrink: 0 }}
            />
            <span style={{ fontSize: 11, color: checked ? "#d4af37" : "rgba(255,255,255,0.45)", fontWeight: checked ? 700 : 400 }}>
              {portal}
            </span>
          </label>
        );
      })}
    </div>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 14px", borderRadius: 10,
  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)",
  color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box",
};

/** Role select always uses white background + black text for legibility */
const roleSelectStyle: React.CSSProperties = {
  padding: "9px 12px", borderRadius: 10,
  background: "#ffffff", border: "1px solid rgba(0,0,0,0.15)",
  color: "#0a0a0a", fontSize: 13, outline: "none", cursor: "pointer",
  fontWeight: 600,
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 10, fontWeight: 700, letterSpacing: "0.2em",
  textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 6,
};

// ── Main component ────────────────────────────────────────────────────────────

export function AdminUsersPanel() {
  const [users,    setUsers]    = useState<AdminUser[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [showAdd,  setShowAdd]  = useState(false);
  const [editId,   setEditId]   = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving,   setSaving]   = useState<string | null>(null);
  const [adding,   setAdding]   = useState(false);

  // Add-user form state
  const [form, setForm] = useState({
    email: "", password: "", full_name: "", role: "staff" as Role,
    phone: "", portal_access: [] as string[],
  });

  // Edit state — indexed by user id
  const [editRole,   setEditRole]   = useState<Record<string, Role>>({});
  const [editPortal, setEditPortal] = useState<Record<string, string[]>>({});

  // ── Data loading ────────────────────────────────────────────────────────────

  const load = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    if (!res.ok) { toast.error("Could not load users"); setLoading(false); return; }
    const { users: data } = await res.json();
    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // ── Add user ────────────────────────────────────────────────────────────────

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.full_name) {
      toast.error("Name, email and password are required");
      return;
    }
    setAdding(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        portal_access: form.portal_access.length > 0 ? form.portal_access : null,
      }),
    });
    const json = await res.json();
    if (!res.ok) { toast.error(json.error || "Failed to create user"); setAdding(false); return; }
    toast.success(`${form.full_name} added as ${form.role}`);
    setForm({ email: "", password: "", full_name: "", role: "staff", phone: "", portal_access: [] });
    setShowAdd(false);
    setAdding(false);
    load();
  };

  // ── Edit user ───────────────────────────────────────────────────────────────

  const startEdit = (u: AdminUser) => {
    setEditId(u.id);
    setEditRole((r) => ({ ...r, [u.id]: u.role as Role }));
    setEditPortal((p) => ({ ...p, [u.id]: u.portal_access ?? [] }));
  };

  const cancelEdit = (userId: string) => {
    setEditId(null);
    setEditRole((r)  => { const c = { ...r }; delete c[userId]; return c; });
    setEditPortal((p) => { const c = { ...p }; delete c[userId]; return c; });
  };

  const handleSave = async (userId: string) => {
    const newRole   = editRole[userId];
    const portals   = editPortal[userId] ?? [];
    if (!newRole) return;
    setSaving(userId);
    const res = await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id:            userId,
        role:          newRole,
        portal_access: portals.length > 0 ? portals : null,
      }),
    });
    const json = await res.json();
    if (!res.ok) { toast.error(json.error || "Update failed"); setSaving(null); return; }
    toast.success("User updated");
    setUsers((u) => u.map((x) => x.id === userId
      ? { ...x, role: newRole, portal_access: portals.length > 0 ? portals : null }
      : x
    ));
    setEditId(null);
    setSaving(null);
  };

  // ── Delete user ─────────────────────────────────────────────────────────────

  const handleDelete = async (userId: string) => {
    const res = await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: userId }),
    });
    const json = await res.json();
    if (!res.ok) { toast.error(json.error || "Delete failed"); return; }
    toast.success("User removed");
    setUsers((u) => u.filter((x) => x.id !== userId));
    setDeleteId(null);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "#b22222", marginBottom: 4 }}>Admin Panel</p>
          <h1 style={{ fontFamily: "var(--font-playfair),'Playfair Display',serif", fontSize: 28, color: "#fff", margin: 0 }}>User Management</h1>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 6 }}>
            Set each user&apos;s role and the specific admin portals they can access.
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={load} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)", fontSize: 12, cursor: "pointer" }}>
            <RefreshCw size={13} /> Refresh
          </button>
          <button onClick={() => setShowAdd(!showAdd)}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 18px", borderRadius: 10, background: "#b22222", border: "none", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            <UserPlus size={14} /> Add User
          </button>
        </div>
      </div>

      {/* Role legend */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {ROLES.map((r) => (
          <div key={r} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 10, background: "#18181b", border: "1px solid rgba(255,255,255,0.06)" }}>
            <RolePill role={r} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{ROLE_META[r].desc}</span>
          </div>
        ))}
      </div>

      {/* ── Add user form ── */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: "hidden" }}
          >
            <div style={{ background: "#18181b", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 16, padding: "24px 28px" }}>
              <h3 style={{ color: "#d4af37", fontSize: 14, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20 }}>
                New User
              </h3>
              <form onSubmit={handleAdd} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                {/* Basic info grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 16 }}>
                  <div>
                    <label style={labelStyle}>Full Name *</label>
                    <input required value={form.full_name}
                      onChange={(e) => setForm(f => ({ ...f, full_name: e.target.value }))}
                      placeholder="Jane Mensah" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Email *</label>
                    <input required type="email" value={form.email}
                      onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="jane@verene.com" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Password *</label>
                    <input required type="password" value={form.password}
                      onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Min 8 characters" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Phone</label>
                    <input type="tel" value={form.phone}
                      onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="0244 000 000" style={inputStyle} />
                  </div>
                </div>

                {/* Role */}
                <div>
                  <label style={labelStyle}>Role *</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm(f => ({ ...f, role: e.target.value as Role }))}
                    style={roleSelectStyle}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r} style={{ color: "#0a0a0a" }}>
                        {ROLE_META[r].label} — {ROLE_META[r].desc}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Portal access — always open */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <Layout size={13} style={{ color: "#d4af37" }} />
                    <label style={{ ...labelStyle, margin: 0 }}>Portal Access</label>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginLeft: 4 }}>
                      — tick which sections this user can see
                    </span>
                  </div>
                  <PortalCheckboxes
                    selected={form.portal_access}
                    onChange={(v) => setForm(f => ({ ...f, portal_access: v }))}
                  />
                  {form.portal_access.length === 0 && (
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 10, fontStyle: "italic" }}>
                      No portals selected — user will have no admin access until portals are assigned.
                    </p>
                  )}
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button type="submit" disabled={adding}
                    style={{ padding: "10px 24px", borderRadius: 10, background: adding ? "rgba(178,34,34,0.5)" : "#b22222", border: "none", color: "#fff", fontSize: 13, fontWeight: 700, cursor: adding ? "not-allowed" : "pointer" }}>
                    {adding ? "Creating…" : "Create User"}
                  </button>
                  <button type="button" onClick={() => setShowAdd(false)}
                    style={{ padding: "10px 20px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer" }}>
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Users list ── */}
      <div style={{ background: "#18181b", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden" }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>
            {loading ? "Loading…" : `${users.length} user${users.length !== 1 ? "s" : ""}`}
          </p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>Only admins can add or remove users</p>
        </div>

        <div>
          {!loading && users.map((u, i) => {
            const isEditing  = editId  === u.id;
            const isDeleting = deleteId === u.id;
            return (
              <motion.div
                key={u.id}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  background: isEditing ? "rgba(212,175,55,0.04)" : isDeleting ? "rgba(248,113,113,0.05)" : "transparent",
                  padding: "16px 24px",
                  display: "flex", flexDirection: "column", gap: 10,
                }}
              >
                {/* Top row: avatar + info + action buttons */}
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg,#b22222,#8b1a1a)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                    {u.full_name?.slice(0, 2).toUpperCase() || "??"}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 600, color: "#fff", fontSize: 13, marginBottom: 3 }}>{u.full_name || "—"}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                        <Mail size={10} /> {u.email}
                      </span>
                      {u.phone && (
                        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>
                          <Phone size={10} /> {u.phone}
                        </span>
                      )}
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.22)" }}>
                        Joined {u.created_at ? new Date(u.created_at).toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                      </span>
                    </div>
                  </div>

                  {/* Role pill (non-edit) */}
                  {!isEditing && !isDeleting && <RolePill role={u.role} />}

                  {/* Action buttons */}
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    {isDeleting ? (
                      <>
                        <span style={{ fontSize: 11, color: "#f87171", marginRight: 4 }}>Remove user?</span>
                        <button onClick={() => handleDelete(u.id)}
                          style={{ padding: "4px 12px", borderRadius: 7, background: "#b22222", border: "none", color: "#fff", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
                          Yes
                        </button>
                        <button onClick={() => setDeleteId(null)}
                          style={{ padding: "4px 10px", borderRadius: 7, background: "rgba(255,255,255,0.07)", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 11, cursor: "pointer" }}>
                          No
                        </button>
                      </>
                    ) : isEditing ? (
                      <>
                        <button onClick={() => handleSave(u.id)} disabled={saving === u.id}
                          style={{ width: 30, height: 30, borderRadius: 7, background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)", color: "#34d399", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                          {saving === u.id ? <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Check size={13} />}
                        </button>
                        <button onClick={() => cancelEdit(u.id)}
                          style={{ width: 30, height: 30, borderRadius: 7, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                          <X size={13} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(u)} title="Edit role & portals"
                          style={{ width: 30, height: 30, borderRadius: 7, background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)", color: "#d4af37", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                          <Pencil size={12} />
                        </button>
                        <button onClick={() => setDeleteId(u.id)} title="Remove user"
                          style={{ width: 30, height: 30, borderRadius: 7, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.18)", color: "#f87171", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* ── Inline edit form ── */}
                {isEditing && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    style={{ overflow: "hidden", paddingLeft: 50, display: "flex", flexDirection: "column", gap: 16, paddingTop: 4 }}
                  >
                    {/* Role */}
                    <div>
                      <label style={labelStyle}>Role</label>
                      <select
                        value={editRole[u.id] || u.role}
                        onChange={(e) => setEditRole((r) => ({ ...r, [u.id]: e.target.value as Role }))}
                        style={roleSelectStyle}
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r} style={{ color: "#0a0a0a" }}>
                            {ROLE_META[r].label} — {ROLE_META[r].desc}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Portal access — always open */}
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <Layout size={12} style={{ color: "#d4af37" }} />
                        <label style={{ ...labelStyle, margin: 0 }}>Portal Access</label>
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginLeft: 4 }}>
                          — tick which sections this user can see
                        </span>
                      </div>
                      <PortalCheckboxes
                        selected={editPortal[u.id] ?? []}
                        onChange={(v) => setEditPortal((p) => ({ ...p, [u.id]: v }))}
                      />
                      {(editPortal[u.id]?.length ?? 0) === 0 && (
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 10, fontStyle: "italic" }}>
                          No portals selected — user will see an empty admin panel.
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Portal tags — shown when not editing */}
                {!isEditing && !isDeleting && (
                  <div style={{ paddingLeft: 50, display: "flex", alignItems: "center", gap: 8 }}>
                    <Eye size={11} style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
                    <PortalTags portals={u.portal_access} />
                  </div>
                )}
              </motion.div>
            );
          })}

          {!loading && users.length === 0 && (
            <div style={{ padding: "48px 24px", textAlign: "center", color: "rgba(255,255,255,0.2)", fontSize: 13 }}>
              <User size={28} style={{ margin: "0 auto 10px", opacity: 0.3, display: "block" }} />
              No users found
            </div>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
