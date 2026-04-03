"use client";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold tracking-wider uppercase text-sm transition-all duration-300 ease-in-out focus-visible:outline-none disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-[#b22222] text-white hover:bg-[#cc2929] hover:-translate-y-0.5 shadow-md hover:shadow-lg",
        secondary: "bg-transparent border border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-[#0a0a0a]",
        outline: "bg-transparent border border-[#0a0a0a] text-[#0a0a0a] hover:bg-[#0a0a0a] hover:text-white",
        ghost: "bg-transparent text-[#0a0a0a] hover:bg-black/5",
        dark: "bg-[#0a0a0a] text-white hover:bg-[#1a1a1a] hover:-translate-y-0.5",
      },
      size: {
        sm: "px-4 py-2 text-xs rounded-lg",
        md: "px-6 py-3 rounded-xl",
        lg: "px-8 py-4 text-base rounded-xl",
        xl: "px-10 py-5 text-lg rounded-2xl",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
);
Button.displayName = "Button";
export { Button, buttonVariants };
