import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level: HeadingLevel;
}

const levelStyles: Record<HeadingLevel, string> = {
  1: "text-4xl sm:text-5xl font-bold tracking-tight",
  2: "text-3xl sm:text-4xl font-bold tracking-tight",
  3: "text-2xl sm:text-3xl font-semibold",
  4: "text-xl sm:text-2xl font-semibold",
  5: "text-lg sm:text-xl font-medium",
  6: "text-base sm:text-lg font-medium",
};

export function Heading({ level, className, children, ...props }: HeadingProps) {
  const Tag = `h${level}` as const;

  return (
    <Tag
      className={cn(levelStyles[level], "text-foreground", className)}
      {...props}
    >
      {children}
    </Tag>
  );
}
