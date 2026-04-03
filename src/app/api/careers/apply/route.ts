import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const job_id = formData.get("job_id") as string;
    const applicant_name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const portfolio_url = (formData.get("portfolio_url") as string) || null;
    const cvFile = formData.get("cv") as File | null;

    if (!job_id || !applicant_name || !email || !phone) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = await createAdminClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    let cv_url: string | null = null;

    // Upload CV to Supabase Storage
    if (cvFile && cvFile.size > 0) {
      const bytes = await cvFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const fileName = `cv-${Date.now()}-${cvFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("applications")
        .upload(fileName, buffer, { contentType: cvFile.type });
      if (!uploadError && uploadData) {
        const { data: { publicUrl } } = supabase.storage.from("applications").getPublicUrl(fileName);
        cv_url = publicUrl;
      }
    }

    const { error } = await db.from("applications").insert({
      id: crypto.randomUUID(),
      job_id,
      applicant_name,
      email,
      phone,
      cv_url,
      portfolio_url,
      status: "new",
    });

    if (error) throw error;

    // Notify admin via email
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey && resendKey !== "your_resend_api_key") {
      const { Resend } = await import("resend");
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || "hello@verene.com",
        to: process.env.RESEND_FROM_EMAIL || "hello@verene.com",
        subject: `New Job Application: ${applicant_name}`,
        html: `<p>New application from <strong>${applicant_name}</strong> (${email}) for job ID ${job_id}.</p>`,
      }).catch(console.error);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[Careers API]", err);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
