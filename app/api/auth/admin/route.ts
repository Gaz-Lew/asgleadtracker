import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { email, password } = await request.json();

  const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
  const ADMIN_PASS = process.env.ADMIN_PASSWORD_HASH; 

  if (email === ADMIN_EMAIL && password === ADMIN_PASS) {
    return NextResponse.json({ success: true, role: 'admin' });
  }

  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
}
