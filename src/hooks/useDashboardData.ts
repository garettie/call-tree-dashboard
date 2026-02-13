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
  return String(num).replace(/[\s\-\+\(\)]/g, "");
};



// Helper to extract status and potential name from response
const parseResponse = (content: string): { status: Status; name: string } => {
  if (!content) return { status: "No Response", name: "" };
  
  // 1. Split by whitespace to get tokens
  const tokens = content.trim().split(/\s+/);
  
  // 2. Find the *first* token that matches a known status
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

  // 3. If found, remove that token and treat the rest as the name
  if (foundStatus !== null && statusIndex !== -1) {
    // Remove the status token
    const nameTokens = [...tokens];
    nameTokens.splice(statusIndex, 1);
    
    // Join back and clean up any leftover punctuation that might have been adjacent
    // e.g. "John - 2" -> "John -" -> "John"
    // e.g. "2, John" -> ", John" -> "John"
    let name = nameTokens.join(" ");
    
    // Remove leading/trailing non-alphanumeric characters (punctuation)
    name = name.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, "");
    
    return { status: foundStatus, name };
  }
  
  // If no status found, return as is with "No Response"
  return { status: "No Response", name: content.trim() }; 
};

// Fuzzy name matching
const findContactByName = (searchName: string, contacts: ProcessedContact[]): ProcessedContact | null => {
  if (!searchName || searchName.length < 2) return null;
  
  // Clean punctuation from search tokens (e.g. "C." -> "c")
  const searchTokens = searchName.toLowerCase().split(/\s+/).map(t => t.replace(/[^a-z0-9]/g, "")).filter(t => t.length > 0);
  if (searchTokens.length === 0) return null;

  // Try to find a contact where ALL search tokens match at least one part of the contact's name
  const matches = contacts.filter(contact => {
    const contactNameParts = contact.name.toLowerCase().split(/\s+/).map(t => t.replace(/[^a-z0-9]/g, ""));
    
    return searchTokens.every(sToken => {
      // Check if this search token matches ANY part of the contact name
      return contactNameParts.some(cToken => {
        // If single letter (initial), check startsWith
        if (sToken.length === 1) {
          return cToken.startsWith(sToken);
        }
        // [CHANGE] Use startsWith for stricter matching (e.g. "Dan" shouldn't match "Jordan")
        // But "Dan" should match "Daniel"
        return cToken.startsWith(sToken);
      });
    });
  });

  // [CHANGE] Ambiguity check: if multiple contacts match, return null to be safe
  if (matches.length > 1) {
    console.warn(`Ambiguous name match for "${searchName}". Found ${matches.length} contacts.`);
    return null;
  }

  // Return the single valid match
  return matches.length === 1 ? matches[0] : null;
};

// [CHANGE 1] Accept startDate and endDate as arguments (optional)
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

        // [CHANGE 2] Modified fetchAll to accept a date filter
        const fetchAll = async (
          table: string,
          orderBy?: string,
          minDate?: string,
          maxDate?: string,
        ) => {
          let allData: any[] = [];
          let from = 0;
          const step = 1000;
          while (true) {
            let query = supabase.from(table).select("*");

            if (orderBy) {
              query = query.order(orderBy, { ascending: false });
            }

            // [CHANGE 3] Apply the date filter if it exists (Only for Responses)
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

        // 1. Fetch Contacts (ALWAYS fetch all of them, no date filter)
        const contactsData = await fetchAll("MasterContacts");

        // 2. Fetch Responses (ONLY fetch those after startDate)
        // We pass the startDate here to filter out old "Safe" messages from previous drills
        const responsesData = await fetchAll(
          "Responses",
          "datetime",
          startDate,
          endDate,
        );

        const contacts = (contactsData || []) as Contact[];
        const responses = (responsesData || []) as Response[];

        // --- The rest of your logic remains exactly the same ---

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
          let matchedContactCleanNumber = knownNumbers.has(cleanParams) ? cleanParams : null;

          // If not matched by number, try matching by name
          if (!matchedContactCleanNumber) {
            const { status, name } = parseResponse(r.contents);
            // Only try name match if we found a valid status and have a name
            if (status !== "No Response" && name) {
              const matchedContact = findContactByName(name, processedContacts);
              if (matchedContact) {
                matchedContactCleanNumber = matchedContact.cleanNumber;
                // Update the contact's status immediately since we have it from parseResponse
                // But we'll let the merging logic handle it if we push to responseMap 
                // Wait, responseMap is keyed by number.
                // We should use the CONTACT'S number as the key in responseMap
              }
            }
          }

          // If we found a matching contact (either by number or name)
          if (matchedContactCleanNumber) {
            // Since responses are sorted by desc date (newest first),
            // the first time we see a number (or matched contact), that is their latest response.
            if (!responseMap.has(matchedContactCleanNumber)) {
              responseMap.set(matchedContactCleanNumber, r);
            }
          } else {
            unknownResponses.push(r);
          }
        });

        // Merge response data into contacts
        processedContacts.forEach((c) => {
          const resp = responseMap.get(c.cleanNumber);
          if (resp) {
            // We re-parse here to ensure we get the status correctly even if it has a name after it
            const { status } = parseResponse(resp.contents);
            c.status = status;
            c.responseContent = resp.contents;
            c.responseTime = resp.datetime;
          }
        });

        setData({
          contacts: processedContacts,
          unknownResponses,
          lastUpdated: new Date(),
        });
      } catch (err: any) {
        console.error("Error fetching dashboard data:", err);
        setError(err.message || "Failed to fetch data");
      } finally {
        if (!options?.background) {
          setLoading(false);
        }
      }
    },
    [startDate, endDate],
  ); // [CHANGE 4] Add startDate/endDate to dependency array so it re-runs when you switch incidents

  // [CHANGE] Use a ref for fetchData so we can use it in the effect without adding it to the dependency array
  // This prevents the Realtime subscription from breaking/re-connecting whenever fetchData changes identity
  const fetchDataRef = useRef(fetchData);
  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  useEffect(() => {
    // Initial fetch
    fetchDataRef.current();
    
    const interval = setInterval(() => fetchDataRef.current({ background: true }), 60000); // Auto-refresh every 60s
    
    // [REMOVED] Realtime Subscription (Not available for user)
    // We rely on manual refresh (onResponseAdded) and the 60s interval below

    return () => {
      clearInterval(interval);
    };
  }, []); // Empty dependency array = Run once on mount

  return { data, loading, error, refresh: fetchData };
};
