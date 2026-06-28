import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Helper to initialize Gemini lazily
  function getGenAI() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is missing.");
    }
    return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  // --- API Routes ---

  // Text Mode Endpoint
  app.post("/api/study/text", async (req, res) => {
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
        config: {
          responseMimeType: "application/json",
        }
      });

      if (!response.text) throw new Error("No response from AI");
      const data = JSON.parse(response.text);

      res.json(data);
    } catch (error: any) {
      console.error("Error in /api/study/text:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // Quiz Generator Endpoint
  app.post("/api/study/quiz", async (req, res) => {
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
        config: {
          responseMimeType: "application/json",
        }
      });

      if (!response.text) throw new Error("No response from AI");
      const data = JSON.parse(response.text);

      res.json(data);
    } catch (error: any) {
      console.error("Error in /api/study/quiz:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // Voice Chat (Simple Text-to-Text wrapper, client will handle Speech-to-Text and Text-to-Speech)
  app.post("/api/study/voice", async (req, res) => {
    try {
      const { text, history } = req.body;
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
      console.error("Error in /api/study/voice:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // Doubt Solving Endpoint
  app.post("/api/study/doubt", async (req, res) => {
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
      console.error("Error in /api/study/doubt:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // Study Plan Endpoint
  app.post("/api/study/plan", async (req, res) => {
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
      console.error("Error in /api/study/plan:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // Flashcards Endpoint
  app.post("/api/study/flashcards", async (req, res) => {
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
        config: {
          responseMimeType: "application/json",
        }
      });

      if (!response.text) throw new Error("No response from AI");
      let data;
      try {
        data = JSON.parse(response.text);
      } catch (e) {
        // Fallback parsing just in case
        let text = response.text.trim();
        if (text.startsWith('\`\`\`json')) text = text.slice(7, -3);
        data = JSON.parse(text);
      }
      
      res.json({ cards: data });
    } catch (error: any) {
      console.error("Error in /api/study/flashcards:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else if (!process.env.VERCEL) {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

  return app;
}

const appPromise = startServer();
import serverless from "serverless-http";

export const handler = async (event: any, context: any) => {
  const app = await appPromise;
  const serverlessHandler = serverless(app);
  return serverlessHandler(event, context);
};

export default async function (req: any, res: any) {
  const app = await appPromise;
  app(req, res);
}
