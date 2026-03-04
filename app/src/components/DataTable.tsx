"use client";
import { useState, useRef, useEffect } from "react";
import { MoreHorizontal } from "lucide-react";

interface Column {
  key: string;
  label: string;
  render?: (value: unknown, row: Record<string, unknown>) => React.ReactNode;
}

interface RowAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  danger?: boolean;
}

interface DataTableProps {
  columns: Column[];
  data: Record<string, unknown>[];
  title?: string;
  action?: React.ReactNode;
  rowActions?: (row: Record<string, unknown>) => RowAction[];
}

function ActionMenu({
  row,
  rowActions,
}: {
  row: Record<string, unknown>;
  rowActions: (row: Record<string, unknown>) => RowAction[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const actions = rowActions(row);
  if (actions.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="p-1 rounded-lg hover:bg-[#f8f9fc] text-[--color-muted]"
      >
        <MoreHorizontal size={16} />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 w-44 bg-white rounded-xl border border-[#e8ecf4] shadow-lg z-50 overflow-hidden py-1">
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => {
                action.onClick();
                setOpen(false);
              }}
              className={`w-full flex items-center gap-2.5 px-4 py-2 text-[13px] transition-colors text-right ${
                action.danger
                  ? "text-[#ef4444] hover:bg-[#fef2f2]"
                  : "text-[#1e293b] hover:bg-[#f8f9fc]"
              }`}
            >
              {action.icon && <span className="flex-shrink-0">{action.icon}</span>}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DataTable({ columns, data, title, action, rowActions }: DataTableProps) {
  return (
    <div className="card-dark overflow-hidden">
      {title && (
        <div className="flex items-center justify-between p-5 pb-0">
          <h3 className="text-base font-bold text-[--color-text]">{title}</h3>
          {action}
        </div>
      )}
      <div className="overflow-x-auto p-5">
        <table className="w-full border-collapse min-w-[600px]">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-right p-3 text-[11px] font-semibold text-[--color-muted] uppercase tracking-wider border-b border-[--color-border]"
                >
                  {col.label}
                </th>
              ))}
              {rowActions && <th className="w-10 border-b border-[--color-border]"></th>}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} className="hover:bg-[#f8f9fc] transition-colors">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="p-3 text-[13px] text-[--color-text] border-b border-[#e8ecf4]"
                  >
                    {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? "")}
                  </td>
                ))}
                {rowActions && (
                  <td className="p-3 border-b border-[#e8ecf4]">
                    <ActionMenu row={row} rowActions={rowActions} />
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
