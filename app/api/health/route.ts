export const runtime='nodejs';
export async function GET(){ return Response.json({ok:true,app:'SandhuPay',environment:process.env.CASHFREE_ENV || 'sandbox',configured:{firebase:!!process.env.FIREBASE_SERVICE_ACCOUNT_BASE64,cashfree:!!(process.env.CASHFREE_CLIENT_ID&&process.env.CASHFREE_CLIENT_SECRET),razorpay:!!(process.env.RAZORPAY_KEY_ID&&process.env.RAZORPAY_KEY_SECRET)}}); }
