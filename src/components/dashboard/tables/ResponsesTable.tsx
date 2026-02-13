import React, { useState, useMemo } from "react";
import {
  Download,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { ProcessedContact } from "../../../types";
import { COLORS } from "../../../lib/constants";
import { downloadCSV } from "../../../lib/csv";
import { formatDateTime, formatPhoneNumber } from "../../../lib/utils";

// --- Types ---

type SortDirection = "asc" | "desc";
type SortKey = keyof ProcessedContact;
type SortConfig = { key: SortKey | null; direction: SortDirection };

interface ResponsesTableProps {
  data: ProcessedContact[];
}

// --- Shared class-name tokens ---

const CELL = "px-6 py-3 text-gray-500";
const CELL_PHONE = `${CELL} font-mono text-xs`;

// Column definitions rendered by SortableHeader
const COLUMNS: { label: string; sortKey: SortKey }[] = [
  { label: "Name", sortKey: "name" },
  { label: "Status", sortKey: "status" },
  { label: "Position", sortKey: "position" },
  { label: "Department", sortKey: "department" },
  { label: "Location", sortKey: "location" },
  { label: "Level", sortKey: "level" },
  { label: "Phone", sortKey: "cleanNumber" },
  { label: "Time", sortKey: "responseTime" },
];

// Searchable field keys
const SEARCH_FIELDS: (keyof ProcessedContact)[] = [
  "name",
  "status",
  "department",
  "position",
  "cleanNumber",
];

// --- SortableHeader ---

interface SortableHeaderProps {
  label: string;
  sortKey: SortKey;
  currentSort: SortConfig;
  onSort: (key: SortKey) => void;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({
  label,
  sortKey,
  currentSort,
  onSort,
}) => {
  const icon =
    currentSort.key !== sortKey ? (
      <ArrowUpDown className="w-4 h-4 text-gray-300" />
    ) : currentSort.direction === "asc" ? (
      <ArrowUp className="w-4 h-4 text-accent-primary" />
    ) : (
      <ArrowDown className="w-4 h-4 text-accent-primary" />
    );

  return (
    <th
      className="px-6 py-3 font-medium cursor-pointer hover:bg-gray-100 transition-colors select-none"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-2">
        {label}
        {icon}
      </div>
    </th>
  );
};

// --- StatusBadge ---

const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span
    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
    style={{
      backgroundColor: status === "Safe" ? COLORS.Light : "white",
      borderColor: COLORS[status as keyof typeof COLORS],
      color: COLORS[status as keyof typeof COLORS],
    }}
  >
    {status}
  </span>
);

// --- Main Component ---

export const ResponsesTable: React.FC<ResponsesTableProps> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: null,
    direction: "asc",
  });

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const q = searchTerm.toLowerCase();
    return data.filter((c) =>
      SEARCH_FIELDS.some((f) => (c[f]?.toString().toLowerCase() ?? "").includes(q))
    );
  }, [data, searchTerm]);

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return filteredData;
    const { key, direction } = sortConfig;
    const dir = direction === "asc" ? 1 : -1;
    return [...filteredData].sort((a, b) => {
      if (key === "responseTime") {
        return dir * (new Date(a.responseTime || 0).getTime() - new Date(b.responseTime || 0).getTime());
      }
      const va = (a[key] ?? "").toString().toLowerCase();
      const vb = (b[key] ?? "").toString().toLowerCase();
      return va < vb ? -dir : va > vb ? dir : 0;
    });
  }, [filteredData, sortConfig]);

  const requestSort = (key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleDownload = () => {
    const csvData = sortedData.map((c) => ({
      name: c.name,
      status: c.status,
      position: c.position,
      department: c.department,
      location: c.location,
      datetime: c.responseTime,
      number: c.cleanNumber,
    }));
    downloadCSV(csvData, "responses.csv");
  };

  if (data.length === 0) return null;

  return (
    <div className="glass-card flex flex-col overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex flex-col gap-4 bg-gray-50/50">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">
            Responses ({sortedData.length})
          </h3>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 px-3 py-1.5 bg-accent-primary text-white text-xs font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download CSV
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Filter by name, status, department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary transition-all"
          />
        </div>
      </div>

      <div className="overflow-x-auto overflow-y-auto max-h-[600px]">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-500 uppercase tracking-wider sticky top-0 z-10">
              {COLUMNS.map((col) => (
                <SortableHeader
                  key={col.sortKey}
                  label={col.label}
                  sortKey={col.sortKey}
                  currentSort={sortConfig}
                  onSort={requestSort}
                />
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedData.map((row) => (
              <tr
                key={row.id || row.number}
                className="hover:bg-gray-50/50 transition-colors"
              >
                <td className="px-6 py-3 text-gray-900">{row.name}</td>
                <td className="px-6 py-3">
                  <StatusBadge status={row.status} />
                </td>
                <td className={CELL}>{row.position || "-"}</td>
                <td className={CELL}>{row.department}</td>
                <td className={CELL}>{row.location}</td>
                <td className={`${CELL} capitalize`}>{row.level || "-"}</td>
                <td className={CELL_PHONE}>
                  {formatPhoneNumber(row.cleanNumber)}
                </td>
                <td className={CELL}>{formatDateTime(row.responseTime)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {sortedData.length === 0 && (
          <div className="p-8 text-center text-gray-500 text-sm">
            No matching records found.
          </div>
        )}
      </div>
    </div>
  );
};
