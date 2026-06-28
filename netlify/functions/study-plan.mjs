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
    const { topic, timeframe, model: requestedModel } = JSON.parse(event.body || "{}");
    if (!topic || !timeframe) {
      return { statusCode: 400, body: JSON.stringify({ error: "Topic and timeframe are required" }) };
    }

    const groq = getGroq();
    const model = resolveModel(requestedModel);

    const response = await groq.chat.completions.create({
      model,
      messages: [
        { role: "system", content: "You are an expert study planner. Create detailed, structured, and motivating study plans in Markdown." },
        { role: "user", content: `Create a study plan for "${topic}" over ${timeframe}. Break it down by days/weeks. Include specific topics, practice suggestions, and revision strategies. Use clear Markdown headings.` }
      ],
    });

    const plan = response.choices[0]?.message?.content ?? "";
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message || "Internal server error" }) };
  }
};
