import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";

export interface Crumb {
  label: string;
  to?: string;
}

export function PageHeader({
  title,
  description,
  crumbs = [],
  actions,
}: {
  title: string;
  description?: string | undefined;
  crumbs?: Crumb[];
  actions?: ReactNode;
}) {
  return (
    <div className="border-b border-border bg-card px-6 py-4">
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Link to="/" className="flex items-center gap-1 hover:text-gov">
          <Home className="size-3.5" />
          Trang chủ
        </Link>
        {crumbs.map((c) => (
          <span key={c.label} className="flex items-center gap-1.5">
            <ChevronRight className="size-3.5" />
            {c.to ? (
              <Link to={c.to} className="hover:text-gov">
                {c.label}
              </Link>
            ) : (
              <span className="text-foreground">{c.label}</span>
            )}
          </span>
        ))}
      </nav>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-navy uppercase">{title}</h1>
          {description ? (
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
