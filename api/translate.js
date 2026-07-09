// api/translate.js
// Uses MyMemory free translation API — no key required, no cost.
// Limit: 500 words/day per IP on free tier (plenty for a daily devotional).

const LANG_CODES = {
  nl:'nl', es:'es', it:'it', fr:'fr',
  pt:'pt', pl:'pl', ru:'ru', el:'el'
};

async function translateText(text, targetLang) {
  if (!text || !text.trim()) return text;
  const url = 'https://api.mymemory.translated.net/get?q=' +
    encodeURIComponent(text) + '&langpair=en|' + targetLang;
  const res = await fetch(url);
  const data = await res.json();
  if (data.responseStatus === 200 && data.responseData) {
    return data.responseData.translatedText;
  }
  return text; // Fall back to original
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { lang, title, text, bio } = req.body || {};
  if (!lang || lang === 'en' || !LANG_CODES[lang]) {
    return res.status(400).json({ error: 'Invalid language' });
  }
  if (!text) return res.status(400).json({ error: 'No text provided' });

  const targetLang = LANG_CODES[lang];

  try {
    // Translate each field in parallel
    const [translatedTitle, translatedText, translatedBio] = await Promise.all([
      translateText(title || '', targetLang),
      translateText(text, targetLang),
      translateText(bio || '', targetLang),
    ]);

    return res.status(200).json({
      title: translatedTitle,
      text: translatedText,
      bio: translatedBio,
    });
  } catch(e) {
    console.error('Translation error:', e.message);
    return res.status(500).json({ error: e.message });
  }
};
