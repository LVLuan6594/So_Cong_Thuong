import { createFileRoute } from "@tanstack/react-router";
import { Sun } from "lucide-react";
import { TaskPlaceholder } from "@/components/energy/TaskPlaceholder";

export const Route = createFileRoute("/energy/nhiem-vu-3")({
  head: () => ({ meta: [{ title: "Nhiệm vụ 3 | Năng lượng" }] }),
  component: Page,
});

function Page() {
  return <TaskPlaceholder taskId={3} icon={Sun} />;
}
