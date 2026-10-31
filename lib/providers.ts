import crypto from 'node:crypto';
export type Provider = 'cashfree' | 'razorpay';
export function cashfreeBase() { return process.env.CASHFREE_ENV === 'production' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg'; }
export async function createCashfreeOrder(input: {id:string; amount:number; name:string; email:string; phone:string}) {
  const clientId=process.env.CASHFREE_CLIENT_ID, secret=process.env.CASHFREE_CLIENT_SECRET;
  if (!clientId || !secret) throw new Error('Cashfree sandbox credentials are not configured');
  const base=(process.env.APP_URL || '').replace(/\/$/,'');
  if (!base.startsWith('https://')) throw new Error('APP_URL must be an HTTPS URL');
  const response=await fetch(`${cashfreeBase()}/orders`,{method:'POST',headers:{'Content-Type':'application/json','x-client-id':clientId,'x-client-secret':secret,'x-api-version':process.env.CASHFREE_API_VERSION || '2023-08-01'},body:JSON.stringify({order_id:input.id,order_amount:input.amount,order_currency:'INR',customer_details:{customer_id:`cust_${input.id}`,customer_name:input.name,customer_email:input.email,customer_phone:input.phone},order_meta:{return_url:`${base}/pay/${input.id}?return=cashfree`,notify_url:`${base}/api/webhooks/cashfree`}})});
  const data=await response.json(); if(!response.ok) throw new Error(data.message || data.type || 'Cashfree order creation failed');
  if(!data.payment_session_id) throw new Error('Cashfree did not return a payment session');
  return {providerOrderId:String(data.cf_order_id || data.order_id), sessionId:String(data.payment_session_id), checkoutUrl: String(data.payment_link || '')};
}
export async function createRazorpayOrder(input:{id:string;amount:number}) {
 const key=process.env.RAZORPAY_KEY_ID, secret=process.env.RAZORPAY_KEY_SECRET;
 if(!key || !secret) throw new Error('Razorpay test credentials are not configured');
 const auth=Buffer.from(`${key}:${secret}`).toString('base64');
 const res=await fetch('https://api.razorpay.com/v1/orders',{method:'POST',headers:{Authorization:`Basic ${auth}`,'Content-Type':'application/json'},body:JSON.stringify({amount:Math.round(input.amount*100),currency:'INR',receipt:input.id,notes:{sandhupay_payment_id:input.id}})});
 const data=await res.json(); if(!res.ok) throw new Error(data.error?.description || 'Razorpay order creation failed');
 return {providerOrderId:String(data.id),keyId:key};
}
export function verifyRazorpayCheckout(orderId:string,paymentId:string,signature:string) {
 const secret=process.env.RAZORPAY_KEY_SECRET; if(!secret) return false;
 const expected=crypto.createHmac('sha256',secret).update(`${orderId}|${paymentId}`).digest('hex');
 return safeEqual(expected,signature);
}
export function verifyCashfreeWebhook(raw:string,timestamp:string,signature:string) {
 const secret=process.env.CASHFREE_CLIENT_SECRET; if(!secret) return false;
 const expected=crypto.createHmac('sha256',secret).update(timestamp+raw).digest('base64');
 return safeEqual(expected,signature);
}
export function verifyRazorpayWebhook(raw:string,signature:string) {
 const secret=process.env.RAZORPAY_WEBHOOK_SECRET; if(!secret) return false;
 const expected=crypto.createHmac('sha256',secret).update(raw).digest('hex');
 return safeEqual(expected,signature);
}
function safeEqual(a:string,b:string) { const aa=Buffer.from(a),bb=Buffer.from(b); return aa.length===bb.length && crypto.timingSafeEqual(aa,bb); }
