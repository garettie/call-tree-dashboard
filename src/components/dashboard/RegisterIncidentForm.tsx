import { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Plus,
  X,
  Pencil,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import type { Incident } from "../../types";

/** Format a Date to YYYY-MM-DD for date inputs */
function formatDateInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Format a Date to HH:MM for time inputs */
function formatTimeInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
}

interface RegisterIncidentFormProps {
  editingIncident: Incident | null;
  onSaved: () => void;
  onCancel: () => void;
}

export default function RegisterIncidentForm({
  editingIncident,
  onSaved,
  onCancel,
}: RegisterIncidentFormProps) {
  const [regName, setRegName] = useState(editingIncident?.name ?? "");
  const [regType, setRegType] = useState<"test" | "actual">(
    editingIncident?.type ?? "test",
  );
  const [regStartDate, setRegStartDate] = useState(
    editingIncident ? formatDateInput(new Date(editingIncident.start_time)) : "",
  );
  const [regStartTime, setRegStartTime] = useState(
    editingIncident ? formatTimeInput(new Date(editingIncident.start_time)) : "",
  );
  const [regEndDate, setRegEndDate] = useState(
    editingIncident
      ? formatDateInput(new Date(editingIncident.end_time ?? Date.now()))
      : "",
  );
  const [regEndTime, setRegEndTime] = useState(
    editingIncident
      ? formatTimeInput(new Date(editingIncident.end_time ?? Date.now()))
      : "",
  );
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    !!regName && !!regStartDate && !!regStartTime && !!regEndDate && !!regEndTime;

  const handleSave = async () => {
    if (!canSubmit) return;
    setSubmitting(true);

    const startISO = `${regStartDate}T${regStartTime}:00Z`;
    const endISO = `${regEndDate}T${regEndTime}:00Z`;

    const payload = {
      name: regName,
      type: regType,
      start_time: startISO,
      end_time: endISO,
    };

    let error;

    if (editingIncident) {
      const { error: updateError } = await supabase
        .from("incidents")
        .update(payload)
        .eq("id", editingIncident.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from("incidents")
        .insert(payload);
      error = insertError;
    }

    if (error) {
      console.error("Error saving event:", error);
    } else {
      onSaved();
    }
    setSubmitting(false);
  };

  return (
    <div className="glass-card p-6 mb-6 animate-in fade-in zoom-in duration-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
          {editingIncident ? (
            <>
              <Pencil className="w-5 h-5 text-slate-500" />
              Edit Event
            </>
          ) : (
            <>
              <Plus className="w-5 h-5 text-slate-500" />
              Register Past Event
            </>
          )}
        </h3>
        <button
          onClick={onCancel}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-4">
        {editingIncident
          ? "Update the details of this past event."
          : "Retroactively register an event that happened before the incident system was in place. Responses within the time window will be scoped to this event."}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
            Event Name
          </label>
          <input
            autoFocus
            type="text"
            placeholder="e.g. Call Tree Test"
            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            value={regName}
            onChange={(e) => setRegName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-gray-500 mb-2">
            Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setRegType("test")}
              className={`p-2 rounded border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                regType === "test"
                  ? "bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500"
                  : "border-gray-200 hover:bg-gray-50 text-gray-600"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              TEST
            </button>
            <button
              onClick={() => setRegType("actual")}
              className={`p-2 rounded border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                regType === "actual"
                  ? "bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500"
                  : "border-gray-200 hover:bg-gray-50 text-gray-600"
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
              ACTUAL
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
            Start Date & Time
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              className="flex-1 border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              value={regStartDate}
              onChange={(e) => setRegStartDate(e.target.value)}
            />
            <input
              type="time"
              className="w-28 border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              value={regStartTime}
              onChange={(e) => setRegStartTime(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
            End Date & Time
          </label>
          <div className="flex gap-2">
            <input
              type="date"
              className="flex-1 border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              value={regEndDate}
              onChange={(e) => setRegEndDate(e.target.value)}
            />
            <input
              type="time"
              className="w-28 border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              value={regEndTime}
              onChange={(e) => setRegEndTime(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
        <button
          onClick={handleSave}
          disabled={submitting || !canSubmit}
          className="bg-slate-900 text-white px-5 py-2 rounded hover:bg-slate-800 font-medium flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {submitting ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
          ) : editingIncident ? (
            <Pencil className="w-4 h-4" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          {editingIncident ? "Save Changes" : "Register Event"}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded text-gray-600 hover:bg-gray-100 font-medium text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
