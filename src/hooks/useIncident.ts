import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { localNowAsUTC } from "../lib/utils";
import type { Incident } from "../types";

export function useIncident() {
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);

  // --- MOVED THIS UP (Define it before using it) ---
  const checkActiveIncident = async () => {
    try {
      const { data } = await supabase
        .from("incidents")
        .select("*")
        .is("end_time", null)
        .maybeSingle(); // Use maybeSingle() instead of single() to avoid 406 errors if 0 rows exist

      setActiveIncident(data);
    } catch (error) {
      console.error("Error checking incident:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- NOW we can use it ---
  useEffect(() => {
    checkActiveIncident();

    // Auto-update if someone else starts an incident
    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "incidents" },
        () => {
          checkActiveIncident();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const startIncident = async (name: string, type: "test" | "actual") => {
    const { data, error } = await supabase
      .from("incidents")
      .insert({ name, type, start_time: localNowAsUTC() })
      .select()
      .single();

    if (data) setActiveIncident(data);
    if (error) console.error("Error starting:", error);
  };

  const endIncident = async () => {
    if (!activeIncident) return;
    await supabase
      .from("incidents")
      .update({ end_time: localNowAsUTC() })
      .eq("id", activeIncident.id);
    setActiveIncident(null);
  };

  return { activeIncident, startIncident, endIncident, loading };
}
