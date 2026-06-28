const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const ALLOWED_MODELS = new Set(["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"]);

function resolveModel(m) {
  return m && ALLOWED_MODELS.has(m) ? m : DEFAULT_MODEL;
}

async function groqChat(messages, model, jsonMode = false) {
  const res = await fetch(GROQ_API, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Groq API error");
  return data.choices[0]?.message?.content ?? "";
}

export const handler = async (event) => {
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (event.httpMethod === "OPTIONS") return { statusCode: 200, headers, body: "" };
  if (event.httpMethod !== "POST") return { statusCode: 405, headers, body: JSON.stringify({ error: "Method not allowed" }) };

  try {
    const { topic, model: requestedModel } = JSON.parse(event.body || "{}");
    if (!topic) return { statusCode: 400, headers, body: JSON.stringify({ error: "Topic is required" }) };

    const model = resolveModel(requestedModel);
    const content = await groqChat([
      { role: "system", content: "You are a flashcard generator. Always respond with valid JSON only — no markdown wrappers, no extra text." },
      { role: "user", content: `Generate 10 spaced-repetition flashcards for: "${topic}".
Return a JSON object:
{
  "cards": [
    {"question": "Q1?", "answer": "A1"}
  ]
}` }
    ], model, true);

    const data = JSON.parse(content);
    return { statusCode: 200, headers, body: JSON.stringify({ cards: data.cards ?? data }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message || "Internal server error" }) };
  }
};
