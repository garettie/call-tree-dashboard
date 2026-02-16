export interface Contact {
  id?: string;
  number: string;
  name: string;
  department: string;
  location: string;
  position: string;
  level?: string; // Optional as per python script logic
}

export interface Response {
  id?: string;
  uid?: string; // [CHANGE] Added based on failure report (manual entries need this)
  contact: string;
  contents: string;
  datetime: string;
}

export type Status = "Safe" | "Slight" | "Moderate" | "Severe" | "No Response";

export interface ProcessedContact extends Contact {
  status: Status;
  responseContent?: string;
  responseTime?: string;
  matchType?: "phone" | "name" | "manual";
  cleanNumber: string;
}

export interface DashboardData {
  contacts: ProcessedContact[];
  unknownResponses: Response[];
  lastUpdated: Date;
}

export interface Incident {
  id: number;
  name: string;
  type: "test" | "actual";
  start_time: string;
  end_time: string | null;
}
