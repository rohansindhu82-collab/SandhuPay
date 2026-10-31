import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db, FieldValue } from '@/lib/firebase-admin';
import { requireMerchant, jsonError } from '@/lib/http';
import type { Provider } from '@/lib/providers';
import { randomUUID } from 'node:crypto';
export const runtime='nodejs';
const schema=z.object({amount:z.number().positive().max(500000).finite(),customerName:z.string().trim().min(2).max(80),customerEmail:z.email().max(150),customerPhone:z.string().regex(/^[6-9][0-9]{9}$/),description:z.string().trim().max(120).default('Purchase'),provider:z.enum(['cashfree','razorpay']).optional()});
export async function GET(req:NextRequest){try{await requireMerchant(req);const snap=await db().collection('payments').orderBy('createdAt','desc').limit(50).get();return Response.json({payments:snap.docs.map(d=>({id:d.id,...d.data(),createdAt:d.data().createdAt?.toDate?.()?.toISOString()||null}))});}catch(e){return jsonError(e);}}
export async function POST(req:NextRequest){try{const merchant=await requireMerchant(req);const parsed=schema.safeParse(await req.json());if(!parsed.success)return Response.json({error:parsed.error.issues[0]?.message||'Invalid input'},{status:422});const v=parsed.data;const provider:Provider=v.provider || (process.env.DEFAULT_PAYMENT_PROVIDER==='razorpay'?'razorpay':'cashfree');const ref=`SP${randomUUID().replace(/-/g,'').slice(0,20).toUpperCase()}`;const doc={amount:Number(v.amount.toFixed(2)),currency:'INR',customerName:v.customerName,customerEmail:v.customerEmail,customerPhone:v.customerPhone,description:v.description,provider,status:'created',merchantEmail:merchant.email||'',createdAt:FieldValue.serverTimestamp(),updatedAt:FieldValue.serverTimestamp()};await db().collection('payments').doc(ref).create(doc);return Response.json({id:ref,provider,amount:doc.amount,checkoutUrl:`${(process.env.APP_URL||'').replace(/\/$/,'')}/pay/${ref}`});}catch(e){return jsonError(e);}}
