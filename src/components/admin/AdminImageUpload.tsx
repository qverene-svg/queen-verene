"use client";
import { useState } from "react";
import { uploadAdminImage } from "@/lib/admin/uploadImage";
import toast from "react-hot-toast";

type Folder = "services" | "products";

export function AdminImageUpload({
  label,
  folder,
  value,
  onUrlChange,
  urlPlaceholder = "https://…",
}: {
  label: string;
  folder: Folder;
  value: string;
  onUrlChange: (url: string) => void;
  urlPlaceholder?: string;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <div>
      <label className="block text-xs font-semibold text-[#0a0a0a]/50 mb-1">{label}</label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="file"
          accept="image/*"
          disabled={busy}
          className="text-xs text-[#0a0a0a]/70 file:mr-2 file:rounded-lg file:border-0 file:bg-black/[0.06] file:px-3 file:py-2 file:text-xs file:font-semibold"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            setBusy(true);
            try {
              const url = await uploadAdminImage(file, folder);
              onUrlChange(url);
              toast.success("Image uploaded.");
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Upload failed");
            } finally {
              setBusy(false);
            }
          }}
        />
        {busy && <span className="text-[10px] text-[#0a0a0a]/40">Uploading…</span>}
      </div>
      <p className="text-[10px] text-[#0a0a0a]/35 mt-1 mb-2">Or paste a URL below.</p>
      <input
        value={value}
        onChange={(e) => onUrlChange(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl border border-black/10 text-sm"
        placeholder={urlPlaceholder}
      />
      {value.trim() && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={value.trim()}
          alt=""
          className="mt-3 h-24 w-24 object-cover rounded-xl border border-black/10"
        />
      )}
    </div>
  );
}
