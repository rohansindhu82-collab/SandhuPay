# SandhuPay — Sandhu Electronics merchant payment portal

Private, single-merchant Next.js app. This source includes Firebase email/password sign-in, a merchant dashboard, payment-link creation, Cashfree and Razorpay sandbox adapters, and signed webhook handlers.

## Security model
- Only the exact `MERCHANT_EMAIL` Firebase account can use merchant APIs. There is no public sign-up UI.
- Firebase Admin SDK is server-only. Payment records are created and updated only by server routes.
- Card PAN, CVV, PIN and OTP are never collected or stored by this app; customers use provider-hosted checkout.
- A browser redirect or checkout callback never marks a payment as paid. Only a valid provider webhook does.
- Razorpay checkout signature is recorded as `verification_received`; final `paid` state comes from `payment.captured` webhook.
- Webhook handlers verify HMAC signatures against the raw request body.

## Deploy
1. Create the Firebase project, enable Email/Password Authentication, create one merchant user, and create Firestore.
2. Add the Vercel environment variables from `.env.example`. `FIREBASE_SERVICE_ACCOUNT_BASE64`, provider secrets and webhook secrets must be Secret values. Do not paste secrets into chat or GitHub.
3. Set `MERCHANT_EMAIL` to the exact Firebase merchant login email.
4. Add `sandhupay.vercel.app` to Firebase Authentication > Settings > Authorized domains.
5. Set `APP_URL=https://sandhupay.vercel.app` and `CASHFREE_ENV=sandbox`. Use only test credentials initially.
6. Set Firestore rules to deny all client reads/writes to `payments` (the Admin SDK server routes bypass client rules):

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /payments/{document=**} { allow read, write: if false; }
  }
}
```

## Provider setup
### Cashfree sandbox
- Set `CASHFREE_CLIENT_ID` and `CASHFREE_CLIENT_SECRET` from the Cashfree sandbox dashboard. The payment order is created when the customer opens the hosted payment page.
- Configure webhook URL `https://sandhupay.vercel.app/api/webhooks/cashfree` for payment success and failure events. Use the same webhook secret as the Cashfree client secret for the documented PG webhook signature scheme.
- Cashfree environment is selected by `CASHFREE_ENV=sandbox` (production only after KYC and testing).

### Razorpay test mode
- Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` from test mode API keys.
- Set `RAZORPAY_WEBHOOK_SECRET` and configure `https://sandhupay.vercel.app/api/webhooks/razorpay` for `payment.captured` and `payment.failed`.
- The key secret and webhook secret are different values; do not interchange them.

## Local development
```bash
npm install
cp .env.example .env.local
npm run dev
```

## Important limitations before live use
- This is an integration-ready sandbox build, not a certification that merchant credentials or provider account settings are valid.
- Test each provider with its sandbox cards/UPI methods, webhook delivery, duplicate webhook delivery, failed/cancelled payment and amount mismatch cases.
- Before production: complete provider KYC, switch credentials and environment deliberately, verify webhook configuration, enable HTTPS, review tax/invoice/refund workflows, and perform a security review.
- Payment amount is capped at ₹5,00,000 per request. The merchant must verify actual settlements in provider dashboards.

## Deployment verification checklist
- [ ] `npm install` completes and `npm run typecheck` passes locally.
- [ ] Vercel build completes on Node.js 22.
- [ ] Merchant can sign in; a different Firebase user receives HTTP 403 from merchant APIs.
- [ ] A payment link opens without exposing merchant credentials.
- [ ] Cashfree sandbox success/failure webhooks are accepted only with valid signatures.
- [ ] Razorpay test `payment.captured` and `payment.failed` webhooks are accepted only with valid signatures.
- [ ] A redirect or checkout callback alone never changes the status to `paid`.
- [ ] Duplicate webhooks do not create duplicate payment records.
