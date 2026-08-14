const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent`;

export async function getAIInterpretation(
  question: string,
  mode: string,
  context: string,
): Promise<string> {
  // Call through the api-server proxy to keep the key secure
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  const baseUrl = domain ? `https://${domain}` : '';

  const prompt = buildPrompt(question, mode, context);

  try {
    const res = await fetch(`${baseUrl}/api/interpret`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    });
    if (!res.ok) throw new Error('Server error');
    const data = (await res.json()) as { interpretation?: string; error?: string };
    if (data.error) throw new Error(data.error);
    return data.interpretation ?? 'No interpretation received.';
  } catch (err) {
    // Fallback: try direct Gemini API (not recommended for production)
    console.error('Proxy failed, attempting direct call:', err);
    throw new Error('Could not reach the interpretation service. Please check your connection.');
  }
}

function buildPrompt(question: string, mode: string, context: string): string {
  return `You are Wildflower, a warm and thoughtful guide who helps the user reflect on astrology, tarot, and related symbols.

Reading Mode: ${mode}
Question: "${question}"
Context: ${context}

Write exactly 2 paragraphs. Each paragraph must be 3–4 complete sentences. Speak directly to the user in second person. Do not use bullet points, headings, or an opening such as "This reading" or "The cards reveal"; start with the useful insight.

Use a natural, human tone, as if you are talking with a thoughtful friend. Keep the language clear, warm, and grounded. Prefer common everyday words and short, varied sentences. Use contractions when they sound natural. Avoid fancy, dramatic, overly poetic, mystical, or vague wording, as well as stock phrases and exaggerated certainty. Do not say that something is guaranteed or destined. Connect the symbols to the user's question in a practical way and offer one gentle, useful perspective or next step. Be specific without sounding formal or clinical. Every sentence must end with a period, question mark, or exclamation mark before the paragraph ends.
Respond in the same language the user wrote their question in.`;
}
