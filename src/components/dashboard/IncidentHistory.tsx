import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  ChevronRight,
  BarChart3,
  Plus,
  X,
  Pencil,
  Trash2,
} from "lucide-react";
import { StartIncidentForm } from "./StartIncidentForm";
import { supabase } from "../../lib/supabase";
import { useDashboardData } from "../../hooks/useDashboardData";
import { DashboardContent } from "./DashboardContent";
import {
  formatDateShort,
  formatDuration,
  formatTimeShort,
} from "../../lib/utils";
import type { Incident } from "../../types";

// ─── Detail View (reuses all existing dashboard components) ─
function IncidentDetail({
  incident,
  onBack,
  onStartNew,
}: {
  incident: Incident;
  onBack: () => void;
  onStartNew?: (name: string, type: "test" | "actual") => void;
}) {
  const [showStartForm, setShowStartForm] = useState(false);
  const { data, loading, error, refresh } = useDashboardData(
    incident.start_time,
    incident.end_time ?? undefined,
  );

  const isTest = incident.type === "test";

  if (error) {
    return <div className="p-8 text-center text-red-600">Error: {error}</div>;
  }

  return (
    <div className="animate-in fade-in duration-300">
      {/* Back Button + Incident Info Banner */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          Back to History
        </button>

        {!showStartForm && onStartNew && (
          <button
            onClick={() => setShowStartForm(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-medium shadow hover:bg-slate-800 transition-all text-sm"
          >
            <Play className="w-4 h-4 fill-current" />
            Start New Event
          </button>
        )}
      </div>

      {showStartForm && onStartNew && (
        <div className="mb-6">
          <StartIncidentForm
            onStart={onStartNew}
            onCancel={() => setShowStartForm(false)}
          />
        </div>
      )}

      {/* Incident Info Banner */}
      <div
          className={`mb-6 p-4 rounded-lg flex items-center justify-between shadow-sm border-l-4 ${
            isTest
              ? "bg-blue-50 border-blue-500"
              : "bg-red-50 border-red-500"
          }`}
        >
          <div className="flex items-center gap-4">
            <div
              className={`p-2 rounded-full ${isTest ? "bg-blue-100 text-blue-600" : "bg-red-100 text-red-600"}`}
            >
              {isTest ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>
            <div>
              <h2
                className={`text-lg font-bold ${isTest ? "text-blue-900" : "text-red-900"}`}
              >
                {incident.name}
              </h2>
              <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatDateShort(incident.start_time)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {formatTimeShort(incident.start_time)} –{" "}
                  {incident.end_time ? formatTimeShort(incident.end_time) : "—"}
                </span>
                {incident.end_time && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    Duration:{" "}
                    {formatDuration(incident.start_time, incident.end_time)}
                  </span>
                )}
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${
                    isTest
                      ? "bg-blue-100 text-blue-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {incident.type}
                </span>
              </div>
            </div>
          </div>
        </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      )}

      {!loading && (
        <DashboardContent 
          data={data} 
          storageKey={`incident-filters-${incident.id}`} 
          onRefresh={() => refresh({ background: true })}
        />
      )}
    </div>
  );
}

// ─── List View ────────────────────────────────────────────
export default function IncidentHistory({
  defaultIncident,
  onStartNew,
}: {
  defaultIncident?: Incident;
  onStartNew?: (name: string, type: "test" | "actual") => void;
}) {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    defaultIncident || null,
  );
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [regName, setRegName] = useState("");
  const [regType, setRegType] = useState<"test" | "actual">("test");
  const [regStartDate, setRegStartDate] = useState("");
  const [regStartTime, setRegStartTime] = useState("");
  const [regEndDate, setRegEndDate] = useState("");
  const [regEndTime, setRegEndTime] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);

  const fetchIncidents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("incidents")
      .select("*")
      .not("end_time", "is", null)
      .order("start_time", { ascending: false });

    if (error) {
      console.error("Error fetching incidents:", error);
    } else {
      setIncidents(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleSave = async () => {
    if (!regName || !regStartDate || !regStartTime || !regEndDate || !regEndTime) return;
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
      // Update existing
      const { error: updateError } = await supabase
        .from("incidents")
        .update(payload)
        .eq("id", editingIncident.id);
      error = updateError;
    } else {
      // Create new
      const { error: insertError } = await supabase
        .from("incidents")
        .insert(payload);
      error = insertError;
    }

    if (error) {
      console.error("Error saving event:", error);
    } else {
      resetForm();
      await fetchIncidents();
    }
    setSubmitting(false);
  };

  const resetForm = () => {
    setShowRegisterForm(false);
    setEditingIncident(null);
    setRegName("");
    setRegType("test");
    setRegStartDate("");
    setRegStartTime("");
    setRegEndDate("");
    setRegEndTime("");
  };

  const handleEdit = (incident: Incident) => {
    setEditingIncident(incident);
    setRegName(incident.name);
    setRegType(incident.type);

    // Parse UTC strings back to components for the inputs
    const startDate = new Date(incident.start_time);
    const endDate = incident.end_time ? new Date(incident.end_time) : new Date();

    // Format YYYY-MM-DD
    const formatDateInput = (d: Date) => {
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
    };

    // Format HH:MM
    const formatTimeInput = (d: Date) => {
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
    };

    setRegStartDate(formatDateInput(startDate));
    setRegStartTime(formatTimeInput(startDate));
    setRegEndDate(formatDateInput(endDate));
    setRegEndTime(formatTimeInput(endDate));

    setShowRegisterForm(true);
  };

  const handleDelete = async (incident: Incident) => {
    if (!window.confirm(`Are you sure you want to delete "${incident.name}"? This cannot be undone.`)) {
      return;
    }

    const { error } = await supabase
      .from("incidents")
      .delete()
      .eq("id", incident.id);

    if (error) {
      console.error("Error deleting incident:", error);
      alert("Failed to delete incident");
    } else {
      await fetchIncidents();
    }
  };

  // ── Detail View ───
  if (selectedIncident) {
    return (
      <IncidentDetail
        incident={selectedIncident}
        onBack={() => setSelectedIncident(null)}
        onStartNew={onStartNew}
      />
    );
  }

  // ── List View ─────
  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">
            Event History
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Browse past incidents and tests.
          </p>
        </div>
        {!showRegisterForm && (
          <button
            onClick={() => setShowRegisterForm(true)}
            className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2.5 rounded-lg font-medium shadow hover:bg-slate-800 transition-all text-sm"
          >
            <Plus className="w-4 h-4" />
            Register Past Event
          </button>
        )}
      </div>

      {/* Register/Edit Event Form */}
      {showRegisterForm && (
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
              onClick={resetForm}
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
              disabled={submitting || !regName || !regStartDate || !regStartTime || !regEndDate || !regEndTime}
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
              onClick={resetForm}
              className="px-4 py-2 rounded text-gray-600 hover:bg-gray-100 font-medium text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
        </div>
      )}

      {!loading && incidents.length === 0 && (
        <div className="glass-card p-12 text-center">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-1">
            No Past Events
          </h3>
          <p className="text-sm text-gray-400">
            Completed events will appear here. Start and end an event from the
            live dashboard to create a record.
          </p>
        </div>
      )}

      {!loading && incidents.length > 0 && (
        <div className="grid gap-3">
          {incidents.map((incident) => {
            const isTest = incident.type === "test";
            return (
              <button
                key={incident.id}
                onClick={() => setSelectedIncident(incident)}
                className="glass-card p-4 text-left w-full hover:shadow-md transition-all duration-200 group flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`p-2.5 rounded-xl ${
                      isTest
                        ? "bg-blue-50 text-blue-600"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {isTest ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">
                        {incident.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          isTest
                            ? "bg-blue-100 text-blue-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {incident.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDateShort(incident.start_time)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeShort(incident.start_time)} –{" "}
                        {incident.end_time
                          ? formatTimeShort(incident.end_time)
                          : "—"}
                      </span>
                      {incident.end_time && (
                        <span className="font-medium text-gray-400">
                          {formatDuration(
                            incident.start_time,
                            incident.end_time,
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
            <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(incident);
                    }}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(incident);
                    }}
                    className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
