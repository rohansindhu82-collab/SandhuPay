import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db, FieldValue } from '@/lib/firebase-admin';
import { requireMerchant, jsonError } from '@/lib/http';
export const runtime='nodejs';
const schema=z.object({
  name:z.string().trim().min(2).max(120).optional(),
  sku:z.string().trim().max(60).optional(),
  category:z.string().trim().max(80).optional(),
  brand:z.string().trim().max(80).optional(),
  price:z.number().finite().min(0).max(100000000).optional(),
  cost:z.number().finite().min(0).max(100000000).optional(),
  stock:z.number().int().min(0).max(10000000).optional(),
  reorderLevel:z.number().int().min(0).max(10000000).optional(),
  serialTracking:z.boolean().optional()
}).strict();
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}) {
  try {
    await requireMerchant(req);
    const {id}=await params;
    const parsed=schema.safeParse(await req.json());
    if(!parsed.success || Object.keys(parsed.data||{}).length===0) return Response.json({error:parsed.success?'No changes supplied':parsed.error.issues[0]?.message},{status:422});
    await db().collection('products').doc(id).update({...parsed.data,updatedAt:FieldValue.serverTimestamp()});
    return Response.json({success:true});
  } catch(e) { return jsonError(e); }
}
export async function DELETE(req:NextRequest,{params}:{params:Promise<{id:string}>}) {
  try {
    await requireMerchant(req);
    const {id}=await params;
    await db().collection('products').doc(id).delete();
    return Response.json({success:true});
  } catch(e) { return jsonError(e); }
}
