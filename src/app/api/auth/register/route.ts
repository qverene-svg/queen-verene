import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { normalizeAuthEmail } from "@/lib/auth/normalizeEmail";

/**
 * POST /api/auth/register
 * Creates a new customer account (no password required).
 * Returns a magic-link token so the client can sign in immediately.
 */
export async function POST(req: NextRequest) {
  try {
    const { full_name, email, phone } = await req.json();

    if (!full_name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: "Full name and email are required." }, { status: 400 });
    }

    const supabase = await createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    const normalizedEmail = normalizeAuthEmail(email.trim());

    // Check for existing account
    const { data: existing } = await db
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in instead." },
        { status: 409 }
      );
    }

    // Create auth user — email_confirm: true skips the confirmation step
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      email_confirm: true,
      user_metadata: { full_name: full_name.trim(), phone: phone?.trim() || null },
    });

    if (authError) {
      console.error("[Register] Auth error:", authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    // Insert public user profile
    const { error: insertError } = await db.from("users").insert({
      id:        authData.user.id,
      full_name: full_name.trim(),
      email:     normalizedEmail,
      phone:     phone?.trim() || null,
      role:      "customer",
    });

    if (insertError) {
      // Roll back auth user if profile insert fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      console.error("[Register] Profile insert error:", insertError);
      return NextResponse.json(
        { error: `Account creation failed: ${insertError.message}` },
        { status: 500 }
      );
    }

    // Generate a magic-link token for immediate sign-in — no email check required
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type:  "magiclink",
      email: normalizedEmail,
    });

    if (linkError || !linkData?.properties?.hashed_token) {
      // Account created OK; tell the client to sign in via OTP instead
      console.warn("[Register] generateLink failed:", linkError);
      return NextResponse.json({
        success: true,
        autoLogin: false,
        message: "Account created! Please sign in with your email.",
      });
    }

    return NextResponse.json({
      success:    true,
      autoLogin:  true,
      email:      normalizedEmail,
      token_hash: linkData.properties.hashed_token,
    });
  } catch (err) {
    console.error("[Register]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
