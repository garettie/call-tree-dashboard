import { useState } from "react";
import { Plus, CheckCircle2, AlertTriangle, Play } from "lucide-react";

interface StartIncidentFormProps {
  onStart: (name: string, type: "test" | "actual") => void;
  onCancel: () => void;
}

export function StartIncidentForm({ onStart, onCancel }: StartIncidentFormProps) {
  const [name, setName] = useState("");
  const [type, setType] = useState<"test" | "actual">("test");

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 max-w-md animate-in fade-in zoom-in duration-200 w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
          <Plus className="w-5 h-5 text-slate-500" />
          Initialize Event
        </h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
            Event Name
          </label>
          <input
            autoFocus
            type="text"
            placeholder="e.g. Super Typhoon Test..."
            className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase text-gray-500 mb-2">
            Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setType("test")}
              className={`p-3 rounded border text-sm font-medium transition-all flex flex-col items-center gap-2 ${
                type === "test"
                  ? "bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500"
                  : "border-gray-200 hover:bg-gray-50 text-gray-600"
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              TEST
            </button>
            <button
              onClick={() => setType("actual")}
              className={`p-3 rounded border text-sm font-medium transition-all flex flex-col items-center gap-2 ${
                type === "actual"
                  ? "bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500"
                  : "border-gray-200 hover:bg-gray-50 text-gray-600"
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
              ACTUAL
            </button>
          </div>
        </div>

        <div className="flex gap-3 mt-6 pt-2 border-t border-gray-100">
          <button
            onClick={() => onStart(name, type)}
            disabled={!name.trim()}
            className="flex-1 bg-slate-900 text-white px-4 py-2 rounded hover:bg-slate-800 font-medium flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-900"
          >
            <Play className="w-4 h-4" />
            Start
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded text-gray-600 hover:bg-gray-100 font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
