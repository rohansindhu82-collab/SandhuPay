import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db, FieldValue } from '@/lib/firebase-admin';
import { requireMerchant, jsonError } from '@/lib/http';
export const runtime = 'nodejs';
const schema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().regex(/^[6-9][0-9]{9}$/, 'Enter a valid 10-digit Indian mobile number'),
  email: z.union([z.email().max(150), z.literal('')]).optional().default(''),
  address: z.string().trim().max(500).optional().default(''),
  notes: z.string().trim().max(1000).optional().default('')
});
export async function GET(req: NextRequest) {
  try {
    await requireMerchant(req);
    const snap = await db().collection('customers').orderBy('createdAt','desc').limit(250).get();
    return Response.json({ customers: snap.docs.map(d => ({ id:d.id, ...d.data(), createdAt:d.data().createdAt?.toDate?.()?.toISOString() || null })) });
  } catch (e) { return jsonError(e); }
}
export async function POST(req: NextRequest) {
  try {
    await requireMerchant(req);
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return Response.json({error:parsed.error.issues[0]?.message || 'Invalid input'},{status:422});
    const value = parsed.data;
    const ref = await db().collection('customers').add({...value, createdAt:FieldValue.serverTimestamp(), updatedAt:FieldValue.serverTimestamp()});
    return Response.json({id:ref.id, customer:{id:ref.id,...value}}, {status:201});
  } catch (e) { return jsonError(e); }
}
