import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
export async function requireMerchant(req: NextRequest) {
  const header = req.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) throw new Error('UNAUTHORIZED');
  const decoded = await adminAuth().verifyIdToken(token);
  const allowed = (process.env.MERCHANT_EMAIL || '').trim().toLowerCase();
  if (!allowed || (decoded.email || '').toLowerCase() !== allowed) throw new Error('FORBIDDEN');
  return decoded;
}
export function jsonError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unexpected error';
  const status = message === 'UNAUTHORIZED' ? 401 : message === 'FORBIDDEN' ? 403 : 400;
  return Response.json({ error: status === 400 ? 'Request failed' : message }, { status });
}
