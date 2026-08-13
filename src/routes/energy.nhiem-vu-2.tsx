import { createFileRoute } from "@tanstack/react-router";
import { Factory } from "lucide-react";
import { TaskPlaceholder } from "@/components/energy/TaskPlaceholder";

export const Route = createFileRoute("/energy/nhiem-vu-2")({
  head: () => ({ meta: [{ title: "Nhiệm vụ 2 | Năng lượng" }] }),
  component: Page,
});

function Page() {
  return <TaskPlaceholder taskId={2} icon={Factory} />;
}
