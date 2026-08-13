import { WorkflowStatusBadge } from "@/components/grid/GridShared";
import { EnergyStatusBadge, FieldGrid } from "@/components/energy/EnergyShared";
import { EntityDetailDrawer } from "@/components/energy/EnergyShared";
import type { GridEntity } from "@/components/grid/GridMap";
import { corridorWidthM } from "@/lib/grid-geo";
import {
  OPERATION_LOG_TYPE_LABEL,
  OPERATION_STATUS_LABEL,
  PLAN_PHASE_LABEL,
  operationLogTone,
  operationStatusTone,
  planPhaseTone,
  type OperationLog,
} from "@/lib/grid-types";
import { cn } from "@/lib/utils";

export function GridEntityDrawer({
  entity,
  onOpenChange,
}: {
  entity: GridEntity | null;
  onOpenChange: (value: boolean) => void;
}) {
  if (!entity) return null;
  return <EntityDetailDrawer open onOpenChange={onOpenChange} {...content(entity)} />;
}

function OperationLogTimeline({ logs }: { logs: OperationLog[] }) {
  if (!logs.length) return null;
  return (
    <section>
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
        Lịch sử vận hành
      </h3>
      <ol className="space-y-2 border-l-2 border-border pl-3">
        {logs.map((log) => (
          <li key={log.id} className="relative">
            <span
              className={cn(
                "absolute -left-[19px] top-1 size-2.5 rounded-full border-2 border-card",
                log.type === "energize"
                  ? "bg-success"
                  : log.type === "deenergize"
                    ? "bg-destructive"
                    : log.type === "incident"
                      ? "bg-warning"
                      : "bg-gov",
              )}
            />
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  operationLogTone(log.type),
                )}
              >
                {OPERATION_LOG_TYPE_LABEL[log.type]}
              </span>
              <span className="text-[11px] tabular-nums text-muted-foreground">{log.time}</span>
            </div>
            <p className="mt-0.5 text-xs text-navy">{log.reason}</p>
            <p className="text-[11px] text-muted-foreground">
              {log.affected} · {log.actor}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function content(entity: GridEntity) {
  if (entity.kind === "substation") {
    const s = entity.item;
    return {
      title: s.name,
      description: `${s.voltageLevel} · ${s.district}`,
      children: (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <EnergyStatusBadge status={s.status} />
            {s.workflowStatus ? <WorkflowStatusBadge status={s.workflowStatus} /> : null}
            {s.switchingState ? (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  operationStatusTone(s.switchingState),
                )}
              >
                {OPERATION_STATUS_LABEL[s.switchingState]}
              </span>
            ) : null}
          </div>
          <FieldGrid
            items={[
              { label: "Mã trạm", value: s.code },
              { label: "Loại trạm", value: s.type },
              { label: "Cấp điện áp", value: s.voltageLevel },
              { label: "Địa chỉ", value: s.address },
              { label: "Đơn vị quản lý", value: s.operator },
              { label: "Công suất thiết kế", value: `${s.designCapacity ?? 0} MVA` },
              { label: "Công suất vận hành", value: `${s.operatingCapacity ?? 0} MVA` },
              { label: "Khả năng tiếp nhận", value: `${s.availableCapacity ?? 0} MVA` },
              { label: "Hệ số tải", value: `${s.loadFactor ?? 0}%` },
              {
                label: "Bán kính cấp điện",
                value: s.supplyRadiusKm ? `${s.supplyRadiusKm} km` : undefined,
              },
              { label: "Vùng cấp điện", value: s.supplyArea },
            ]}
          />
          {s.planned ? (
            <section>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Quy hoạch
              </h3>
              <FieldGrid
                items={[
                  { label: "Vị trí dự kiến", value: s.planned.location },
                  { label: "Chủ đầu tư", value: s.planned.investor },
                  { label: "Tiến độ", value: s.planned.progress },
                  {
                    label: "Năm vận hành dự kiến",
                    value: s.planned.year ? String(s.planned.year) : undefined,
                  },
                ]}
              />
              {s.planned.phase ? (
                <span
                  className={cn(
                    "mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    planPhaseTone(s.planned.phase),
                  )}
                >
                  {PLAN_PHASE_LABEL[s.planned.phase]}
                </span>
              ) : null}
            </section>
          ) : null}
          {s.transformers?.length ? (
            <section>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Máy biến áp
              </h3>
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full min-w-[420px] text-xs">
                  <thead>
                    <tr className="bg-surface-strong text-left">
                      <th className="px-3 py-2 font-semibold text-muted-foreground">Tổ máy</th>
                      <th className="px-3 py-2 font-semibold text-muted-foreground">Loại</th>
                      <th className="px-3 py-2 font-semibold text-muted-foreground">Công suất</th>
                      <th className="px-3 py-2 font-semibold text-muted-foreground">
                        Tỷ số điện áp
                      </th>
                      <th className="px-3 py-2 font-semibold text-muted-foreground">Tải</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.transformers.map((t) => (
                      <tr key={t.no} className="border-t border-border">
                        <td className="px-3 py-2 font-medium text-navy">{t.no}</td>
                        <td className="px-3 py-2">{t.type}</td>
                        <td className="px-3 py-2 tabular-nums">{t.capacityMva} MVA</td>
                        <td className="px-3 py-2">{t.voltageRatio}</td>
                        <td
                          className={
                            t.loadFactorPct >= 100
                              ? "px-3 py-2 font-semibold tabular-nums text-destructive"
                              : "px-3 py-2 font-semibold tabular-nums text-success"
                          }
                        >
                          {t.loadFactorPct}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
          {s.connectionPoints?.length ? (
            <section>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Điểm đấu nối
              </h3>
              <div className="space-y-1.5">
                {s.connectionPoints.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-md border border-border bg-surface px-3 py-2 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-navy">{p.name}</p>
                      <p className="text-muted-foreground">{p.type}</p>
                    </div>
                    <EnergyStatusBadge status={p.status} />
                  </div>
                ))}
              </div>
            </section>
          ) : null}
          {s.operationLogs ? <OperationLogTimeline logs={s.operationLogs} /> : null}
        </div>
      ),
    };
  }

  if (entity.kind === "line") {
    const l = entity.item;
    return {
      title: l.name,
      description: `${l.voltageLevel} · ${l.lengthKm} km`,
      children: (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <EnergyStatusBadge status={l.status} />
            {l.workflowStatus ? <WorkflowStatusBadge status={l.workflowStatus} /> : null}
            {l.switchingState ? (
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                  operationStatusTone(l.switchingState),
                )}
              >
                {OPERATION_STATUS_LABEL[l.switchingState]}
              </span>
            ) : null}
          </div>
          <FieldGrid
            items={[
              { label: "Mã tuyến", value: l.code },
              { label: "Cấp điện áp", value: l.voltageLevel },
              { label: "Điểm đầu", value: l.fromPoint },
              { label: "Điểm cuối", value: l.toPoint },
              { label: "Chiều dài", value: `${l.lengthKm} km` },
              { label: "Khả năng tải", value: `${l.capacityMw ?? 0} MW` },
              { label: "Tải thực tế", value: `${l.actualLoadMw ?? 0} MW` },
              { label: "Tổn thất", value: `${l.lossPct ?? 0}%` },
              { label: "Hành lang an toàn", value: l.corridorStatus },
              {
                label: "Bề rộng hành lang (NĐ 14/2014)",
                value: `${corridorWidthM(l.voltageLevel)} m`,
              },
              { label: "Đơn vị quản lý", value: l.operator },
            ]}
          />
          {l.technical ? (
            <section>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Thông số kỹ thuật
              </h3>
              <FieldGrid
                items={[
                  { label: "Dây dẫn", value: l.technical.conductorType },
                  { label: "Tiết diện", value: l.technical.crossSectionMm2 },
                  { label: "Số mạch", value: String(l.technical.lineCount) },
                  { label: "Độ cao trung bình", value: `${l.technical.avgHeightM} m` },
                  { label: "Cách điện", value: l.technical.insulation },
                  { label: "Chống sét", value: l.technical.groundingMethod },
                ]}
              />
            </section>
          ) : null}
          {l.operation ? (
            <section>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Vận hành
              </h3>
              <FieldGrid
                items={[
                  { label: "Dòng tải", value: `${l.operation.currentLoadA} A` },
                  { label: "Lệch điện áp", value: `${l.operation.voltageDeviationPct}%` },
                  { label: "Điểm nóng", value: l.operation.hotSpot },
                  { label: "Tổn thất", value: `${l.operation.lossPct}%` },
                  { label: "Số lần quá tải", value: String(l.operation.overloadCount) },
                  { label: "Suất sự cố", value: `${l.operation.faultRatePerYear} lần/năm` },
                ]}
              />
            </section>
          ) : null}
          {l.planning ? (
            <section>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Kế hoạch đầu tư
              </h3>
              <FieldGrid
                items={[
                  { label: "Vị trí", value: l.planning.location },
                  { label: "Nhà đầu tư", value: l.planning.investor },
                  { label: "Tiến độ", value: l.planning.progress },
                  {
                    label: "Năm dự kiến",
                    value: l.planning.year ? String(l.planning.year) : undefined,
                  },
                  { label: "Tổng mức đầu tư", value: l.planning.investment },
                  {
                    label: "Hành lang dự kiến",
                    value: l.planning.corridorWidthM ? `${l.planning.corridorWidthM} m` : undefined,
                  },
                ]}
              />
              {l.planning.phase ? (
                <span
                  className={cn(
                    "mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    planPhaseTone(l.planning.phase),
                  )}
                >
                  {PLAN_PHASE_LABEL[l.planning.phase]}
                </span>
              ) : null}
            </section>
          ) : null}
          {l.planningPoles?.length ? (
            <section>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Trụ điện quy hoạch
              </h3>
              <div className="overflow-x-auto rounded-md border border-border">
                <table className="w-full min-w-[420px] text-xs">
                  <thead>
                    <tr className="bg-surface-strong text-left">
                      <th className="px-3 py-2 font-semibold text-muted-foreground">Mã trụ</th>
                      <th className="px-3 py-2 font-semibold text-muted-foreground">Kết cấu</th>
                      <th className="px-3 py-2 font-semibold text-muted-foreground">Khoảng cột</th>
                      <th className="px-3 py-2 font-semibold text-muted-foreground">
                        Giải phóng mặt bằng
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {l.planningPoles.map((p) => (
                      <tr key={p.id} className="border-t border-border">
                        <td className="px-3 py-2 font-medium text-navy">{p.code}</td>
                        <td className="px-3 py-2">{p.planning?.structureType ?? p.type}</td>
                        <td className="px-3 py-2 tabular-nums">
                          {p.planning?.spacingKm ? `${p.planning.spacingKm} km` : "—"}
                        </td>
                        <td className="px-3 py-2">{p.planning?.clearanceStatus}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
          {l.incidentRecords?.length ? (
            <section>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Sự cố tuyến
              </h3>
              <div className="space-y-1.5">
                {l.incidentRecords.map((inc) => (
                  <div
                    key={inc.id}
                    className="rounded-md border border-border bg-surface px-3 py-2 text-xs"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                          inc.severity === "high"
                            ? "bg-destructive/10 text-destructive"
                            : inc.severity === "medium"
                              ? "bg-warning/10 text-warning"
                              : "bg-success/10 text-success",
                        )}
                      >
                        {inc.code}
                      </span>
                      <span className="text-[11px] tabular-nums text-muted-foreground">
                        {inc.time}
                      </span>
                    </div>
                    <p className="mt-1 font-medium text-navy">{inc.type}</p>
                    <p className="text-muted-foreground">{inc.location}</p>
                    <p className="mt-0.5 text-muted-foreground">
                      {inc.customersAffected ?? 0} khách hàng mất điện · {inc.lostLoadMw ?? 0} MW ·{" "}
                      {inc.outageDuration === "—" ? "chưa gián đoạn" : inc.outageDuration}
                    </p>
                    <p className="mt-0.5 text-muted-foreground">
                      Xử lý: {inc.handler} · {inc.progress}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
          {l.operationLogs ? <OperationLogTimeline logs={l.operationLogs} /> : null}
        </div>
      ),
    };
  }

  if (entity.kind === "pole") {
    const p = entity.item;
    return {
      title: p.code,
      description: `Trụ ${p.number} · ${p.lineCode}`,
      children: (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <EnergyStatusBadge status={p.foundationStatus} />
          </div>
          <FieldGrid
            items={[
              { label: "Mã trụ", value: p.code },
              { label: "Số trụ", value: p.number },
              { label: "Tuyến", value: p.lineCode },
              { label: "Loại trụ", value: p.type },
              { label: "Chiều cao", value: `${p.height} m` },
              { label: "Năm xây dựng", value: String(p.yearBuilt) },
              { label: "Nền móng", value: p.foundationStatus },
              { label: "Trạng thái kỹ thuật", value: p.technicalStatus },
              { label: "Hành lang an toàn", value: p.safetyCorridor },
              {
                label: "Tọa độ",
                value: p.latitude && p.longitude ? `${p.latitude}, ${p.longitude}` : undefined,
              },
            ]}
          />
          {p.images?.length ? (
            <section>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Hình ảnh hiện trạng
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {p.images.map((src) => (
                  <img
                    key={src}
                    src={src}
                    alt={`Ảnh hiện trạng trụ ${p.code}`}
                    loading="lazy"
                    className="aspect-video w-full rounded-md border border-border object-cover"
                  />
                ))}
              </div>
            </section>
          ) : null}
          {p.planning ? (
            <section>
              <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                Kế hoạch xây dựng
              </h3>
              <FieldGrid
                items={[
                  { label: "Vị trí dự kiến", value: p.planning.location },
                  { label: "Khoảng cột", value: `${p.planning.spacingKm} km` },
                  { label: "Kết cấu dự kiến", value: p.planning.structureType },
                  { label: "Giải phóng mặt bằng", value: p.planning.clearanceStatus },
                  { label: "Hồ sơ kỹ thuật", value: p.planning.techDocs },
                  { label: "Hồ sơ môi trường", value: p.planning.envDocs },
                ]}
              />
            </section>
          ) : null}
        </div>
      ),
    };
  }

  const a = entity.item;
  return {
    title: a.name,
    description: `${a.code} · ${a.voltageLevel}`,
    children: (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          {a.phase ? (
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                planPhaseTone(a.phase),
              )}
            >
              {PLAN_PHASE_LABEL[a.phase]}
            </span>
          ) : null}
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {a.progress}
          </span>
        </div>
        <FieldGrid
          items={[
            { label: "Mã", value: a.code },
            {
              label: "Loại",
              value:
                a.type === "substation"
                  ? "Trạm biến áp"
                  : a.type === "line"
                    ? "Đường dây"
                    : "Trụ điện",
            },
            { label: "Cấp điện áp", value: a.voltageLevel },
            { label: "Địa bàn", value: a.district },
            { label: "Vị trí", value: a.location },
            { label: "Nhà đầu tư", value: a.investor },
            { label: "Năm hoàn thành dự kiến", value: String(a.year) },
          ]}
        />
        {a.description ? (
          <p className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-navy">
            {a.description}
          </p>
        ) : null}
      </div>
    ),
  };
}
