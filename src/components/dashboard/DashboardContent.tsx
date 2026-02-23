import { useState, useMemo, useEffect, useCallback } from "react";
import { Filters } from "./Filters";
import { KPICard } from "./KPICard";
import { StatusDonut } from "./charts/StatusDonut";
import { ResponseDonut } from "./charts/ResponseDonut";
import { ResponseTimeline } from "./charts/ResponseTimeline";
import { DemographicChart } from "./charts/DemographicChart";
import { ResponsesTable } from "./tables/ResponsesTable";
import { UnknownTable, PendingTable } from "./tables/AuxiliaryTables";
import { COLORS } from "../../lib/constants";
import type { DashboardData } from "../../types";

interface DashboardContentProps {
  data: DashboardData;
  storageKey?: string; // If provided, persists filters to localStorage (for IncidentHistory)
  onRefresh?: () => void;
}

interface FilterState {
  departments: string[];
  locations: string[];
  levels: string[];
  statuses: string[];
}

export function DashboardContent({
  data,
  storageKey,
  onRefresh,
}: DashboardContentProps) {
  const [filters, setFilters] = useState<FilterState>(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          return JSON.parse(saved) as FilterState;
        }
      } catch {
        // ignore error, fall back to default
      }
    }
    return {
      departments: [],
      locations: [],
      levels: [],
      statuses: [],
    };
  });

  const [filtersInitialized, setFiltersInitialized] = useState(() => {
    if (storageKey) {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          return true;
        }
      } catch {
        // ignore
      }
    }
    return false;
  });

  const handleFilterChange = useCallback(
    (type: keyof typeof filters, value: string[]) => {
      setFilters((prev) => {
        const next = { ...prev, [type]: value };
        if (storageKey) {
          localStorage.setItem(storageKey, JSON.stringify(next));
        }
        return next;
      });
    },
    [storageKey],
  );

  useEffect(() => {
    if (data.contacts.length > 0 && !filtersInitialized) {
      const activeDepts = new Set<string>();
      data.contacts.forEach((c) => {
        if (c.status !== "No Response" && c.department) {
          activeDepts.add(c.department);
        }
      });

      if (activeDepts.size > 0) {
        const nextFilters = {
          departments: Array.from(activeDepts),
          locations: [] as string[],
          levels: [] as string[],
          statuses: [] as string[],
        };
        setFilters((prev) => ({
          ...prev,
          departments: Array.from(activeDepts),
        }));

        if (storageKey) {
          localStorage.setItem(storageKey, JSON.stringify(nextFilters));
        }
      }
      setFiltersInitialized(true);
    }
  }, [data.contacts, filtersInitialized, storageKey]);

  const filteredData = useMemo(() => {
    return data.contacts.filter((c) => {
      if (
        filters.departments.length > 0 &&
        !filters.departments.includes(c.department)
      )
        return false;
      if (
        filters.locations.length > 0 &&
        !filters.locations.includes(c.location)
      )
        return false;
      if (
        filters.levels.length > 0 &&
        !filters.levels.includes(c.level || c.position)
      )
        return false;
      if (filters.statuses.length > 0 && !filters.statuses.includes(c.status))
        return false;
      return true;
    });
  }, [data.contacts, filters]);

  const stats = useMemo(() => {
    const total = filteredData.length;
    const responded = filteredData.filter(
      (c) => c.status !== "No Response",
    ).length;
    const safe = filteredData.filter((c) => c.status === "Safe").length;
    const slight = filteredData.filter((c) => c.status === "Slight").length;
    const moderate = filteredData.filter((c) => c.status === "Moderate").length;
    const severe = filteredData.filter((c) => c.status === "Severe").length;
    const affected = slight + moderate + severe;
    const pending = filteredData.filter(
      (c) => c.status === "No Response",
    ).length;

    return {
      total,
      responded,
      safe,
      affected,
      slight,
      moderate,
      severe,
      pending,
    };
  }, [filteredData]);

  return (
    <div className="animate-in fade-in duration-500">
      <Filters
        data={data.contacts}
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* KPI Grid */}
      {(() => {
        const respondedStatuses = ["Safe", "Slight", "Moderate", "Severe"];
        const affectedStatuses = ["Slight", "Moderate", "Severe"];

        const isRespondedActive =
          filters.statuses.length === respondedStatuses.length &&
          respondedStatuses.every((s) => filters.statuses.includes(s));
        const isSafeActive =
          filters.statuses.length === 1 && filters.statuses.includes("Safe");
        const isAffectedActive =
          filters.statuses.length === affectedStatuses.length &&
          affectedStatuses.every((s) => filters.statuses.includes(s));
        const isPendingActive =
          filters.statuses.length === 1 &&
          filters.statuses.includes("No Response");

        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <KPICard
              label="Total Contacts"
              value={stats.total.toLocaleString()}
              subtext={`${data.contacts.length} in DB`}
              color={COLORS["No Response"]}
              onClick={() => handleFilterChange("statuses", [])}
              isActive={filters.statuses.length === 0}
            />
            <KPICard
              label="Responded"
              value={stats.responded.toLocaleString()}
              subtext={
                stats.total > 0
                  ? `${Math.round((stats.responded / stats.total) * 100)}% response rate`
                  : "0%"
              }
              color={COLORS.Primary}
              onClick={() =>
                handleFilterChange(
                  "statuses",
                  isRespondedActive ? [] : respondedStatuses,
                )
              }
              isActive={isRespondedActive}
            />
            <KPICard
              label="Safe"
              value={stats.safe.toLocaleString()}
              subtext={
                stats.responded > 0
                  ? `${Math.round((stats.safe / stats.responded) * 100)}% of responders`
                  : "0%"
              }
              color={COLORS.Safe}
              onClick={() =>
                handleFilterChange("statuses", isSafeActive ? [] : ["Safe"])
              }
              isActive={isSafeActive}
            />
            <KPICard
              label="Affected"
              value={stats.affected.toLocaleString()}
              subtext={
                stats.responded > 0
                  ? `${Math.round((stats.severe / stats.responded) * 100)}% Severe`
                  : "0%"
              }
              color={COLORS.Slight}
              onClick={() =>
                handleFilterChange(
                  "statuses",
                  isAffectedActive ? [] : affectedStatuses,
                )
              }
              isActive={isAffectedActive}
            />
            <KPICard
              label="Pending"
              value={stats.pending.toLocaleString()}
              subtext={
                stats.total > 0
                  ? `${Math.round((stats.pending / stats.total) * 100)}% awaiting`
                  : "0%"
              }
              color={COLORS.Moderate}
              onClick={() =>
                handleFilterChange(
                  "statuses",
                  isPendingActive ? [] : ["No Response"],
                )
              }
              isActive={isPendingActive}
            />
          </div>
        );
      })()}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <StatusDonut data={filteredData} />
        <ResponseDonut responded={stats.responded} total={stats.total} />
        <ResponseTimeline data={filteredData} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <DemographicChart
          data={filteredData}
          category="department"
          title="Department"
        />
        <DemographicChart
          data={filteredData}
          category="location"
          title="Location"
        />
      </div>

      {/* Main Table */}
      <div className="mb-8">
        <ResponsesTable
          data={filteredData.filter((c) => c.status !== "No Response")}
        />
      </div>

      {/* Auxiliary Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UnknownTable data={data.unknownResponses} />
        <PendingTable
          data={filteredData.filter((c) => c.status === "No Response")}
          onResponseAdded={() => {
            if (onRefresh) {
              onRefresh();
            } else {
              console.warn(
                "Manual response added, but no refresh handler provided. Data may be stale until next auto-refresh.",
              );
            }
          }}
        />
      </div>
    </div>
  );
}
