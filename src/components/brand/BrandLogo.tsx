"use client";
import Image from "next/image";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/brand/queen-verene-logo.png";

export function BrandLogo({
  className,
  size = 44,
  withWordmark = true,
  wordmarkClassName,
}: {
  className?: string;
  size?: number;
  withWordmark?: boolean;
  wordmarkClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 shrink-0", className)}>
      <Image
        src={LOGO_SRC}
        alt="Queen Verene"
        width={size}
        height={size}
        className="object-contain shrink-0"
        style={{ width: size, height: size }}
        priority
      />
      {withWordmark && (
        <span className="flex flex-col items-start leading-none gap-[3px]">
          {/* "Queen" — italic, gold, with ornamental dashes */}
          <span className="flex items-center gap-1.5">
            <span className="block h-px w-4 bg-[#d4af37] opacity-70" />
            <span
              className="font-[Playfair_Display] italic font-normal text-[8.5px] tracking-[0.42em] uppercase"
              style={{ color: "#d4af37" }}
            >
              Queen
            </span>
            <span className="block h-px w-4 bg-[#d4af37] opacity-70" />
          </span>
          {/* "VERENE" — bold, respects wordmarkClassName for color */}
          <span
            className={cn(
              "font-[Playfair_Display] font-bold tracking-[0.24em] text-[15px] uppercase",
              wordmarkClassName ?? "text-white"
            )}
          >
            VERENE
          </span>
        </span>
      )}
    </span>
  );
}
