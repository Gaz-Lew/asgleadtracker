import { NextResponse } from 'next/server';
import { getAllLeads } from '../../../lib/googleSheets';

export const dynamic = 'force-dynamic'; // Prevent caching

export async function GET() {
  try {
    const leads = await getAllLeads();
    return NextResponse.json(leads);
  } catch (error: any) {
    console.error('Error fetching leads:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
