import { createFileRoute } from "@tanstack/react-router";
import { Cloud } from "lucide-react";
import { TaskPlaceholder } from "@/components/energy/TaskPlaceholder";

export const Route = createFileRoute("/energy/nhiem-vu-6")({
  head: () => ({ meta: [{ title: "Nhiệm vụ 6 | Năng lượng" }] }),
  component: Page,
});

function Page() {
  return <TaskPlaceholder taskId={6} icon={Cloud} />;
}
