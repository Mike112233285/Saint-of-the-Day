// api/translate.js
// POST { lang, key, title, text, bio } → { title, text, bio } in target language
// Proxies translation through Anthropic API server-side so the key stays secret.

const LANG_NAMES = {
  nl:'Dutch', es:'Spanish', it:'Italian', fr:'French',
  pt:'Portuguese', pl:'Polish', ru:'Russian', el:'Greek'
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { lang, title, text, bio } = req.body || {};
  if (!lang || lang === 'en' || !LANG_NAMES[lang]) {
    return res.status(400).json({ error: 'Invalid language' });
  }
  if (!text) return res.status(400).json({ error: 'No text provided' });

  const langName = LANG_NAMES[lang];

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001', // Fast and cheap for translation
        max_tokens: 1000,
        system: 'You are a translator specialising in Catholic and Christian religious texts. Translate accurately, preserving religious tone and warmth. Return ONLY a valid JSON object — no preamble, no markdown backticks.',
        messages: [{
          role: 'user',
          content: `Translate these fields into ${langName}. Keep saint names, place names, and proper nouns unchanged. Return JSON with keys "title", "text", "bio".\n\ntitle: ${title||''}\ntext: ${text}\nbio: ${bio||''}`
        }]
      })
    });

    const data = await response.json();
    if (!data.content || !data.content[0]) throw new Error('Bad API response');

    const raw = data.content[0].text.replace(/```json|```/g,'').trim();
    const translated = JSON.parse(raw);

    return res.status(200).json(translated);
  } catch(e) {
    console.error('Translation error:', e);
    return res.status(500).json({ error: 'Translation failed' });
  }
};
