import React, { useState, useMemo } from "react";
import { Download, AlertTriangle, Search, Clock } from "lucide-react";
import type { ProcessedContact, Response } from "../../../types";
import { downloadCSV } from "../../../lib/csv";
import { formatDateTime, formatPhoneNumber } from "../../../lib/utils";

// --- Shared class-name tokens ---

const CELL = "px-4 py-2 text-gray-500";
const CELL_PHONE = `${CELL} font-mono text-xs`;
const TH = "px-4 py-2 font-medium";
const THEAD_ROW = "bg-gray-50 text-xs text-gray-500 uppercase";
const BANNER = "px-4 py-2 text-xs flex items-center gap-2 border-b";

// --- TableCard (shared wrapper) ---

interface TableCardProps {
  title: string;
  action: React.ReactNode;
  children: React.ReactNode;
}

const TableCard: React.FC<TableCardProps> = ({ title, action, children }) => (
  <div className="glass-card flex flex-col overflow-hidden h-full max-h-[400px]">
    <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
      <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
      {action}
    </div>
    <div className="overflow-x-auto overflow-y-auto flex-1">{children}</div>
  </div>
);

// --- DownloadButton (shared between both tables) ---

const DownloadButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="text-gray-500 hover:text-accent-primary transition-colors"
  >
    <Download className="w-4 h-4" />
  </button>
);

// --- UnknownTable ---

