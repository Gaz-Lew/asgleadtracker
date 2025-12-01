export interface Lead {
  LeadID: string;
  Date: string;           // "YYYY-MM-DD"
  LeadName: string;
  Address: string;
  ContactNumber: string;
  Notes: string;
  Called: boolean;
  RenterOwner: 'Renter' | 'Owner' | '';
  Superannuation: string;
  RepName: string;
  LeadStatus: string;
  CallTimestamp: string;  // "YYYY-MM-DD HH:mm:ss"
  CallResult: string;
  LastUpdated: string;    // "YYYY-MM-DD HH:mm:ss"
  ReminderDateTime?: string; // e.g., "2024-12-25T10:30"
  ReminderNote?: string;
}

export type LeadUpdatePayload = Partial<Lead>;

export interface NotePayload {
  noteText: string;
  repName: string;
}

export type OfflineAction =
  | { type: 'UPDATE_LEAD'; payload: { id: string; fields: Partial<Lead> } }
  | { type: 'ADD_NOTE'; payload: { id: string; noteText: string; repName: string } };
