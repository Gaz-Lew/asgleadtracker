import { NextResponse } from 'next/server';
import { updateLeadFields } from '../../../../lib/googleSheets';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    await updateLeadFields(params.id, body.fields);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating lead:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
