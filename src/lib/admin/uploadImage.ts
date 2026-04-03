export async function uploadAdminImage(file: File, folder: "services" | "products") {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("folder", folder);
  const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  const j = (await res.json()) as { error?: string; url?: string };
  if (!res.ok) throw new Error(j.error || "Upload failed");
  if (!j.url) throw new Error("No URL returned");
  return j.url;
}
