import { useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { AppHeader } from "./AppHeader";
import { AppSidebar } from "./AppSidebar";
import { NAV_GROUPS } from "@/lib/nav";
import { useRole } from "@/lib/role-context";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { navItems } = useRole();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="min-h-screen bg-background">
      <AppHeader onMenu={() => setMobileOpen(true)} />
      <div className="flex min-h-[calc(100vh-3.5rem)]">
        <AppSidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-72 bg-navy p-0 text-navy-foreground">
          <nav className="overflow-y-auto px-3 py-12">
            {NAV_GROUPS.map((group) => {
              const items = navItems.filter((i) => i.group === group);
              if (!items.length) return null;
              return (
                <div key={group} className="mb-4">
                  <p className="mb-1.5 text-[10px] font-bold tracking-widest text-white/45">
                    {group}
                  </p>
                  <ul className="space-y-0.5">
                    {items.map((item) => (
                      <li key={item.to}>
                        <Link
                          to={item.to}
                          onClick={() => setMobileOpen(false)}
                          className={cn(
                            "flex items-center gap-2.5 rounded-md px-2 py-2 text-sm",
                            pathname === item.to
                              ? "bg-white/15 font-medium text-white"
                              : "text-white/75",
                          )}
                        >
                          <item.icon className="size-4.5" strokeWidth={1.7} />
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
