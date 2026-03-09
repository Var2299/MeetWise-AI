import { NextRequest, NextResponse } from 'next/server';
import { verifyPwd, createJwt } from '@/lib/auth';
import { findUserByEmail } from '@/lib/users';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const valid = await verifyPwd(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = createJwt({ userId: user.id, email: user.email, name: user.name });
    return NextResponse.json({ token, email: user.email, name: user.name });
  } catch (err) {
    console.error('[login]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
