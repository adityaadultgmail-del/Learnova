const GROQ_API = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const ALLOWED_MODELS = new Set(["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"]);

function resolveModel(m) {
  return m && ALLOWED_MODELS.has(m) ? m : DEFAULT_MODEL;
}

async function groqChat(messages, model) {
  const res = await fetch(GROQ_API, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, messages }),
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
    const { topic, timeframe, model: requestedModel } = JSON.parse(event.body || "{}");
    if (!topic || !timeframe) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Topic and timeframe are required" }) };
    }

    const model = resolveModel(requestedModel);
    const plan = await groqChat([
      { role: "system", content: "You are an expert study planner. Create detailed, structured, and motivating study plans in Markdown." },
      { role: "user", content: `Create a study plan for "${topic}" over ${timeframe}. Break it down by days/weeks. Include specific topics, practice suggestions, and revision strategies. Use clear Markdown headings.` }
    ], model);

    return { statusCode: 200, headers, body: JSON.stringify({ plan }) };
  } catch (err) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message || "Internal server error" }) };
  }
};
