import { NextResponse } from 'next/server';
import { getAllLeads } from '../../../../lib/googleSheets';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const leads = await getAllLeads();
    
    const headers = [
      'LeadID', 'Date', 'LeadName', 'Address', 'ContactNumber', 
      'LeadStatus', 'RenterOwner', 'Superannuation', 'RepName', 
      'Called', 'CallResult', 'LastUpdated', 'Notes'
    ];

    const csvRows = [headers.join(',')];

    leads.forEach(lead => {
      const values = headers.map(header => {
        const val = (lead as any)[header] || '';
        const escaped = String(val).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    });

    const csvData = csvRows.join('\n');

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="leads_export_${Date.now()}.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
