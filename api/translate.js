// api/translate.js
// Uses MyMemory free translation API for text and bio.
// Titles use a lookup table to avoid mistranslations of religious terms.

const LANG_CODES = {
  nl:'nl', es:'es', it:'it', fr:'fr',
  pt:'pt', pl:'pl', ru:'ru', el:'el'
};

// Common religious titles — translated manually for accuracy
const TITLE_MAP = {
  nl: {
    'Bishop':'Bisschop','Priest':'Priester','Martyr':'Martelaar','Martyrs':'Martelaren',
    'Virgin':'Maagd','Abbot':'Abt','Abbess':'Abdis','Pope':'Paus','Deacon':'Diaken',
    'Religious':'Religieuze','Hermit':'Kluizenaar','Doctor of the Church':'Kerkleraar',
    'Apostle':'Apostel','Apostles':'Apostelen','Evangelist':'Evangelist',
    'Solemnity':'Hoogfeest','Feast':'Feest','Memorial':'Gedachtenis',
    'Optional Memorial':'Facultatieve gedachtenis','Bishop and Martyr':'Bisschop en Martelaar',
    'Virgin and Martyr':'Maagd en Martelaar','Pope and Martyr':'Paus en Martelaar',
  },
  es: {
    'Bishop':'Obispo','Priest':'Sacerdote','Martyr':'Mártir','Martyrs':'Mártires',
    'Virgin':'Virgen','Abbot':'Abad','Abbess':'Abadesa','Pope':'Papa','Deacon':'Diácono',
    'Religious':'Religioso','Hermit':'Ermitaño','Doctor of the Church':'Doctor de la Iglesia',
    'Apostle':'Apóstol','Apostles':'Apóstoles','Evangelist':'Evangelista',
    'Solemnity':'Solemnidad','Feast':'Fiesta','Memorial':'Memoria',
    'Optional Memorial':'Memoria Opcional','Bishop and Martyr':'Obispo y Mártir',
    'Virgin and Martyr':'Virgen y Mártir','Pope and Martyr':'Papa y Mártir',
  },
  it: {
    'Bishop':'Vescovo','Priest':'Sacerdote','Martyr':'Martire','Martyrs':'Martiri',
    'Virgin':'Vergine','Abbot':'Abate','Abbess':'Badessa','Pope':'Papa','Deacon':'Diacono',
    'Religious':'Religioso','Hermit':'Eremita','Doctor of the Church':'Dottore della Chiesa',
    'Apostle':'Apostolo','Apostles':'Apostoli','Evangelist':'Evangelista',
    'Solemnity':'Solennità','Feast':'Festa','Memorial':'Memoria',
    'Optional Memorial':'Memoria Facoltativa','Bishop and Martyr':'Vescovo e Martire',
    'Virgin and Martyr':'Vergine e Martire','Pope and Martyr':'Papa e Martire',
  },
  fr: {
    'Bishop':'Évêque','Priest':'Prêtre','Martyr':'Martyr','Martyrs':'Martyrs',
    'Virgin':'Vierge','Abbot':'Abbé','Abbess':'Abbesse','Pope':'Pape','Deacon':'Diacre',
    'Religious':'Religieux','Hermit':'Ermite','Doctor of the Church':'Docteur de l\'Église',
    'Apostle':'Apôtre','Apostles':'Apôtres','Evangelist':'Évangéliste',
    'Solemnity':'Solennité','Feast':'Fête','Memorial':'Mémoire',
    'Optional Memorial':'Mémoire Facultative','Bishop and Martyr':'Évêque et Martyr',
    'Virgin and Martyr':'Vierge et Martyre','Pope and Martyr':'Pape et Martyr',
  },
  pt: {
    'Bishop':'Bispo','Priest':'Sacerdote','Martyr':'Mártir','Martyrs':'Mártires',
    'Virgin':'Virgem','Abbot':'Abade','Abbess':'Abadessa','Pope':'Papa','Deacon':'Diácono',
    'Religious':'Religioso','Hermit':'Eremita','Doctor of the Church':'Doutor da Igreja',
    'Apostle':'Apóstolo','Apostles':'Apóstolos','Evangelist':'Evangelista',
    'Solemnity':'Solenidade','Feast':'Festa','Memorial':'Memória',
    'Optional Memorial':'Memória Opcional','Bishop and Martyr':'Bispo e Mártir',
    'Virgin and Martyr':'Virgem e Mártir','Pope and Martyr':'Papa e Mártir',
  },
  pl: {
    'Bishop':'Biskup','Priest':'Kapłan','Martyr':'Męczennik','Martyrs':'Męczennicy',
    'Virgin':'Dziewica','Abbot':'Opat','Abbess':'Ksieni','Pope':'Papież','Deacon':'Diakon',
    'Religious':'Zakonnik','Hermit':'Pustelnik','Doctor of the Church':'Doktor Kościoła',
    'Apostle':'Apostoł','Apostles':'Apostołowie','Evangelist':'Ewangelista',
    'Solemnity':'Uroczystość','Feast':'Święto','Memorial':'Wspomnienie',
    'Optional Memorial':'Wspomnienie Dowolne','Bishop and Martyr':'Biskup i Męczennik',
    'Virgin and Martyr':'Dziewica i Męczennica','Pope and Martyr':'Papież i Męczennik',
  },
  ru: {
    'Bishop':'Епископ','Priest':'Священник','Martyr':'Мученик','Martyrs':'Мученики',
    'Virgin':'Дева','Abbot':'Аббат','Abbess':'Аббатиса','Pope':'Папа','Deacon':'Диакон',
    'Religious':'Монашествующий','Hermit':'Отшельник','Doctor of the Church':'Учитель Церкви',
    'Apostle':'Апостол','Apostles':'Апостолы','Evangelist':'Евангелист',
    'Solemnity':'Торжество','Feast':'Праздник','Memorial':'Память',
    'Optional Memorial':'Необязательная память','Bishop and Martyr':'Епископ и мученик',
    'Virgin and Martyr':'Дева и мученица','Pope and Martyr':'Папа и мученик',
  },
  el: {
    'Bishop':'Επίσκοπος','Priest':'Ιερέας','Martyr':'Μάρτυρας','Martyrs':'Μάρτυρες',
    'Virgin':'Παρθένος','Abbot':'Ηγούμενος','Abbess':'Ηγουμένη','Pope':'Πάπας','Deacon':'Διάκονος',
    'Religious':'Μοναχός','Hermit':'Ερημίτης','Doctor of the Church':'Διδάσκαλος της Εκκλησίας',
    'Apostle':'Απόστολος','Apostles':'Απόστολοι','Evangelist':'Ευαγγελιστής',
    'Solemnity':'Επισημότητα','Feast':'Εορτή','Memorial':'Μνήμη',
    'Optional Memorial':'Προαιρετική Μνήμη','Bishop and Martyr':'Επίσκοπος και Μάρτυρας',
    'Virgin and Martyr':'Παρθένος και Μάρτυρας','Pope and Martyr':'Πάπας και Μάρτυρας',
  },
};

async function translateTitle(title, lang, targetLang) {
  if (!title || lang === 'en') return title;
  var map = TITLE_MAP[lang] || {};
  // Try exact match first
  if (map[title]) return map[title];
  // Try replacing known terms within the title
  var result = title;
  Object.entries(map).forEach(function([en, tr]) {
    result = result.replace(new RegExp('\\b' + en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi'), tr);
  });
  // If we changed something, return the result
  if (result !== title) return result;
  // Otherwise fall back to MyMemory translation
  return await translateText('Catholic religious title: ' + title, targetLang)
    .then(function(t){ return t.replace(/^Catholic religious title:\s*/i, '').trim(); })
    .catch(function(){ return title; });
}

async function translateText(text, targetLang) {
  if (!text || !text.trim()) return text;
  const url = 'https://api.mymemory.translated.net/get?q=' +
    encodeURIComponent(text) + '&langpair=en|' + targetLang;
  const res = await fetch(url);
  const data = await res.json();
  if (data.responseStatus === 200 && data.responseData) {
    return data.responseData.translatedText;
  }
  return text;
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
    const [translatedTitle, translatedText, translatedBio] = await Promise.all([
      translateTitle(title, lang, targetLang),
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
