import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
let adminApp;
function getAdminApp() {
  if (getApps().length) return getApps()[0];
  const encoded = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (!encoded) throw new Error('FIREBASE_SERVICE_ACCOUNT_BASE64 is not configured');
  const serviceAccount = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'));
  adminApp = initializeApp({ credential: cert(serviceAccount) });
  return adminApp;
}
export function adminAuth() { return getAuth(getAdminApp()); }
export function db() { return getFirestore(getAdminApp()); }
export { FieldValue };
