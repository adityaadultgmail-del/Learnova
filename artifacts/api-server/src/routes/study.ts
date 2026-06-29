import { Router, type IRouter } from "express";
import Groq from "groq-sdk";

const router: IRouter = Router();

const DEFAULT_MODEL = "llama-3.3-70b-versatile";
const ALLOWED_MODELS = new Set([
  "llama-3.3-70b-versatile",
  "llama-3.1-8b-instant",
  "mixtral-8x7b-32768",
]);

function getGroq() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY environment variable is missing.");
  }
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
}

function resolveModel(requested?: string) {
  if (requested && ALLOWED_MODELS.has(requested)) return requested;
  return DEFAULT_MODEL;
}

async function chat(groq: Groq, systemPrompt: string, userPrompt: string, model: string, jsonMode = false) {
  const response = await groq.chat.completions.create({
    model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
  });
  return response.choices[0]?.message?.content ?? "";
}

router.post("/study/text", async (req, res) => {
  try {
    const { topic, model: requestedModel } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }
    const groq = getGroq();
    const model = resolveModel(requestedModel);
    const system = `You are a study assistant. Always respond with valid JSON only — no markdown wrappers, no extra text.`;
    const user = `The user wants to study: "${topic}".
Return a JSON object with exactly these fields:
{
  "youtubeSuggestions": [
    {"title": "Descriptive video title 1 for ${topic}", "url": "https://www.youtube.com/results?search_query=descriptive+keywords+for+video+1"},
    {"title": "Descriptive video title 2 for ${topic}", "url": "https://www.youtube.com/results?search_query=descriptive+keywords+for+video+2"},
    {"title": "Descriptive video title 3 for ${topic}", "url": "https://www.youtube.com/results?search_query=descriptive+keywords+for+video+3"}
  ],
  "notes": "Comprehensive study notes in markdown. Include headings, bullet points, and key concepts.",
  "quizTopic": "A brief summary of the topic to generate quizzes on later."
}
IMPORTANT for youtubeSuggestions: Each url MUST be a real YouTube search URL in the format https://www.youtube.com/results?search_query=your+search+terms where the search terms are URL-encoded (spaces as +) and directly relevant to the video title. Make each title specific and descriptive (e.g. "Newton's Laws of Motion Explained - Class 11 Physics" not just "physics video"). The search query should match the title closely.`;
    const text = await chat(groq, system, user, model, true);
    const data = JSON.parse(text);
    res.json(data);
  } catch (error: any) {
    req.log.error({ err: error }, "Error in /api/study/text");
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

router.post("/study/quiz", async (req, res) => {
  try {
    const { topic, examGoal, numQuestions, model: requestedModel } = req.body;
    if (!topic || !examGoal || !numQuestions) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const groq = getGroq();
    const model = resolveModel(requestedModel);
    const system = `You are an expert examiner. Always respond with valid JSON only — no markdown wrappers, no extra text.`;
    const user = `Create a ${numQuestions}-question multiple-choice quiz for the ${examGoal} exam on: "${topic}".
Return a JSON object:
{
  "questions": [
    {
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 0,
      "explanation": "Why this answer is correct."
    }
  ]
}`;
    const text = await chat(groq, system, user, model, true);
    const data = JSON.parse(text);
    res.json(data);
  } catch (error: any) {
    req.log.error({ err: error }, "Error in /api/study/quiz");
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

router.post("/study/voice", async (req, res) => {
  try {
    const { text, model: requestedModel } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }
    const groq = getGroq();
    const model = resolveModel(requestedModel);
    const system = `You are a friendly, conversational voice AI tutor. 
Keep responses concise and easy to understand when spoken aloud.
Avoid complex markdown — no tables, no code blocks — since this will be read by text-to-speech.`;
    const reply = await chat(groq, system, text, model);
    res.json({ text: reply });
  } catch (error: any) {
    req.log.error({ err: error }, "Error in /api/study/voice");
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

router.post("/study/doubt", async (req, res) => {
  try {
    const { doubt, model: requestedModel } = req.body;
    if (!doubt) {
      return res.status(400).json({ error: "Doubt is required" });
    }
    const groq = getGroq();
    const model = resolveModel(requestedModel);
    const system = `You are an expert AI tutor. Answer student doubts clearly, concisely, and with examples where helpful.`;
    const reply = await chat(groq, system, doubt, model);
    res.json({ text: reply });
  } catch (error: any) {
    req.log.error({ err: error }, "Error in /api/study/doubt");
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

router.post("/study/plan", async (req, res) => {
  try {
    const { topic, timeframe, model: requestedModel } = req.body;
    if (!topic || !timeframe) {
      return res.status(400).json({ error: "Topic and timeframe are required" });
    }
    const groq = getGroq();
    const model = resolveModel(requestedModel);
    const system = `You are an expert study planner. Create detailed, structured, and motivating study plans in Markdown.`;
    const user = `Create a study plan for "${topic}" over ${timeframe}. Break it down by days/weeks. Include specific topics, practice suggestions, and revision strategies. Use clear Markdown headings.`;
    const reply = await chat(groq, system, user, model);
    res.json({ plan: reply });
  } catch (error: any) {
    req.log.error({ err: error }, "Error in /api/study/plan");
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

router.post("/study/flashcards", async (req, res) => {
  try {
    const { topic, model: requestedModel } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }
    const groq = getGroq();
    const model = resolveModel(requestedModel);
    const system = `You are a flashcard generator. Always respond with valid JSON only — no markdown wrappers, no extra text.`;
    const user = `Generate 10 spaced-repetition flashcards for: "${topic}".
Return a JSON object:
{
  "cards": [
    {"question": "Q1?", "answer": "A1"},
    {"question": "Q2?", "answer": "A2"}
  ]
}`;
    const text = await chat(groq, system, user, model, true);
    const data = JSON.parse(text);
    res.json({ cards: data.cards ?? data });
  } catch (error: any) {
    req.log.error({ err: error }, "Error in /api/study/flashcards");
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

router.post("/study/ask", async (req, res) => {
  try {
    const { question, model: requestedModel } = req.body;
    if (!question) {
      return res.status(400).json({ error: "question is required" });
    }
    const groq = getGroq();
    const model = resolveModel(requestedModel);
    const system = `You are Learnova AI, a friendly and knowledgeable study assistant helping students understand difficult concepts. 
Answer clearly and concisely. Use simple language. If helpful, use short examples. 
Do NOT use markdown formatting — respond in plain paragraphs. Keep answers focused and under 250 words.`;
    const answer = await chat(groq, system, question, model, false);
    res.json({ answer: answer.trim() });
  } catch (error: any) {
    req.log.error({ err: error }, "Error in /api/study/ask");
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

export default router;
