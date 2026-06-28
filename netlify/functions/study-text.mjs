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
        { role: "system", content: "You are a study assistant. Always respond with valid JSON only — no markdown wrappers, no extra text." },
        { role: "user", content: `The user wants to study: "${topic}".
Return a JSON object with exactly these fields:
{
  "youtubeSuggestions": [
    {"title": "Descriptive video title 1", "url": "https://www.youtube.com/results?search_query=relevant+terms"},
    {"title": "Descriptive video title 2", "url": "https://www.youtube.com/results?search_query=relevant+terms"},
    {"title": "Descriptive video title 3", "url": "https://www.youtube.com/results?search_query=relevant+terms"}
  ],
  "notes": "Comprehensive study notes in markdown. Include headings, bullet points, and key concepts.",
  "quizTopic": "A brief summary of the topic to generate quizzes on later."
}` }
      ],
    });

    const data = JSON.parse(response.choices[0]?.message?.content ?? "{}");
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message || "Internal server error" }) };
  }
};
