import { NextResponse } from 'next/server';
import { appendLeadNote } from '../../../../../lib/googleSheets';
import { format } from 'date-fns';

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { noteText, repName } = await request.json();
    
    if (!noteText) return NextResponse.json({ error: 'Note text required' }, { status: 400 });

    const timestamp = format(new Date(), 'dd/MM/yyyy HH:mm');
    const formattedNote = `${timestamp} - ${repName || 'Unknown Rep'}: ${noteText}`;

    await appendLeadNote(params.id, formattedNote);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error appending note:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
