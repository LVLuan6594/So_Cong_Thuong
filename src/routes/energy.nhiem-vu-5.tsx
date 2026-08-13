import { createFileRoute } from "@tanstack/react-router";
import { ShieldAlert } from "lucide-react";
import { TaskPlaceholder } from "@/components/energy/TaskPlaceholder";

export const Route = createFileRoute("/energy/nhiem-vu-5")({
  head: () => ({ meta: [{ title: "Nhiệm vụ 5 | Năng lượng" }] }),
  component: Page,
});

function Page() {
  return <TaskPlaceholder taskId={5} icon={ShieldAlert} />;
}
