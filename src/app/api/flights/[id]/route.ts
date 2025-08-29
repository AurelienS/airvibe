import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { broadcast } from '@/lib/sse';

export const runtime = 'nodejs';

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const f = await prisma.flight.findFirst({ where: { id: params.id, userId: user.id }, select: { id: true } });
  if (!f) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.flight.delete({ where: { id: f.id } });
  broadcast({ type: 'flights:deleted', userId: user.id, id: f.id });
  return NextResponse.json({ ok: true });
}


