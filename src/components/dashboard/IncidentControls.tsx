import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Play,
  Square,
  History,
} from "lucide-react";
import type { Incident } from "../../types";
import { StartIncidentForm } from "./StartIncidentForm";

interface IncidentControlsProps {
  activeIncident: Incident | null;
  onStart: (name: string, type: "test" | "actual") => void;
  onEnd: () => void;
}

export default function IncidentControls({
  activeIncident,
  onStart,
  onEnd,
}: IncidentControlsProps) {
  const [showModal, setShowModal] = useState(false);

  if (activeIncident) {
    const isTest = activeIncident.type === "test";

    return (
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
              className={`text-lg font-bold flex items-center gap-2 ${isTest ? "text-blue-900" : "text-red-900"}`}
            >
              {isTest ? "ACTIVE CALL TREE" : "ACTUAL INCIDENT IN PROGRESS"}
            </h2>
            <p className="text-sm opacity-75 text-gray-700 flex items-center gap-2">
              <History className="w-4 h-4" />
              Started:{" "}
              {new Date(activeIncident.start_time).toLocaleTimeString([], {
                timeZone: "UTC",
              })}
              — "{activeIncident.name}"
            </p>
          </div>
        </div>

        <button
          onClick={onEnd}
          className="flex items-center gap-2 bg-white border border-gray-300 px-4 py-2 rounded shadow-sm text-sm font-bold hover:bg-gray-50 text-red-600 transition-colors"
        >
          <Square className="w-4 h-4 fill-current" />
          End Event
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6">
      {!showModal ? (
        <button
          onClick={() => setShowModal(true)}
          className="bg-slate-900 text-white px-5 py-2.5 rounded-lg font-medium shadow hover:bg-slate-800 transition-all flex items-center gap-2"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Start New Event</span>
        </button>
      ) : (
        <div>
          <StartIncidentForm
            onStart={(name, type) => {
              onStart(name, type);
              setShowModal(false);
            }}
            onCancel={() => setShowModal(false)}
          />
        </div>
      )}
    </div>
  );
}
