"use client";
import { useMemo, useState } from "react";
import { CATEGORIES, STATUSES, type CategoryKey, type StatusKey } from "@/lib/constants";
import type { Report } from "@/lib/types";
import { ReportsMapDynamic } from "./DynamicMaps";

export default function MapExplorer({ reports }: { reports: Report[] }) {
  const [cat, setCat] = useState<"" | CategoryKey>("");
  const [st, setSt] = useState<"" | StatusKey>("");
  const filtered = useMemo(() => reports.filter((r) => (!cat || r.category === cat) && (!st || r.status === st)), [reports, cat, st]);
  const sel = "rounded-lg border bg-white px-3 py-2 text-sm";
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select className={sel} value={cat} onChange={(e) => setCat(e.target.value as CategoryKey | "")}>
          <option value="">Barcha toifalar</option>
          {Object.entries(CATEGORIES).map(([k, v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
        </select>
        <select className={sel} value={st} onChange={(e) => setSt(e.target.value as StatusKey | "")}>
          <option value="">Barcha holatlar</option>
          {Object.entries(STATUSES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <span className="text-sm text-gray-600">{filtered.length} ta muammo</span>
      </div>
      <ReportsMapDynamic reports={filtered} />
      <div className="flex flex-wrap gap-3 text-xs text-gray-600">
        {Object.values(STATUSES).map((s) => (
          <span key={s.label} className="flex items-center gap-1"><i className="inline-block h-3 w-3 rounded-full" style={{ background: s.color }} />{s.label}</span>
        ))}
      </div>
    </div>
  );
}
