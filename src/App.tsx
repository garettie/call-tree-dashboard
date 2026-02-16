import { useState, useMemo, useEffect } from "react";
import { DashboardHeader } from "./components/dashboard/DashboardHeader";
import { DashboardContent } from "./components/dashboard/DashboardContent";
import { useDashboardData } from "./hooks/useDashboardData";
import { supabase } from "./lib/supabase";
import { localNowAsUTC } from "./lib/utils";
import { useIncident } from "./hooks/useIncident";
import IncidentControls from "./components/dashboard/IncidentControls";
import IncidentHistory from "./components/dashboard/IncidentHistory";
import type { Incident } from "./types";

function App() {
  // View state: "live" = real-time dashboard, "history" = past incidents archive
  const [view, setView] = useState<"live" | "history">("live");
  const [defaultIncident, setDefaultIncident] = useState<Incident | undefined>(undefined);

  // Initialize Incident Logic
  const { activeIncident, loading: incidentLoading, startIncident, endIncident } = useIncident();

  // Effect: Set default view to Latest Incident if no active incident
  useEffect(() => {
    const checkDefault = async () => {
      // Only proceed if incident loading is done and there is NO active incident
      if (!incidentLoading && !activeIncident) {
        const { data } = await supabase
          .from("incidents")
          .select("*")
          .not("end_time", "is", null)
          .order("start_time", { ascending: false })
          .limit(1)
          .single();

        if (data) {
          setDefaultIncident(data);
          setView("history");
        }
      }
    };
    checkDefault();
  }, [incidentLoading, activeIncident]);

  // Decide the "Cut-off Date" for data
  const filterDate = useMemo(() => {
    if (activeIncident) {
      return activeIncident.start_time;
    }
    // Default: 24 hours ago (formatted as local time in UTC to match Termux)
    return localNowAsUTC(new Date(Date.now() - 24 * 60 * 60 * 1000));
  }, [activeIncident]);

  const { data, loading, error, refresh } = useDashboardData(filterDate);

  if (error) {
    return <div className="p-8 text-center text-red-600">Error: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pb-12">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <DashboardHeader
          lastUpdated={data.lastUpdated}
          onRefresh={refresh}
          loading={loading}
          view={view}
          onViewChange={(v) => {
            setView(v);
            setDefaultIncident(undefined);
          }}
        />

        {/* Conditionally render live dashboard or history view */}
        {view === "history" ? (
          <IncidentHistory
            defaultIncident={defaultIncident}
            onStartNew={async (name, type) => {
              await startIncident(name, type);
              setView("live");
              setDefaultIncident(undefined);
            }}
          />
        ) : (
          <>
            <IncidentControls
              activeIncident={activeIncident}
              onStart={startIncident}
              onEnd={endIncident}
            />

            <DashboardContent 
              data={data} 
              onRefresh={() => refresh({ background: true })}
            />
          </>
        )}
      </div>
    </div>
  );
}

export default App;
