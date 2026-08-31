// ahnaf start
const dns = require('dns');
const dnsPromises = dns.promises;

// Set default DNS servers to Google's public DNS and Cloudflare's public DNS
// to avoid local Windows/firewall queryMx issues.
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  console.warn('Failed to set public DNS servers, using defaults:', e.message);
}

/**
 * GMASS EMAIL VERIFIER UTILITY
 * -------------------------------------------------
 * Supports two modes controlled via .env variables:
 *
 *  GMASS_MOCK=true  (default / free mode)
 *    → Performs a local DNS MX record lookup on the email domain.
 *      No API key or internet subscription required.
 *
 *  GMASS_MOCK=false + GMASS_API_KEY=<your_key>
 *    → Calls the real GMass verification endpoint:
 *      https://verify.gmass.co/verify?email=<email>&key=<key>
 *      Requires a paid GMass subscription.
 *
 * Possible return statuses:
 *   'Valid'         — Email syntax OK and domain accepts mail
 *   'Invalid'       — Email syntax is malformed
 *   'NoMxRecord'    — Domain exists but has no MX records
 *   'ConnectionFail'— DNS or GMass API could not be reached
 */

// --- STEP 1: BASIC SYNTAX VALIDATION ---
function isValidEmailSyntax(email) {
  const syntaxRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return syntaxRegex.test(email);
}

// --- STEP 2: FREE LOCAL DNS MX LOOKUP (Mock / Simulator Mode) ---
async function verifyEmailViaDns(email) {
  const domain = email.split('@')[1];
  try {
    const mxRecords = await dnsPromises.resolveMx(domain);
    if (mxRecords && mxRecords.length > 0) {
      return { status: 'Valid', message: 'Email domain has valid MX records.' };
    } else {
      return { status: 'NoMxRecord', message: 'Email domain has no MX records configured.' };
    }
  } catch (err) {
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA' || err.code === 'ESERVFAIL') {
      return { status: 'NoMxRecord', message: 'Email domain could not be found or has no MX records.' };
    }
    return { status: 'ConnectionFail', message: 'DNS lookup connection failed. Please try again.' };
  }
}

// --- STEP 3: LIVE GMASS API VERIFICATION (Paid Mode) ---
async function verifyEmailViaGmass(email, apiKey) {
  try {
    const url = `https://verify.gmass.co/verify?email=${encodeURIComponent(email)}&key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(url);
    if (!response.ok) {
      return { status: 'ConnectionFail', message: 'GMass API returned a non-OK response.' };
    }
    const data = await response.json();
    // GMass returns { email, Status } — Status is capitalized
    const gmassStatus = data.Status || data.status || 'Unknown';
    return { status: gmassStatus, message: `GMass verification result: ${gmassStatus}` };
  } catch (err) {
    console.error('GMass API call failed:', err.message);
    return { status: 'ConnectionFail', message: 'Could not reach GMass API. Check your network.' };
  }
}

// --- PRIMARY EXPORT: Unified verifier ---
async function verifyEmail(email) {
  // Step 1: syntax check (always free)
  if (!isValidEmailSyntax(email)) {
    return { status: 'Invalid', message: 'The email address format is invalid.' };
  }

  const isMockMode = process.env.GMASS_MOCK !== 'false'; // defaults to true (free)
  const apiKey = process.env.GMASS_API_KEY;

  // Step 2: live GMass API if configured
  if (!isMockMode && apiKey && apiKey !== 'mock') {
    console.log('[EmailVerifier] Using live GMass API mode.');
    return await verifyEmailViaGmass(email, apiKey);
  }

  // Step 3: fallback — free local DNS MX lookup
  console.log('[EmailVerifier] Using free DNS MX lookup (mock mode).');
  return await verifyEmailViaDns(email);
}

module.exports = { verifyEmail };
// ahnaf end
