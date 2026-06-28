import Groq from "groq-sdk";

const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const ALLOWED_MODELS = new Set(["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"]);

function getGroq() {
  if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY is missing");
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

function resolveModel(m) {
  return m && ALLOWED_MODELS.has(m) ? m : DEFAULT_MODEL;
}

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }
  try {
    const { topic, model: requestedModel } = JSON.parse(event.body || "{}");
    if (!topic) return { statusCode: 400, body: JSON.stringify({ error: "Topic is required" }) };

    const groq = getGroq();
    const model = resolveModel(requestedModel);

    const response = await groq.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You are a flashcard generator. Always respond with valid JSON only — no markdown wrappers, no extra text." },
        { role: "user", content: `Generate 10 spaced-repetition flashcards for: "${topic}".
Return a JSON object:
{
  "cards": [
    {"question": "Q1?", "answer": "A1"},
    {"question": "Q2?", "answer": "A2"}
  ]
}` }
      ],
    });

    const data = JSON.parse(response.choices[0]?.message?.content ?? "{}");
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cards: data.cards ?? data }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message || "Internal server error" }) };
  }
};
