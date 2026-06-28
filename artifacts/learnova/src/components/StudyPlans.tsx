import { useState, useEffect } from "react";
import { Loader2, Calendar as CalendarIcon, ArrowLeft, Target, Clock, BookOpen } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import Markdown from "react-markdown";
import { useModel } from "../lib/modelContext";

export function StudyPlans() {
  const { model } = useModel();
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const [timeframe, setTimeframe] = useState("1 Week");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState("");

  useEffect(() => {
    if (userData && userData.premiumStatus !== 'approved') {
      navigate('/');
    }
  }, [userData, navigate]);

  const generatePlan = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setPlan("");
    
    try {
      const res = await fetch("/api/study/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, timeframe, model })
      });
      const data = await res.json();

      if (data.plan) {
        setPlan(data.plan);
      }
    } catch (error) {
      console.error(error);
      setPlan("Failed to generate plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4 mb-2">
        <Link to="/" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">Personalized Study Plans</h1>
          <p className="text-slate-500 mt-1">Get an AI-generated roadmap tailored to your exams.</p>
        </div>
      </div>

      <div className="bg-white/50 backdrop-blur-md rounded-3xl p-8 border border-white shadow-xl">
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <Target className="w-4 h-4 text-secondary-500" /> Topic or Exam Goal
            </label>
            <input 
              type="text" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Organic Chemistry, React, JEE Mains"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-500" /> Timeframe
            </label>
            <select 
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-200 transition-all"
            >
              <option value="3 Days">3 Days (Crash Course)</option>
              <option value="1 Week">1 Week</option>
              <option value="1 Month">1 Month</option>
              <option value="3 Months">3 Months</option>
              <option value="6 Months">6 Months</option>
            </select>
          </div>
        </div>

        <button 
          onClick={generatePlan}
          disabled={!topic.trim() || loading}
          className="w-full bg-secondary-600 hover:bg-secondary-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CalendarIcon className="w-5 h-5" /> Generate My Roadmap</>}
        </button>
      </div>

      {plan && (
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-lg">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">Your Action Plan</h2>
          </div>
          <div className="prose prose-slate max-w-none prose-headings:text-slate-800 prose-a:text-secondary-600">
            <Markdown>{plan}</Markdown>
          </div>
        </div>
      )}
    </div>
  );
}
