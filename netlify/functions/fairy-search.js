exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("ANTHROPIC_API_KEY is not set");
    return { statusCode: 200, body: JSON.stringify({ style: null, size: null, keywords: [], maxPrice: null, reply: "My magic is sleeping right now — but I had a quick look around for you! ✨" }) };
  }

  try {
    const { query, styles = [], sizes = [] } = JSON.parse(event.body);

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 400,
        messages: [{
          role: "user",
          content: `You are a fairy assistant for TutuTrade, a children's dancewear marketplace.
Extract search criteria from the user's query. Respond with ONLY valid JSON (no markdown, no code fences).

Available dance styles: ${styles.length ? styles.join(", ") : "Ballet, Jazz, Tap, Contemporary, Hip Hop, Musical Theatre, Acro, Irish, Ballroom, Lyrical"}
Available sizes: ${sizes.length ? sizes.join(", ") : "Age 2-3, Age 3-4, Age 4-5, Age 5-6, Age 6-7, Age 7-8, Age 8-9, Age 9-10, Age 10-11, Age 11-12, Teen XS, Teen S, Teen M, Teen L, Adult XS, Adult S, Adult M, Adult L, Adult XL"}

User query: "${query}"

JSON response format:
{
  "style": "exact style name from the list or null",
  "size": "exact size name from the list or null",
  "keywords": ["relevant", "keywords", "from", "query"],
  "maxPrice": number or null,
  "reply": "Warm, enthusiastic 1-2 sentence fairy response acknowledging what you're searching for. Use magical language and be encouraging."
}`,
        }],
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Anthropic error:", data);
      return { statusCode: 200, body: JSON.stringify({ style: null, size: null, keywords: [], maxPrice: null, reply: "Let me sprinkle some search dust and see what I can find! ✨" }) };
    }

    const text = data.content[0].text.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const result = JSON.parse(text);
    return { statusCode: 200, body: JSON.stringify(result) };
  } catch (error) {
    console.error("Fairy search error:", error);
    return { statusCode: 200, body: JSON.stringify({ style: null, size: null, keywords: [], maxPrice: null, reply: "My sparkles got in a tangle! Let me try a simple search for you. ✨" }) };
  }
};
