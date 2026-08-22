import { useState } from "react";
import { classNames } from "../utils/formatters";

const riskBadge = {
  Low:    "badge-success",
  Medium: "badge-warning",
  High:   "badge-danger",
};

const healthBadge = {
  Stable:         "badge-success",
  Observation:    "badge-warning",
  "Needs Review": "badge-danger",
};

function AttendanceBar({ value }) {
  const color = value >= 90 ? "bg-emerald-500" : value >= 75 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2.5 min-w-[90px]">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
        <div className={classNames("h-full rounded-full transition-all", color)} style={{ width: `${value}%` }} />
      </div>
      <span className="tabular-nums text-xs font-semibold text-slate-600 dark:text-slate-300">{value}%</span>
    </div>
  );
}

function EmptyState() {
  return (
    <tr>
      <td colSpan={100}>
        <div className="empty-state">
          <div className="empty-state-icon">
            <svg className="h-6 w-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4" />
            </svg>
          </div>
          <p className="empty-state-title">No records found</p>
          <p className="empty-state-desc">There is no data to display at this time.</p>
        </div>
      </td>
    </tr>
  );
}

function NameCell({ value, row }) {
  const [imgError, setImgError] = useState(false);
  const photo = row?.photo || row?.photoUrl || row?.imageUrl || row?.avatar || row?.profileImage;
  const hasPhoto = photo && typeof photo === "string" && !photo.includes("undefined") && !imgError;

  if (hasPhoto) {
    return (
      <div className="flex items-center gap-2.5">
        <img
          src={photo}
          alt={value}
          onError={() => setImgError(true)}
          className="h-7 w-7 rounded-full object-cover shrink-0 shadow-xs"
        />
        <span>{value}</span>
      </div>
    );
  }

  return <span>{value}</span>;
}

function CellValue({ col, value, row }) {
  if (col.key === "name") {
    return <NameCell value={value} row={row} />;
  }
  if (col.key === "risk") {
    return (
      <span className={classNames("badge", riskBadge[value] ?? "badge-neutral")}>
        <span className={classNames(
          "h-1.5 w-1.5 rounded-full",
          value === "High" ? "bg-red-500" : value === "Medium" ? "bg-amber-500" : "bg-emerald-500"
        )} />
        {value}
      </span>
    );
  }
  if (col.key === "health") {
    return (
      <span className={classNames("badge", healthBadge[value] ?? "badge-neutral")}>{value}</span>
    );
  }
  if (col.key === "attendance" && typeof value === "number") {
    return <AttendanceBar value={value} />;
  }
  if (col.key === "compliance" || col.key === "complianceRate" || col.key === "occupancyRate") {
    return <span className="font-medium tabular-nums text-slate-700 dark:text-slate-200">{value}</span>;
  }
  if (col.render) return col.render(value, row);
  return <span>{value}</span>;
}

export default function DataTable({ columns, rows, onRowClick }) {
  return (
    <div className="overflow-x-auto -mx-[1px]">
      <table className="min-w-full">
        <thead className="table-header">
          <tr className="border-b border-slate-200/80 dark:border-slate-700/80">
            {columns.map((col) => (
              <th key={col.key} className="table-th">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white dark:divide-slate-800 dark:bg-slate-900">
          {(!rows || rows.length === 0) ? (
            <EmptyState />
          ) : (
            rows.map((row, i) => (
              <tr
                key={row.id ?? i}
                className={classNames(
                  "table-row group",
                  onRowClick ? "cursor-pointer" : ""
                )}
                onClick={() => onRowClick?.(row)}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={(e) => {
                  if (onRowClick && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault(); onRowClick(row);
                  }
                }}
              >
                {columns.map((col) => (
                  <td key={col.key} className="table-td whitespace-nowrap">
                    <CellValue col={col} value={row[col.key]} row={row} />
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
