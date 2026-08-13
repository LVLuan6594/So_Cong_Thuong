import { createFileRoute } from "@tanstack/react-router";
import { Lightbulb } from "lucide-react";
import { TaskPlaceholder } from "@/components/energy/TaskPlaceholder";

export const Route = createFileRoute("/energy/nhiem-vu-4")({
  head: () => ({ meta: [{ title: "Nhiệm vụ 4 | Năng lượng" }] }),
  component: Page,
});

function Page() {
  return <TaskPlaceholder taskId={4} icon={Lightbulb} />;
}
