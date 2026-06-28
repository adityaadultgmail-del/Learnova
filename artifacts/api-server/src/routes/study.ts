import { Router, type IRouter } from "express";
import { GoogleGenAI } from "@google/genai";

const router: IRouter = Router();

function getGenAI() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

router.post("/study/text", async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }
    const ai = getGenAI();
    const prompt = `You are a study assistant. The user wants to study the topic: "${topic}".
      Provide 3 things in valid JSON format:
      {
        "youtubeSuggestions": [
          {"title": "Video title 1", "url": "https://youtube.com/watch?v=..."},
          {"title": "Video title 2", "url": "https://youtube.com/watch?v=..."},
          {"title": "Video title 3", "url": "https://youtube.com/watch?v=..."}
        ],
        "notes": "A comprehensive set of study notes on the topic. Use markdown formatting. Include headings, bullet points, and key concepts.",
        "quizTopic": "A brief summary of the topic to generate quizzes on later."
      }
      Important: Return ONLY the JSON object, no markdown code block wrappers (do not use \`\`\`json).`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    if (!response.text) throw new Error("No response from AI");
    const data = JSON.parse(response.text);
    res.json(data);
  } catch (error: any) {
    req.log.error({ err: error }, "Error in /api/study/text");
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

router.post("/study/quiz", async (req, res) => {
  try {
    const { topic, examGoal, numQuestions } = req.body;
    if (!topic || !examGoal || !numQuestions) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    const ai = getGenAI();
    const prompt = `You are an expert examiner for the ${examGoal} exam. 
      Create a ${numQuestions}-question multiple-choice quiz on the topic: "${topic}".
      Provide the output in valid JSON format:
      {
        "questions": [
          {
            "question": "Question text here?",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswerIndex": 0,
            "explanation": "Explanation of the correct answer."
          }
        ]
      }
      Important: Return ONLY the JSON object, no markdown wrappers (do not use \`\`\`json).`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    if (!response.text) throw new Error("No response from AI");
    const data = JSON.parse(response.text);
    res.json(data);
  } catch (error: any) {
    req.log.error({ err: error }, "Error in /api/study/quiz");
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

router.post("/study/voice", async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }
    const ai = getGenAI();
    const prompt = `You are a friendly, conversational voice AI tutor. 
      Keep your responses concise, conversational, and easy to understand when spoken aloud.
      Do not use complex markdown (like tables) since this will be read by a text-to-speech engine.
      
      User says: "${text}"`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    res.json({ text: response.text });
  } catch (error: any) {
    req.log.error({ err: error }, "Error in /api/study/voice");
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

router.post("/study/doubt", async (req, res) => {
  try {
    const { doubt } = req.body;
    if (!doubt) {
      return res.status(400).json({ error: "Doubt is required" });
    }
    const ai = getGenAI();
    const prompt = `You are an expert AI tutor helping a student. Answer this doubt clearly and concisely: ${doubt}`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    res.json({ text: response.text });
  } catch (error: any) {
    req.log.error({ err: error }, "Error in /api/study/doubt");
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

router.post("/study/plan", async (req, res) => {
  try {
    const { topic, timeframe } = req.body;
    if (!topic || !timeframe) {
      return res.status(400).json({ error: "Topic and timeframe are required" });
    }
    const ai = getGenAI();
    const prompt = `Create a highly structured and detailed study plan for "${topic}" over a period of ${timeframe}. Break it down by days or weeks. Include specific topics to cover, practice suggestions, and revision strategies. Format it beautifully using Markdown with clear headings.`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    res.json({ plan: response.text });
  } catch (error: any) {
    req.log.error({ err: error }, "Error in /api/study/plan");
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

router.post("/study/flashcards", async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic) {
      return res.status(400).json({ error: "Topic is required" });
    }
    const ai = getGenAI();
    const prompt = `Generate 10 highly effective spaced-repetition flashcards for the topic: "${topic}". Return ONLY a valid JSON array of objects, where each object has a "question" string and an "answer" string. Do not include any markdown formatting or extra text outside the JSON array.`;
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    if (!response.text) throw new Error("No response from AI");
    let data;
    try {
      data = JSON.parse(response.text);
    } catch (e) {
      let text = response.text.trim();
      if (text.startsWith('```json')) text = text.slice(7, -3);
      data = JSON.parse(text);
    }
    res.json({ cards: data });
  } catch (error: any) {
    req.log.error({ err: error }, "Error in /api/study/flashcards");
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

export default router;
