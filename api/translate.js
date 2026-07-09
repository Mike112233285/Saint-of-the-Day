// api/translate.js
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

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is not set');
    return res.status(500).json({ error: 'API key not configured' });
  }

  const langName = LANG_NAMES[lang];

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system: 'You are a translator specialising in Catholic and Christian religious texts. Translate accurately, preserving religious tone and warmth. Return ONLY a valid JSON object — no preamble, no markdown backticks.',
        messages: [{
          role: 'user',
          content: `Translate these fields into ${langName}. Keep saint names, place names, and proper nouns unchanged. Return JSON with keys "title", "text", "bio".\n\ntitle: ${title||''}\ntext: ${text}\nbio: ${bio||''}`
        }]
      })
    });

    const rawText = await response.text();
    console.log('Anthropic status:', response.status);

    if (!response.ok) {
      console.error('Anthropic error:', rawText.substring(0, 200));
      return res.status(500).json({ error: 'Anthropic API error: ' + response.status });
    }

    const data = JSON.parse(rawText);
    if (!data.content || !data.content[0]) {
      console.error('Unexpected response structure:', JSON.stringify(data).substring(0, 200));
      throw new Error('Bad API response structure');
    }

    const translated = JSON.parse(data.content[0].text.replace(/```json|```/g,'').trim());
    return res.status(200).json(translated);

  } catch(e) {
    console.error('Translation error:', e.message);
    return res.status(500).json({ error: e.message });
  }
};
