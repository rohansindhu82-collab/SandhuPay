import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db, FieldValue } from '@/lib/firebase-admin';
import { requireMerchant, jsonError } from '@/lib/http';
export const runtime = 'nodejs';
const schema = z.object({
  name:z.string().trim().min(2).max(100).optional(),
  phone:z.string().trim().regex(/^[6-9][0-9]{9}$/).optional(),
  email:z.union([z.email().max(150),z.literal('')]).optional(),
  address:z.string().trim().max(500).optional(),
  notes:z.string().trim().max(1000).optional()
}).strict();
export async function PATCH(req:NextRequest,{params}:{params:Promise<{id:string}>}) {
  try {
    await requireMerchant(req);
    const {id}=await params;
    const parsed=schema.safeParse(await req.json());
    if(!parsed.success || Object.keys(parsed.data || {}).length===0) return Response.json({error:parsed.success?'No changes supplied':parsed.error.issues[0]?.message},{status:422});
    const ref=db().collection('customers').doc(id);
    await ref.update({...parsed.data,updatedAt:FieldValue.serverTimestamp()});
    return Response.json({success:true});
  } catch(e) { return jsonError(e); }
}
export async function DELETE(req:NextRequest,{params}:{params:Promise<{id:string}>}) {
  try {
    await requireMerchant(req);
    const {id}=await params;
    await db().collection('customers').doc(id).delete();
    return Response.json({success:true});
  } catch(e) { return jsonError(e); }
}
