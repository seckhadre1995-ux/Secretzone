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
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.ANTHROPIC_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 400,
        messages: [
          {
            role: 'system',
            content: `Tu es un psychologue bienveillant. Analyse cette confession et réponds UNIQUEMENT en JSON sans markdown:
{"emotions":["emoji + émotion","emoji + émotion","emoji + émotion"],"conseil":"Conseil empathique 2-3 phrases en français.","intensite":"faible|modérée|forte|critique"}`
          },
          {
            role: 'user',
            content: `Confession: "${safe}"`
          }
        ]
      })
    });

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || '';
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
