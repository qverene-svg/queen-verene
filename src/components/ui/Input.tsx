"use client";
import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold tracking-widest uppercase text-[#0a0a0a]/60 mb-2"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            "w-full bg-transparent border-b border-[#0a0a0a]/20 py-3 px-0 text-[#0a0a0a] placeholder:text-[#0a0a0a]/30",
            "font-[Montserrat] text-sm transition-all duration-300",
            "focus:outline-none focus:border-[#d4af37]",
            error && "border-[#b22222]",
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-[#b22222]">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold tracking-widest uppercase text-[#0a0a0a]/60 mb-2"
          >
            {label}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          rows={4}
          className={cn(
            "w-full bg-transparent border-b border-[#0a0a0a]/20 py-3 px-0 text-[#0a0a0a] placeholder:text-[#0a0a0a]/30 resize-none",
            "font-[Montserrat] text-sm transition-all duration-300",
            "focus:outline-none focus:border-[#d4af37]",
            error && "border-[#b22222]",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-[#b22222]">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

export { Input, Textarea };
