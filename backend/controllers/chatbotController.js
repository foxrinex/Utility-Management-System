const chat = async (req, res) => {
  const { message, area } = req.body;

  try {
    const prompt = `You are an emergency utility support chatbot for Bangladesh utility services (DESCO, WASA, TITAS).
You help residents with utility outage questions, safety advice, and service information.
User's area: ${area || 'Not specified'}
User's message: ${message}
Respond helpfully and concisely. Keep responses short and clear.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini Error:', JSON.stringify(data));
      return res.status(500).json({ message: data.error?.message || 'Gemini API error' });
    }

    const text = data.candidates[0].content.parts[0].text;
    res.json({ reply: text });

  } catch (error) {
    console.error('Gemini Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { chat };