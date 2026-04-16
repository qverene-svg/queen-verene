import { NextRequest, NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

/** Verify the caller is an admin */
async function requireAdmin(): Promise<{ ok: true } | NextResponse> {
  const userClient = await createClient();
  const { data: { user } } = await userClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const supabase = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any).from("users").select("role").eq("id", user.id).single();
  if (!profile || profile.role?.toLowerCase() !== "admin") {
    return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
  }
  return { ok: true };
}

// ── GET /api/admin/users ─────────────────────────────────────────────────────
// Returns all users from the users table

export async function GET() {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const supabase = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;
  const { data, error } = await db
    .from("users")
    .select("id, email, full_name, role, created_at, phone, portal_access")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ users: data });
}

// ── POST /api/admin/users ────────────────────────────────────────────────────
// Creates a new Supabase auth user + inserts into users table

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { email, password, full_name, role, phone, portal_access } = await req.json();

  if (!email || !password || !full_name || !role) {
    return NextResponse.json({ error: "email, password, full_name, and role are required" }, { status: 400 });
  }

  const ALLOWED = ["admin", "manager", "staff", "viewer"];
  if (!ALLOWED.includes(role.toLowerCase())) {
    return NextResponse.json({ error: `Role must be one of: ${ALLOWED.join(", ")}` }, { status: 400 });
  }

  const supabase = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Create Supabase Auth user
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skip verification email
  });

  if (authErr || !authData.user) {
    return NextResponse.json({ error: authErr?.message || "Could not create auth user" }, { status: 400 });
  }

  // Insert into users profile table
  // Note: portal_access requires the column: ALTER TABLE users ADD COLUMN portal_access TEXT[] DEFAULT NULL;
  const { error: dbErr } = await db.from("users").upsert({
    id:            authData.user.id,
    email,
    full_name,
    role:          role.toLowerCase(),
    phone:         phone || null,
    portal_access: portal_access || null,
    created_at:    new Date().toISOString(),
  });

  if (dbErr) {
    // Cleanup auth user if profile insert failed
    await supabase.auth.admin.deleteUser(authData.user.id).catch(() => null);
    return NextResponse.json({ error: `Profile insert failed: ${dbErr.message}` }, { status: 500 });
  }

  return NextResponse.json({ success: true, userId: authData.user.id });
}

// ── PATCH /api/admin/users ───────────────────────────────────────────────────
// Updates a user's role (and optionally name/phone)

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id, role, full_name, phone, portal_access } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const supabase = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  const updates: Record<string, unknown> = {};
  if (role)                     updates.role          = role.toLowerCase();
  if (full_name)                updates.full_name     = full_name;
  if (phone !== undefined)      updates.phone         = phone || null;
  // portal_access: null = use role defaults; [] = no portals; ["Services","Shop",...] = specific portals
  // Requires: ALTER TABLE users ADD COLUMN portal_access TEXT[] DEFAULT NULL;
  if (portal_access !== undefined) updates.portal_access = portal_access || null;

  const { error } = await db.from("users").update(updates).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// ── DELETE /api/admin/users ──────────────────────────────────────────────────
// Removes a user from auth + users table

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const supabase = await createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any;

  // Delete from profile table first (FK constraints)
  await db.from("users").delete().eq("id", id);
  // Delete from auth
  const { error } = await supabase.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
