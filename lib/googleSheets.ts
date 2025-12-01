import { google } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';
import { Lead } from '@/types';
import { format } from 'date-fns';

// Environment variable validation
const SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const PRIVATE_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n');
const SPREADSHEET_ID = process.env.LEADS_SPREADSHEET_ID;
const SHEET_NAME = process.env.LEADS_SHEET_NAME || 'LEADS';

if (!SERVICE_ACCOUNT_EMAIL || !PRIVATE_KEY || !SPREADSHEET_ID) {
  throw new Error('Missing Google Sheets Environment Variables');
}

const auth = new google.auth.JWT(
  SERVICE_ACCOUNT_EMAIL,
  undefined,
  PRIVATE_KEY,
  ['https://www.googleapis.com/auth/spreadsheets']
);

const sheets = google.sheets({ version: 'v4', auth });

// Column Order (0-based): 
// 0:Date, 1:LeadName, 2:Address, 3:ContactNumber, 4:Notes, 5:Called, 
// 6:RenterOwner, 7:Superannuation, 8:RepName, 9:LeadStatus, 
// 10:CallTimestamp, 11:CallResult, 12:LeadID, 13:LastUpdated

export async function getAllLeads(): Promise<Lead[]> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A2:N`, // Skip header row
  });

  const rows = response.data.values || [];
  const leads: Lead[] = [];
  const rowsToUpdate: { index: number; leadId: string }[] = [];

  rows.forEach((row, index) => {
    // Pad row if it's shorter than expected
    const paddedRow = [...row, ...Array(14 - row.length).fill('')];
    
    let leadId = paddedRow[12];

    // Generate UUID if missing
    if (!leadId) {
      leadId = uuidv4();
      rowsToUpdate.push({ index: index + 2, leadId }); // +2 for 1-based index & header skip
    }

    leads.push({
      Date: paddedRow[0] || '',
      LeadName: paddedRow[1] || '',
      Address: paddedRow[2] || '',
      ContactNumber: paddedRow[3] || '',
      Notes: paddedRow[4] || '',
      Called: paddedRow[5] === 'TRUE',
      RenterOwner: (paddedRow[6] as any) || '',
      Superannuation: paddedRow[7] || '',
      RepName: paddedRow[8] || '',
      LeadStatus: paddedRow[9] || 'New',
      CallTimestamp: paddedRow[10] || '',
      CallResult: paddedRow[11] || '',
      LeadID: leadId,
      LastUpdated: paddedRow[13] || '',
    });
  });

  // Async update for missing IDs (Fire and forget style)
  if (rowsToUpdate.length > 0) {
    Promise.all(rowsToUpdate.map(item => 
      sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!M${item.index}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[item.leadId]] }
      })
    )).catch(console.error);
  }

  return leads;
}

// Helper to find row number by LeadID
async function findRowIndexByLeadID(leadId: string): Promise<number | null> {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!M2:M`, // Search LeadID column
  });
  
  const rows = response.data.values;
  if (!rows) return null;

  const relativeIndex = rows.findIndex(row => row[0] === leadId);
  return relativeIndex === -1 ? null : relativeIndex + 2; // +2 for header and 0-index
}

export async function updateLeadFields(leadId: string, fields: Partial<Lead>): Promise<void> {
  const rowIndex = await findRowIndexByLeadID(leadId);
  if (!rowIndex) throw new Error('Lead not found');

  const updates = [];
  const now = format(new Date(), 'yyyy-MM-dd HH:mm:ss');

  const pushUpdate = (colLetter: string, val: any) => {
    updates.push({
      range: `${SHEET_NAME}!${colLetter}${rowIndex}`,
      values: [[val]]
    });
  };

  // Map fields to columns
  if (fields.Date !== undefined) pushUpdate('A', fields.Date);
  if (fields.LeadName !== undefined) pushUpdate('B', fields.LeadName);
  if (fields.Address !== undefined) pushUpdate('C', fields.Address);
  if (fields.ContactNumber !== undefined) pushUpdate('D', fields.ContactNumber);
  if (fields.Notes !== undefined) pushUpdate('E', fields.Notes);
  if (fields.Called !== undefined) pushUpdate('F', fields.Called);
  if (fields.RenterOwner !== undefined) pushUpdate('G', fields.RenterOwner);
  if (fields.Superannuation !== undefined) pushUpdate('H', fields.Superannuation);
  if (fields.RepName !== undefined) pushUpdate('I', fields.RepName);
  if (fields.LeadStatus !== undefined) pushUpdate('J', fields.LeadStatus);
  if (fields.CallTimestamp !== undefined) pushUpdate('K', fields.CallTimestamp);
  if (fields.CallResult !== undefined) pushUpdate('L', fields.CallResult);
  
  // Always update LastUpdated
  pushUpdate('N', now);

  if (updates.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: updates
      }
    });
  }
}

export async function appendLeadNote(leadId: string, formattedNote: string): Promise<void> {
  const rowIndex = await findRowIndexByLeadID(leadId);
  if (!rowIndex) throw new Error('Lead not found');

  const current = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!E${rowIndex}`
  });

  const existingNotes = current.data.values?.[0]?.[0] || '';
  const separator = existingNotes ? '\n\n' : '';
  const newNotes = `${formattedNote}${separator}${existingNotes}`; // Prepend latest note

  const now = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
  
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: [
        { range: `${SHEET_NAME}!E${rowIndex}`, values: [[newNotes]] },
        { range: `${SHEET_NAME}!N${rowIndex}`, values: [[now]] }
      ]
    }
  });
}