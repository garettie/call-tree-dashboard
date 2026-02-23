import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import type {
  Contact,
  Response,
  DashboardData,
  ProcessedContact,
  Status,
} from "../types";

const STATUS_MAPPING: Record<string, Status> = {
  "1": "Safe",
  "1.0": "Safe",
  safe: "Safe",
  unaffected: "Safe",
  ok: "Safe",
  "2": "Slight",
  "2.0": "Slight",
  slight: "Slight",
  minor: "Slight",
  "3": "Moderate",
  "3.0": "Moderate",
  moderate: "Moderate",
  "4": "Severe",
  "4.0": "Severe",
  severe: "Severe",
  help: "Severe",
  critical: "Severe",
};

const cleanNumber = (num: string | number): string => {
  if (!num) return "";
  return String(num).replace(/[\s\-+()]/g, "");
};

// Helper to extract status and potential name from response
const parseResponse = (content: string): { status: Status; name: string } => {
  if (!content) return { status: "No Response", name: "" };

  const tokens = content.trim().split(/\s+/);
  let foundStatus: Status | null = null;
  let statusIndex = -1;

  for (let i = 0; i < tokens.length; i++) {
    // Clean punctuation from token to check for status (e.g. "2," -> "2")
    const cleanToken = tokens[i].replace(/[^\w\s]/g, "").toLowerCase();

    if (STATUS_MAPPING[cleanToken]) {
      foundStatus = STATUS_MAPPING[cleanToken];
      statusIndex = i;
      break;
    }
  }

  if (foundStatus !== null && statusIndex !== -1) {
    const nameTokens = [...tokens];
    nameTokens.splice(statusIndex, 1);
    let name = nameTokens.join(" ");
    name = name.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "");
    return { status: foundStatus, name };
  }

  return { status: "No Response", name: content.trim() };
};

const findContactByName = (
  searchName: string,
  contacts: ProcessedContact[],
): ProcessedContact | null => {
  if (!searchName || searchName.length < 2) return null;

  const searchTokens = searchName
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.replace(/[^a-z0-9]/g, ""))
    .filter((t) => t.length > 0);
  if (searchTokens.length === 0) return null;

  const matches = contacts.filter((contact) => {
    const contactNameParts = contact.name
      .toLowerCase()
      .split(/\s+/)
      .map((t) => t.replace(/[^a-z0-9]/g, ""));

    return searchTokens.every((sToken) => {
      return contactNameParts.some((cToken) => {
        if (sToken.length === 1) {
          return cToken.startsWith(sToken);
        }
        return cToken.startsWith(sToken);
      });
    });
  });

  if (matches.length > 1) {
    console.warn(
      `Ambiguous name match for "${searchName}". Found ${matches.length} contacts.`,
    );
    return null;
  }

  return matches.length === 1 ? matches[0] : null;
};

export const useDashboardData = (startDate?: string, endDate?: string) => {
  const [data, setData] = useState<DashboardData>({
    contacts: [],
    unknownResponses: [],
    lastUpdated: new Date(),
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(
    async (options?: { background?: boolean }) => {
      try {
        if (!options?.background) {
          setLoading(true);
        }
        setError(null);

        const fetchAll = async (
          table: string,
          orderBy?: string,
          minDate?: string,
          maxDate?: string,
        ): Promise<Record<string, unknown>[]> => {
          let allData: Record<string, unknown>[] = [];
          let from = 0;
          const step = 1000;
          while (true) {
            let query = supabase.from(table).select("*");

            if (orderBy) {
              query = query.order(orderBy, { ascending: false });
            }

            if (minDate) {
              query = query.gte("datetime", minDate);
            }
            if (maxDate) {
              query = query.lte("datetime", maxDate);
            }

            const { data, error } = await query.range(from, from + step - 1);

            if (error) throw error;
            if (!data || data.length === 0) break;
            allData = [...allData, ...data];
            if (data.length < step) break;
            from += step;
          }
          return allData;
        };

        // 1. Fetch Contacts
        const contactsData = await fetchAll("MasterContacts");

        // 2. Fetch Responses
        // We pass the startDate here to filter out old "Safe" messages from previous drills
        const responsesData = await fetchAll(
          "Responses",
          "datetime",
          startDate,
          endDate,
        );

        const contacts = (contactsData || []) as unknown as Contact[];
        const responses = (responsesData || []) as unknown as Response[];

        // Process Data
        const processedContacts: ProcessedContact[] = contacts.map((c) => ({
          ...c,
          cleanNumber: cleanNumber(c.number),
          status: "No Response", // Default status
        }));

        const knownNumbers = new Set(
          processedContacts.map((c) => c.cleanNumber),
        );
        const unknownResponses: Response[] = [];
        const responseMap = new Map<string, Response>(); // To store ONLY the latest response

        // Filter responses to find latest per contact and separate unknowns
        responses.forEach((r) => {
          const cleanParams = cleanNumber(r.contact);
          let matchedContactCleanNumber = knownNumbers.has(cleanParams)
            ? cleanParams
            : null;
          let matchType: "phone" | "name" | "manual" | undefined = undefined;

          if (matchedContactCleanNumber) {
            matchType = "phone";
          }

          // If not matched by number, try matching by name
          if (!matchedContactCleanNumber) {
            const { status, name } = parseResponse(r.contents);
            // Only try name match if we found a valid status and have a name
            if (status !== "No Response" && name) {
              const matchedContact = findContactByName(name, processedContacts);
              if (matchedContact) {
                matchedContactCleanNumber = matchedContact.cleanNumber;
                matchType = "name";
              }
            }
          }

          if (r.contents.toLowerCase().includes("manual entry")) {
            matchType = "manual";
          }

          if (matchedContactCleanNumber) {
            if (!responseMap.has(matchedContactCleanNumber)) {
              const boostedResponse = { ...r, matchType } as Response & {
                matchType: "phone" | "name" | "manual";
              };
              responseMap.set(matchedContactCleanNumber, boostedResponse);
            }
          } else {
            unknownResponses.push(r);
          }
        });

        // Merge response data into contacts
        processedContacts.forEach((c) => {
          const resp = responseMap.get(c.cleanNumber) as
            | (Response & { matchType?: "phone" | "name" | "manual" })
            | undefined;
          if (resp) {
            // We re-parse here to ensure we get the status correctly even if it has a name after it
            const { status } = parseResponse(resp.contents);
            c.status = status;
            c.responseContent = resp.contents;
            c.responseTime = resp.datetime;

            // Allow matchType to flow through (phone or name)
            // We removed the 'manual' override because it was hiding the matching method info
            // and seemingly firing for non-manual responses too.
            c.matchType = resp.matchType;
          }
        });

        setData({
          contacts: processedContacts,
          unknownResponses,
          lastUpdated: new Date(),
        });
      } catch (err: unknown) {
        console.error("Error fetching dashboard data:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch data");
      } finally {
        if (!options?.background) {
          setLoading(false);
        }
      }
    },
    [startDate, endDate],
  );

  const fetchDataRef = useRef(fetchData);
  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  useEffect(() => {
    // Initial fetch
    fetchDataRef.current();

    const interval = setInterval(
      () => fetchDataRef.current({ background: true }),
      60000,
    ); // Auto-refresh every 60s

    return () => {
      clearInterval(interval);
    };
  }, []); // Empty dependency array = Run once on mount

  return { data, loading, error, refresh: fetchData };
};
