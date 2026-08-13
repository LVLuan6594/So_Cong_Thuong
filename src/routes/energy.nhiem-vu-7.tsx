import { createFileRoute } from "@tanstack/react-router";
import { BatteryCharging } from "lucide-react";
import { TaskPlaceholder } from "@/components/energy/TaskPlaceholder";

export const Route = createFileRoute("/energy/nhiem-vu-7")({
  head: () => ({ meta: [{ title: "Nhiệm vụ 7 | Năng lượng" }] }),
  component: Page,
});

function Page() {
  return <TaskPlaceholder taskId={7} icon={BatteryCharging} />;
}
