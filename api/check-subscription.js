// api/check-subscription.js
// POST { key }   → validates a Lemon Squeezy license key
// POST { code }  → validates the free access code (Maureen1944)
// Returns { active: bool, token?: string }

const crypto = require('crypto');

const LS_LICENSE_API = 'https://api.lemonsqueezy.com/v1/licenses/validate';
const SECRET         = process.env.TOKEN_SECRET;
const FREE_CODE      = 'Maureen1944';

function makeToken(identity, lifetime = false) {
  const expires = lifetime
    ? Date.now() + 100 * 365 * 24 * 60 * 60 * 1000  // ~100 years
    : Date.now() +        24 * 60 * 60 * 1000;        // 24 hours
  const payload = `${identity}|${expires}`;
  const sig = crypto.createHmac('sha256', SECRET).update(payload).digest('hex');
  return Buffer.from(`${payload}|${sig}`).toString('base64');
}

async function validateLicenseKey(key) {
  const res = await fetch(LS_LICENSE_API, {
    method: 'POST',
    headers: {
      'Accept':       'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ license_key: key }),
  });

  if (!res.ok) return false;
  const data = await res.json();

  // valid = true means the key exists and the subscription is active
  return data.valid === true;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { key, code } = req.body || {};

  // ── Free access code ────────────────────────────────────────────────────
  if (code !== undefined) {
    const provided = Buffer.from(String(code).trim());
    const expected = Buffer.from(FREE_CODE);
    const match = provided.length === expected.length &&
      crypto.timingSafeEqual(provided, expected);

    return res.status(200).json(match
      ? { active: true, token: makeToken('free-code', true) }
      : { active: false }
    );
  }

  // ── License key ─────────────────────────────────────────────────────────
  if (!key || key.trim().length < 10) {
    return res.status(400).json({ error: 'Invalid key' });
  }

  try {
    const active = await validateLicenseKey(key.trim().toUpperCase());
    return res.status(200).json(active
      ? { active: true, token: makeToken(key.trim()) }
      : { active: false }
    );
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error' });
  }
};
