import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  FileScan,
  GitCompareArrows,
  ScanText,
  ShieldAlert,
  UploadCloud,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { ChartCard } from "@/components/common/ChartCard";
import { DataLifecycle } from "@/components/common/DataLifecycle";
import { DataTable, type Column } from "@/components/common/DataTable";
import { StatusBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MASTER_RECORDS, OCR_EXTRACTION, QUALITY_ISSUES } from "@/data/mock";
import type { MasterRecord, QualityIssue } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/data-management")({
  head: () => ({
    meta: [
      { title: "Quản trị dữ liệu & số hóa OCR/AI" },
      {
        name: "description",
        content:
          "Số hóa hồ sơ bằng OCR/AI, chuẩn hóa master data, kiểm tra chất lượng dữ liệu và đối soát trước khi trình phê duyệt.",
      },
      { property: "og:title", content: "Quản trị dữ liệu & số hóa OCR/AI" },
      {
        property: "og:description",
        content: "Số hóa, chuẩn hóa và kiểm soát chất lượng dữ liệu ngành Công Thương.",
      },
    ],
  }),
  component: DataManagement;
});

function DataManagement() {
  return null;
}
