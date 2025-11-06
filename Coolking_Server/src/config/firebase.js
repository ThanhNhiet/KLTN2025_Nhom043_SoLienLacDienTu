// firebase.ts (Node/Express)
const admin = require('firebase-admin');
require('dotenv').config();

function cleanPrivateKey(raw) {
  if (!raw) return undefined;
  let s = String(raw).trim();
  // remove surrounding quotes if any
  s = s.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
  // replace escaped newlines
  s = s.replace(/\\n/g, '\n');
  // if looks like base64 (no PEM header), try decode
  if (!s.includes('-----BEGIN') && /^[A-Za-z0-9+/=\s]+$/.test(s) && s.length > 200) {
    try {
      const decoded = Buffer.from(s.replace(/\s+/g, ''), 'base64').toString('utf8');
      if (decoded.includes('-----BEGIN')) return decoded;
    } catch (e) {
      // ignore decode error, return original cleaned string
    }
  }
  return s;
}

function tryParseServiceAccountFromEnv() {
  // support full JSON string or base64-encoded JSON
  const rawJson = process.env.FB_SERVICE_ACCOUNT_JSON;
  const rawBase64 = process.env.FB_SERVICE_ACCOUNT_BASE64;
  if (rawJson) {
    try {
      return JSON.parse(rawJson);
    } catch (e) {
      try {
        return JSON.parse(Buffer.from(rawJson, 'base64').toString('utf8'));
      } catch (e2) {
        return null;
      }
    }
  }
  if (rawBase64) {
    try {
      return JSON.parse(Buffer.from(rawBase64, 'base64').toString('utf8'));
    } catch (e) {
      return null;
    }
  }
  return null;
}

if (!admin.apps.length) {
  const serviceAccount = tryParseServiceAccountFromEnv();
  const privateKey = cleanPrivateKey(process.env.FB_PRIVATE_KEY);
  const projectId = process.env.FB_PROJECT_ID;
  const clientEmail = process.env.FB_CLIENT_EMAIL;

  try {
    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase initialized from FB_SERVICE_ACCOUNT_* env.');
    } else if (projectId && clientEmail && privateKey && privateKey.includes('-----BEGIN')) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log('Firebase initialized from FB_PROJECT_ID/FB_CLIENT_EMAIL/FB_PRIVATE_KEY.');
    } else {
      // Fallback to Application Default Credentials (e.g. GOOGLE_APPLICATION_CREDENTIALS or GCE metadata)
      admin.initializeApp();
      console.warn('Firebase initialized with default credentials (no service account provided).');
    }
  } catch (err) {
    // Log helpful debug info without printing the private key
    console.error('Failed to initialize Firebase Admin SDK.');
    console.error('FB_PROJECT_ID present:', !!projectId);
    console.error('FB_CLIENT_EMAIL present:', !!clientEmail);
    console.error('FB_PRIVATE_KEY length:', privateKey ? privateKey.length : 0);
    console.error('FB_PRIVATE_KEY contains PEM header:', privateKey ? privateKey.includes('-----BEGIN') : false);
    console.error('FB_SERVICE_ACCOUNT_JSON present:', !!process.env.FB_SERVICE_ACCOUNT_JSON);
    console.error('FB_SERVICE_ACCOUNT_BASE64 present:', !!process.env.FB_SERVICE_ACCOUNT_BASE64);
    console.error('Initialization error:', err && err.message ? err.message : err);
    throw err; // rethrow so caller sees the failure
  }
}

module.exports = admin;
