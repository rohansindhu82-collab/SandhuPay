import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { requireMerchant, jsonError } from '@/lib/http';
export const runtime='nodejs';
export async function GET(req:NextRequest,{params}:{params:Promise<{id:string}>}){try{await requireMerchant(req);const {id}=await params;const s=await db().collection('payments').doc(id).get();if(!s.exists)return Response.json({error:'Not found'},{status:404});const d=s.data()!;return Response.json({id:s.id,status:d.status,provider:d.provider,amount:d.amount,createdAt:d.createdAt?.toDate?.()?.toISOString()||null});}catch(e){return jsonError(e);}}
