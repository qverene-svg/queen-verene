import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover = false }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl shadow-sm border border-black/5 overflow-hidden",
        hover && "transition-all duration-300 hover:-translate-y-1 hover:shadow-lg",
        className
      )}
    >
      {children}
    </div>
  );
}

export function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: React.ElementType;
  trend?: { value: number; up: boolean };
}) {
  return (
    <Card className="p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold tracking-widest uppercase text-[#0a0a0a]/50 mb-1">{label}</p>
          <p className="text-3xl font-[Playfair_Display] text-[#0a0a0a]">{value}</p>
          {sub && <p className="text-xs text-[#0a0a0a]/40 mt-1">{sub}</p>}
        </div>
        <div className="flex flex-col items-end gap-2">
          {Icon && (
            <div className="p-3 bg-[#b22222]/10 rounded-xl">
              <Icon size={20} className="text-[#b22222]" />
            </div>
          )}
          {trend && (
            <span
              className={cn(
                "text-xs font-semibold px-2 py-1 rounded-full",
                trend.up ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
              )}
            >
              {trend.up ? "+" : "-"}{Math.abs(trend.value)}%
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
