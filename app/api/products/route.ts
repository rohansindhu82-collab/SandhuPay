import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db, FieldValue } from '@/lib/firebase-admin';
import { requireMerchant, jsonError } from '@/lib/http';
export const runtime = 'nodejs';
const schema = z.object({
  name:z.string().trim().min(2).max(120),
  sku:z.string().trim().max(60).optional().default(''),
  category:z.string().trim().max(80).optional().default(''),
  brand:z.string().trim().max(80).optional().default(''),
  price:z.number().finite().min(0).max(100000000),
  cost:z.number().finite().min(0).max(100000000).optional().default(0),
  stock:z.number().int().min(0).max(10000000),
  reorderLevel:z.number().int().min(0).max(10000000).optional().default(0),
  serialTracking:z.boolean().optional().default(false)
});
export async function GET(req:NextRequest) {
  try {
    await requireMerchant(req);
    const snap=await db().collection('products').orderBy('createdAt','desc').limit(500).get();
    return Response.json({products:snap.docs.map(d=>({id:d.id,...d.data(),createdAt:d.data().createdAt?.toDate?.()?.toISOString()||null}))});
  } catch(e) { return jsonError(e); }
}
export async function POST(req:NextRequest) {
  try {
    await requireMerchant(req);
    const parsed=schema.safeParse(await req.json());
    if(!parsed.success) return Response.json({error:parsed.error.issues[0]?.message||'Invalid input'},{status:422});
    const v=parsed.data;
    const ref=await db().collection('products').add({...v,createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()});
    return Response.json({id:ref.id,product:{id:ref.id,...v}},{status:201});
  } catch(e) { return jsonError(e); }
}
