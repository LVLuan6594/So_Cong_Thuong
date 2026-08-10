import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronLeft, Landmark } from "lucide-react";
import { NAV_GROUPS } from "@/lib/nav";
import { useRole } from "@/lib/role-context";
import { cn } from "@/lib/utils";

export function AppSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const { navItems, role } = useRole();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r border-border bg-navy text-navy-foreground lg:flex",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex h-14 items-center gap-2 border-b border-white/10 px-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-white/10">
          <Landmark className="size-4.5" strokeWidth={1.8} />
        </span>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-wide">Phân hệ hệ thống</p>
            <p className="truncate text-[11px] text-white/60">{role.name}</p>
          </div>
        ) : null}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {NAV_GROUPS.map((group) => {
          const items = navItems.filter((i) => i.group === group);
          if (!items.length) return null;
          return (
            <div key={group} className="mb-4">
              {!collapsed ? (
                <p className="mb-1.5 px-2 text-[10px] font-bold tracking-widest text-white/45">
                  {group}
                </p>
              ) : (
                <div className="mx-2 mb-2 border-t border-white/10" />
              )}
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const activeItem =
                    item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        title={item.label}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-2 py-2 text-sm transition-colors",
                          activeItem
                            ? "bg-white/15 font-medium text-white"
                            : "text-white/75 hover:bg-white/10 hover:text-white",
                        )}
                      >
                        <item.icon className="size-4.5 shrink-0" strokeWidth={1.7} />
                        {!collapsed ? (
                          <span className="truncate">
                            <span className="mr-1.5 text-[11px] tabular-nums text-white/45">
                              {item.code}
                            </span>
                            {item.label}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      <button
        onClick={onToggle}
        className="flex items-center gap-2 border-t border-white/10 px-3 py-2.5 text-xs text-white/70 hover:bg-white/10 hover:text-white"
      >
        <ChevronLeft className={cn("size-4 transition-transform", collapsed && "rotate-180")} />
        {!collapsed ? "Thu gọn menu" : null}
      </button>
    </aside>
  );
}
