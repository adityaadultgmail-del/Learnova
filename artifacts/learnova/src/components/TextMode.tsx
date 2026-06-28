import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Search, Loader2, Youtube, FileText, Download, CheckCircle2 } from "lucide-react";
import Markdown from "react-markdown";
import { useAuth } from "../lib/auth";
import { db } from "../lib/firebase";
import { collection, addDoc } from "firebase/firestore";
import { PdfTemplate } from "./PdfTemplate";
import { useModel } from "../lib/modelContext";
import { useLocation } from "react-router-dom";
import { apiUrl } from "../lib/api";

export function TextMode() {
  const { user } = useAuth();
  const { model } = useModel();
  const location = useLocation();
  const prefill = (location.state as any)?.prefillTopic ?? "";
  const [topic, setTopic] = useState(prefill);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (prefill) setTopic(prefill);
  }, [prefill]);
  const [result, setResult] = useState<{
    youtubeSuggestions: { title: string; url: string }[];
    notes: string;
    quizTopic: string;
  } | null>(null);
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/study/text"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, model })
      });
      const data = await res.json();
      setResult(data);

      if (user) {
        try {
          const entry = {
            topic: topic.trim(),
            notesPreview: (data.notes as string)?.slice(0, 300) ?? "",
            youtubeSuggestions: data.youtubeSuggestions ?? [],
            quizTopic: data.quizTopic ?? topic.trim(),
            model,
            searchedAt: new Date().toISOString(),
          };
          await addDoc(
            collection(db, "studyHistory", user.uid, "entries"),
            entry
          );
        } catch (err) {
          console.error("Failed to save history", err);
        }
      }
    } catch (error) {
      console.error(error);
      alert("Failed to generate content.");
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    window.print();
  };

  return (
    <>
      <div className="max-w-5xl mx-auto space-y-8 print:hidden">
        <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-3xl p-8"
      >
        <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-6 text-center">What do you want to study?</h2>
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto relative">
          <input 
            type="text" 
            placeholder="e.g. Quantum Physics, Cell Biology..."
            className="w-full bg-white/50 dark:bg-slate-700/60 border-2 border-white/60 dark:border-slate-600 focus:border-secondary-400 rounded-full py-4 pl-6 pr-16 text-lg outline-none transition-all shadow-inner text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            disabled={loading}
          />
          <button 
            type="submit" 
            disabled={loading}
            className="absolute right-2 top-2 bottom-2 bg-secondary-500 hover:bg-secondary-600 text-white rounded-full aspect-square flex items-center justify-center transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
          </button>
        </form>
      </motion.div>

      {result && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid md:grid-cols-12 gap-6"
        >
          {/* Notes Section - Takes up more space */}
          <div className="md:col-span-8 space-y-6">
            <div className="glass rounded-3xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3 text-secondary-600">
                  <FileText className="w-8 h-8" />
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Generated Notes</h3>
                </div>
                <button 
                  onClick={downloadPDF}
                  className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-4 py-2 rounded-full text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
              </div>
              <div className="prose prose-slate dark:prose-invert max-w-none prose-headings:text-slate-800 dark:prose-headings:text-slate-100 prose-a:text-secondary-600">
                <Markdown>{result.notes}</Markdown>
              </div>
            </div>

            <QuizSection topic={result.quizTopic || topic} />
          </div>

          {/* Sidebar - YouTube */}
          <div className="md:col-span-4 space-y-6">
            <div className="glass rounded-3xl p-6">
              <div className="flex items-center gap-3 text-red-500 mb-6">
                <Youtube className="w-6 h-6" />
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">YouTube Links</h3>
              </div>
              <div className="space-y-4">
                {result.youtubeSuggestions.map((vid, idx) => (
                  <a 
                    key={idx} 
                    href={vid.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="block p-4 rounded-2xl bg-white/40 dark:bg-slate-700/50 hover:bg-white/60 dark:hover:bg-slate-700/80 border border-white/50 dark:border-slate-600/50 transition-all group"
                  >
                    <p className="font-medium text-slate-800 dark:text-slate-200 group-hover:text-secondary-600 dark:group-hover:text-secondary-300 line-clamp-2">{vid.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
                      Watch Video <Search className="w-3 h-3" />
                    </p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}
      </div>

      {/* Hidden PDF Template — shown only when printing */}
      <div
        id="pdf-print-root"
        className="hidden print:block"
        style={{ display: 'none' }}
      >
        <PdfTemplate topic={topic} notes={result?.notes || ""} />
      </div>
    </>
  );
}

function QuizSection({ topic }: { topic: string }) {
  const { user } = useAuth();
  const { model } = useModel();
  const [goal, setGoal] = useState("JEE");
  const [count, setCount] = useState("5");
  const [loading, setLoading] = useState(false);
  const [quiz, setQuiz] = useState<{
    questions: { question: string; options: string[]; correctAnswerIndex: number; explanation: string; }[]
  } | null>(null);
  
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const generateQuiz = async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/study/quiz"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, examGoal: goal, numQuestions: parseInt(count), model })
      });
      const data = await res.json();
      setQuiz(data);
      setAnswers({});
      setSubmitted(false);
    } catch (error) {
      console.error(error);
      alert("Failed to generate quiz.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (qIndex: number, optIndex: number) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qIndex]: optIndex }));
  };

  const submitQuiz = async () => {
    setSubmitted(true);
    if (!quiz) return;
    
    let score = 0;
    quiz.questions.forEach((q, idx) => {
      if (answers[idx] === q.correctAnswerIndex) score++;
    });

    if (user) {
      try {
        await addDoc(collection(db, 'quizzes'), {
          userId: user.uid,
          topic,
          examGoal: goal,
          score,
          totalQuestions: quiz.questions.length,
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        console.error("Failed to save quiz score", err);
      }
    }
  };

  return (
    <div className="glass rounded-3xl p-8">
      <div className="flex items-center gap-3 text-primary-600 mb-6">
        <CheckCircle2 className="w-8 h-8" />
        <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Quiz Generator</h3>
      </div>
      
      {!quiz ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Exam Goal</label>
              <select 
                value={goal} onChange={(e) => setGoal(e.target.value)}
                className="w-full bg-white/50 dark:bg-slate-700/60 border border-white/60 dark:border-slate-600 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-2 outline-none focus:border-primary-400"
              >
                <option value="JEE">JEE</option>
                <option value="NEET">NEET</option>
                <option value="CUET">CUET</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Number of Questions</label>
              <select 
                value={count} onChange={(e) => setCount(e.target.value)}
                className="w-full bg-white/50 dark:bg-slate-700/60 border border-white/60 dark:border-slate-600 text-slate-800 dark:text-slate-100 rounded-xl px-4 py-2 outline-none focus:border-primary-400"
              >
                <option value="3">3</option>
                <option value="5">5</option>
                <option value="10">10</option>
              </select>
            </div>
          </div>
          <button 
            onClick={generateQuiz}
            disabled={loading}
            className="w-full bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Generate Quiz"}
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {submitted && (
            <div className="bg-primary-50 p-6 rounded-2xl text-center border border-primary-100">
              <h4 className="text-xl font-bold text-primary-800 mb-2">Quiz Completed!</h4>
              <p className="text-lg text-primary-600">
                You scored: <span className="font-extrabold">{Object.keys(answers).filter(k => answers[parseInt(k)] === quiz.questions[parseInt(k)].correctAnswerIndex).length}</span> out of {quiz.questions.length}
              </p>
            </div>
          )}

          {quiz.questions.map((q, qIndex) => (
            <div key={qIndex} className="space-y-3">
              <p className="font-bold text-slate-800 dark:text-slate-100 text-lg">{qIndex + 1}. {q.question}</p>
              <div className="space-y-2">
                {q.options.map((opt, oIndex) => {
                  const isSelected = answers[qIndex] === oIndex;
                  const isCorrect = q.correctAnswerIndex === oIndex;
                  let btnClass = "bg-white/40 dark:bg-slate-700/50 hover:bg-white/60 dark:hover:bg-slate-700/80 border-white/50 dark:border-slate-600/50 text-slate-700 dark:text-slate-200";
                  
                  if (submitted) {
                    if (isCorrect) btnClass = "bg-green-100 border-green-400 text-green-800 shadow-sm";
                    else if (isSelected) btnClass = "bg-red-100 border-red-400 text-red-800";
                  } else if (isSelected) {
                    btnClass = "bg-primary-100 border-primary-400 text-primary-800 shadow-sm";
                  }

                  return (
                    <button
                      key={oIndex}
                      onClick={() => handleSelectAnswer(qIndex, oIndex)}
                      disabled={submitted}
                      className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${btnClass}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              {submitted && (
                <div className="bg-slate-100/80 dark:bg-slate-700/60 backdrop-blur-sm rounded-xl p-4 text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                  <span className="font-bold">Explanation:</span> {q.explanation}
                </div>
              )}
            </div>
          ))}

          {!submitted ? (
            <button 
              onClick={submitQuiz}
              disabled={Object.keys(answers).length !== quiz.questions.length}
              className="w-full bg-secondary-500 hover:bg-secondary-600 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 shadow-md"
            >
              Submit Quiz
            </button>
          ) : (
            <button 
              onClick={() => setQuiz(null)}
              className="w-full bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-3 rounded-xl transition-all border border-slate-200 dark:border-slate-600 shadow-sm"
            >
              Take Another Quiz
            </button>
          )}
        </div>
      )}
    </div>
  );
}