export const UnknownTable: React.FC<{ data: Response[] }> = ({ data }) => {
  if (data.length === 0) return null;

  const handleDownload = () => {
    const csv = data.map((r) => ({
      Phone: r.contact,
      Message: r.contents,
      Time: r.datetime,
    }));
    downloadCSV(csv, "unknown_responses.csv");
  };

  return (
    <TableCard
      title={`Unknown Numbers (${data.length})`}
      action={<DownloadButton onClick={handleDownload} />}
    >
      <div className={`${BANNER} bg-orange-50 text-orange-700 border-orange-100`}>
        <AlertTriangle className="w-3 h-3" />
        Check these responses manually.
      </div>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className={THEAD_ROW}>
            <th className={TH}>Phone</th>
            <th className={TH}>Message</th>
            <th className={TH}>Time</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row, i) => (
            <tr key={i} className="hover:bg-gray-50/50">
              <td className={CELL_PHONE}>
                {formatPhoneNumber(row.contact)}
              </td>
              <td
                className={`${CELL} max-w-[200px] truncate`}
                title={row.contents}
              >
                {row.contents}
              </td>
              <td className={`${CELL} text-xs whitespace-nowrap`}>
                {formatDateTime(row.datetime)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableCard>
  );
};

// --- ManualResponseModal ---

import { X, Save } from "lucide-react";
import { supabase } from "../../../lib/supabase";
import { COLORS } from "../../../lib/constants";
import { localNowAsUTC } from "../../../lib/utils";

interface ManualResponseModalProps {
  contact: ProcessedContact;
  onClose: () => void;
  onSuccess: () => void;
}

const ManualResponseModal: React.FC<ManualResponseModalProps> = ({
  contact,
  onClose,
  onSuccess,
}) => {
  const [status, setStatus] = useState("Safe");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Map status words to numeric codes for DB insertion
  const STATUS_CODES: Record<string, string> = {
    "Safe": "1",
    "Slight": "2",
    "Moderate": "3",
    "Severe": "4",
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      // 1. Convert Status Word to Number Info
      const statusCode = STATUS_CODES[status] || "1";
      const contents = `${statusCode} - ${message || "Manual Entry"}`;
      
      // Basic validation
      if (!contact.number) throw new Error("Contact number is missing.");

      // 2. Format Phone Number with +63 prefix
      let formattedContact = contact.number.replace(/[^0-9]/g, ""); // Strip non-digits
      if (formattedContact.startsWith("09")) {
        formattedContact = "63" + formattedContact.slice(1);
      } else if (formattedContact.startsWith("9") && formattedContact.length === 10) {
        formattedContact = "63" + formattedContact;
      }
      // Ensure it starts with + if it's a PH number (which starts with 63 after normalization)
      if (formattedContact.startsWith("63")) {
        formattedContact = "+" + formattedContact;
      }
      
      // [CHANGE] Generate a unique ID for manual entries to avoid collision with SMS UIDs (which are integers)
      // Format: "m-<timestamp>-<random>"
      const manuallyGeneratedUid = `m-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      const { error } = await supabase.from("Responses").insert({
        uid: manuallyGeneratedUid,
        contact: formattedContact, // Use the formatted number with +
        contents: contents,
        datetime: localNowAsUTC(),
      });

      if (error) throw error;
      onSuccess();
    } catch (err: any) {
      console.error("Failed to add response:", err);
      // Detailed error for debugging RLS/Schema issues
      const detailedError = err.message + (err.details ? ` (${err.details})` : "") + (err.hint ? ` [Hint: ${err.hint}]` : "");
      setErrorMsg(detailedError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="font-semibold text-gray-900">Add Response</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Contact
            </label>
            <div className="font-medium text-gray-900">{contact.name}</div>
            <div className="text-xs text-gray-500 font-mono">
              {formatPhoneNumber(contact.number)}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Status
            </label>
            <div className="grid grid-cols-2 gap-2">
              {["Safe", "Slight", "Moderate", "Severe"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all ${
                    status === s
                      ? "ring-2 ring-offset-1"
                      : "hover:bg-gray-50 border-gray-200 text-gray-600"
                  }`}
                  style={{
                    backgroundColor: status === s ? COLORS[s as keyof typeof COLORS] : undefined,
                    color: status === s ? "#fff" : undefined,
                    borderColor: status === s ? "transparent" : undefined,
                    // Specific fix for "Safe" text color since generic white might not contrast well with lighter colors, 
                    // but for "Safe" (green) white is fine. 
                    // Let's keep it simple.
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Message / Source (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Replied via Viber"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary transition-all resize-none h-20"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 text-red-600 text-xs rounded-lg border border-red-100 break-words">
              Error: {errorMsg}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-accent-primary text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                "Saving..."
              ) : (
                <>
                  <Save className="w-4 h-4" /> Save Response
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- PendingTable ---

const PENDING_SEARCH_FIELDS: (keyof ProcessedContact)[] = [
  "name",
  "department",
  "position",
  "number",
];

export const PendingTable: React.FC<{ 
  data: ProcessedContact[];
  onResponseAdded?: () => void; // Callback to trigger refresh
}> = ({
  data,
  onResponseAdded,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContact, setSelectedContact] = useState<ProcessedContact | null>(null);

  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    const q = searchTerm.toLowerCase();
    return data.filter((c) =>
      PENDING_SEARCH_FIELDS.some((f) =>
        (c[f]?.toString().toLowerCase() ?? "").includes(q)
      )
    );
  }, [data, searchTerm]);

  if (data.length === 0) return null;

  const handleDownload = () => {
    const csv = filteredData.map((c) => ({
      Name: c.name,
      Dept: c.department,
      Position: c.position,
      Phone: c.number,
    }));
    downloadCSV(csv, "pending_responses.csv");
  };

  return (
    <>
      <div className="glass-card flex flex-col overflow-hidden h-full max-h-[400px]">
        {/* Header + Search */}
        <div className="px-4 py-3 border-b border-gray-100 flex flex-col gap-3 bg-gray-50/50">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900 text-sm">
              Pending Responses ({filteredData.length})
            </h3>
            <DownloadButton onClick={handleDownload} />
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search pending..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-accent-primary/20 focus:border-accent-primary transition-all"
            />
          </div>
        </div>

        {/* Accent Banner */}
        <div className={`${BANNER} bg-blue-50 text-blue-700 border-blue-100`}>
          <Clock className="w-3 h-3" />
          Awaiting response from these contacts.
        </div>

        {/* Table */}
        <div className="overflow-x-auto overflow-y-auto flex-1">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className={`${THEAD_ROW} sticky top-0 z-10`}>
                <th className={TH}>Name</th>
                <th className={TH}>Position</th>
                <th className={TH}>Department</th>
                <th className={TH}>Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredData.map((row) => (
                <tr key={row.id || row.number} className="hover:bg-gray-50/50 group">
                  <td className="px-4 py-2 text-gray-900 items-center gap-2">
                    {row.name}
                    <div className="text-[10px] text-gray-400 font-mono">
                      {formatPhoneNumber(row.number)}
                    </div>
                  </td>
                  <td className={CELL}>{row.position || "-"}</td>
                  <td className={CELL}>{row.department}</td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => setSelectedContact(row)}
                      className="text-xs text-accent-primary hover:text-green-700 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      + Add Response
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredData.length === 0 && (
            <div className="p-6 text-center text-gray-500 text-xs">
              No pending contacts match your search.
            </div>
          )}
        </div>
      </div>

      {selectedContact && (
        <ManualResponseModal
          contact={selectedContact}
          onClose={() => setSelectedContact(null)}
          onSuccess={() => {
            setSelectedContact(null);
            onResponseAdded?.();
          }}
        />
      )}
    </>
  );
};
