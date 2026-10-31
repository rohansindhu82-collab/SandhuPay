import { NextRequest } from 'next/server';
import { db } from '@/lib/firebase-admin';
export const runtime='nodejs';
export async function GET(req:NextRequest){const id=req.nextUrl.searchParams.get('id');if(!id)return Response.json({error:'Missing ID'},{status:400});const s=await db().collection('payments').doc(id).get();if(!s.exists)return Response.json({error:'Not found'},{status:404});const d=s.data()!;return Response.json({status:d.status,amount:d.amount,description:d.description});}
