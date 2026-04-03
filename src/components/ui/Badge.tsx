import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "crimson" | "gold" | "green" | "gray";

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-black/5 text-[#0a0a0a]",
  crimson: "bg-[#b22222]/10 text-[#b22222]",
  gold: "bg-[#d4af37]/15 text-[#b8960c]",
  green: "bg-green-50 text-green-700",
  gray: "bg-gray-100 text-gray-600",
};

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
