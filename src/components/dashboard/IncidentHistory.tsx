import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  BarChart3,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import {
  formatDateShort,
  formatDuration,
  formatTimeShort,
} from "../../lib/utils";
import type { Incident } from "../../types";
import IncidentDetail from "./IncidentDetail";
import RegisterIncidentForm from "./RegisterIncidentForm";

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

  const handleEdit = (incident: Incident) => {
    setEditingIncident(incident);
    setShowRegisterForm(true);
  };

  const handleFormSaved = async () => {
    setShowRegisterForm(false);
    setEditingIncident(null);
    await fetchIncidents();
  };

  const handleFormCancel = () => {
    setShowRegisterForm(false);
    setEditingIncident(null);
  };

  const handleDelete = async (incident: Incident) => {
    if (
      !window.confirm(
        `Are you sure you want to delete "${incident.name}"? This cannot be undone.`,
      )
    ) {
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

  if (selectedIncident) {
    return (
      <IncidentDetail
        incident={selectedIncident}
        onBack={() => setSelectedIncident(null)}
        onStartNew={onStartNew}
      />
    );
  }

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

      {showRegisterForm && (
        <RegisterIncidentForm
          editingIncident={editingIncident}
          onSaved={handleFormSaved}
          onCancel={handleFormCancel}
        />
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
