import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { CLUSTERS } from "@/data/mock";
import { INDUSTRIES } from "@/lib/constants";
import type { Cluster } from "@/lib/types";

export function clusterMatches(c: Cluster, industry: string): boolean {
  const tokens = c.sectors
    .split(/[–\-/]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return tokens.some((t) => t === industry || t.includes(industry) || industry.includes(t));
}

export function clusterHasIndustry(c: Cluster, industry: string): boolean {
  return clusterMatches(c, industry);
}

export function clusterCountByIndustry(industry: string): number {
  return CLUSTERS.filter((c) => clusterHasIndustry(c, industry)).length;
}

interface GisLayerValue {
  selectedIndustries: string[];
  toggleIndustry: (industry: string) => void;
  setSelectedIndustries: (industries: string[]) => void;
  selectedClusterIds: string[];
  toggleCluster: (clusterId: string) => void;
  setSelectedClusterIds: (clusterIds: string[]) => void;
}

const GisLayerContext = createContext<GisLayerValue | null>(null);

export function GisLayerProvider({ children }: { children: ReactNode }) {
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>(INDUSTRIES);
  const [selectedClusterIds, setSelectedClusterIds] = useState<string[]>(() =>
    CLUSTERS.map((c) => c.id),
  );

  const toggleIndustry = (industry: string) =>
    setSelectedIndustries((prev) =>
      prev.includes(industry) ? prev.filter((i) => i !== industry) : [...prev, industry],
    );

  const toggleCluster = (clusterId: string) =>
    setSelectedClusterIds((prev) =>
      prev.includes(clusterId) ? prev.filter((i) => i !== clusterId) : [...prev, clusterId],
    );

  const value = useMemo<GisLayerValue>(
    () => ({
      selectedIndustries,
      toggleIndustry,
      setSelectedIndustries,
      selectedClusterIds,
      toggleCluster,
      setSelectedClusterIds,
    }),
    [selectedIndustries, selectedClusterIds],
  );

  return <GisLayerContext.Provider value={value}>{children}</GisLayerContext.Provider>;
}

export function useGisLayer() {
  const ctx = useContext(GisLayerContext);
  if (!ctx) throw new Error("useGisLayer must be used within GisLayerProvider");
  return ctx;
}
