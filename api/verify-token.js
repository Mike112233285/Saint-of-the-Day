// api/verify-token.js
// GET ?token=… → { valid: bool }
// Called by app.html on load to confirm the session is still valid.

const crypto = require('crypto');
const SECRET = process.env.TOKEN_SECRET;

function verifyToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8');
    const parts   = decoded.split('|');
    if (parts.length !== 3) return false;
    const [email, expires, sig] = parts;
    if (Date.now() > parseInt(expires)) return false; // expired
    const expected = crypto
      .createHmac('sha256', SECRET)
      .update(`${email}|${expires}`)
      .digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(sig,      'hex'),
      Buffer.from(expected, 'hex')
    );
  } catch {
    return false;
  }
}

module.exports = function handler(req, res) {
  const { token } = req.query;
  if (!token) return res.status(400).json({ valid: false });
  return res.status(200).json({ valid: verifyToken(token) });
};
