import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function SectionHeader({
  eyebrow,
  title,
  description,
  moreMuc,
  moreLabel = "Xem tất cả",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  moreMuc?: string;
  moreLabel?: string;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.2em] text-gov">{eyebrow}</p>
        ) : null}
        <h2 className="text-2xl font-bold tracking-tight text-navy sm:text-[28px]">{title}</h2>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {moreMuc ? (
        <Link
          to="/trang-thong-tin"
          search={{ muc: moreMuc }}
          className="group inline-flex items-center gap-1.5 text-sm font-semibold text-gov transition-colors hover:text-navy"
        >
          {moreLabel}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      ) : null}
    </div>
  );
}

export function Pill({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
        className ?? "bg-gov/10 text-gov",
      )}
    >
      {children}
    </span>
  );
}
