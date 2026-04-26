export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { text } = req.body;

  if (!text || text.length < 10 || text.length > 500)
    return res.status(400).json({ error: 'Texte invalide' });

  const safe = text.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        system: `Tu es un psychologue bienveillant. Analyse cette confession et réponds UNIQUEMENT en JSON sans markdown:
{"emotions":["emoji + émotion","emoji + émotion","emoji + émotion"],"conseil":"Conseil empathique 2-3 phrases en français.","intensite":"faible|modérée|forte|critique"}`,
        messages: [{ role: 'user', content: `Confession: "${safe}"` }]
      })
    });

    const data = await response.json();
    const raw = data.content?.map(b => b.text || '').join('') || '';
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());

    return res.status(200).json({
      emotions: parsed.emotions || [],
      conseil: parsed.conseil || '',
      intensite: parsed.intensite || 'modérée'
    });

  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}
