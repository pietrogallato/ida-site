import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  accentColor?: "primary" | "secondary";
}

export function Card({ className, interactive, accentColor, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/70 bg-surface p-6 shadow-[0_2px_12px_rgba(0,0,0,0.05)]",
        interactive &&
          "transition-all duration-300 hover:shadow-[0_6px_20px_rgba(0,0,0,0.08)] motion-safe:hover:-translate-y-0.5",
        accentColor === "primary" && "border-l-[3px] border-l-primary",
        accentColor === "secondary" && "border-l-[3px] border-l-secondary",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
