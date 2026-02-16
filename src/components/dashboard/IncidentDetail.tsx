import { useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
} from "lucide-react";
import { StartIncidentForm } from "./StartIncidentForm";
import { useDashboardData } from "../../hooks/useDashboardData";
import { DashboardContent } from "./DashboardContent";
import {
  formatDateShort,
  formatDuration,
  formatTimeShort,
} from "../../lib/utils";
import type { Incident } from "../../types";

export default function IncidentDetail({
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
          isTest ? "bg-blue-50 border-blue-500" : "bg-red-50 border-red-500"
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
