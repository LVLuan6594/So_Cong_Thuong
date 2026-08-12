import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatCard, type Tone } from "@/components/common/StatCard";
import { Button } from "@/components/ui/button";
import {
  EnergyEmpty,
  EnergyError,
  EnergyLoading,
  EntityDetailDrawer,
} from "@/components/energy/EnergyShared";

export interface EnergyKpiDef {
  label: string;
  value: string | number;
  delta?: string;
  tone?: Tone;
  icon?: LucideIcon;
}

export function EnergyCollectionPage<T extends { id: string }>({
  title,
  description,
  icon,
  queryKey,
  queryFn,
  columns,
  searchPlaceholder,
  kpis,
  drawerTitle,
  renderDetail,
  children,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  queryKey: unknown[];
  queryFn: () => Promise<T[]>;
  columns: Column<T>[];
  searchPlaceholder: string;
  kpis?: (rows: T[]) => EnergyKpiDef[];
  drawerTitle: string;
  renderDetail: (row: T) => ReactNode;
  children?: ReactNode;
}) {
  const [selected, setSelected] = useState<T | null>(null);
  const query = useQuery({ queryKey, queryFn });

  if (query.isLoading) return <EnergyLoading />;
  if (query.isError) return <EnergyError onRetry={() => void query.refetch()} />;

  const rows = query.data ?? [];
  const stats = kpis?.(rows) ?? [];

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        crumbs={[{ label: "Điều tra & Năng lượng", to: "/energy" }, { label: title }]}
        variant="panel"
        icon={icon}
        actions={
          <Button variant="outline" size="sm">
            <Download className="size-4" /> Export
          </Button>
        }
      />
      <div className="space-y-4 p-6">
        {stats.length ? (
          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {stats.map((item) => (
              <StatCard
                key={item.label}
                label={item.label}
                value={item.value}
                delta={item.delta}
                tone={item.tone}
                icon={item.icon}
              />
            ))}
          </section>
        ) : null}
        {children}
        {rows.length ? (
          <DataTable
            columns={columns}
            rows={rows}
            searchPlaceholder={searchPlaceholder}
            onRowClick={setSelected}
          />
        ) : (
          <EnergyEmpty />
        )}
      </div>
      <EntityDetailDrawer
        open={!!selected}
        onOpenChange={(value) => !value && setSelected(null)}
        title={drawerTitle}
        description={selected ? ("name" in selected ? String(selected.name) : selected.id) : undefined}
      >
        {selected ? renderDetail(selected) : null}
      </EntityDetailDrawer>
    </>
  );
}
