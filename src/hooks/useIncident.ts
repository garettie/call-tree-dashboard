import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { localNowAsUTC } from "../lib/utils";
import type { Incident } from "../types";

export function useIncident() {
  const [activeIncident, setActiveIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);

  const checkActiveIncident = async () => {
    try {
      const { data } = await supabase
        .from("incidents")
        .select("*")
        .is("end_time", null)
        .maybeSingle();

      setActiveIncident(data);
    } catch (error) {
      console.error("Error checking incident:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkActiveIncident();

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
