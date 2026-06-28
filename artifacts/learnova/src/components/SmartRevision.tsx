import { useState, useEffect } from "react";
import { Loader2, ArrowLeft, BrainCircuit, RefreshCw, Layers } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { motion, AnimatePresence } from "motion/react";
import Markdown from "react-markdown";
import { useModel } from "../lib/modelContext";

interface Flashcard {
  question: string;
  answer: string;
}

export function SmartRevision() {
  const { model } = useModel();
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  useEffect(() => {
    if (userData && userData.premiumStatus !== 'approved') {
      navigate('/');
    }
  }, [userData, navigate]);

  const generateCards = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setCards([]);
    setCurrentIndex(0);
    setIsFlipped(false);
    
    try {
      const res = await fetch("/api/study/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, model })
      });
      const data = await res.json();

      if (data.cards && Array.isArray(data.cards) && data.cards.length > 0) {
        setCards(data.cards);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to generate flashcards. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const nextCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, 150);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }, 150);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center gap-4 mb-2">
        <Link to="/" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">Smart Revision</h1>
          <p className="text-slate-500 mt-1">AI-generated flashcards for spaced repetition.</p>
        </div>
      </div>

      {!cards.length ? (
        <div className="bg-white/50 backdrop-blur-md rounded-3xl p-8 border border-white shadow-xl flex flex-col items-center justify-center min-h-[300px] text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 mb-6">
            <BrainCircuit className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-4">What do you want to revise?</h3>
          <div className="flex w-full max-w-md gap-2">
            <input 
              type="text" 
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Mitochondria, WW2, Vectors"
              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all"
            />
            <button 
              onClick={generateCards}
              disabled={!topic.trim() || loading}
              className="bg-primary-600 hover:bg-primary-700 text-white font-bold px-6 py-3 rounded-xl transition-all disabled:opacity-50 flex items-center justify-center shadow-md"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Generate"}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center max-w-2xl mx-auto">
          <div className="flex items-center justify-between w-full mb-6">
            <span className="text-sm font-bold text-slate-500 bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100">
              Card {currentIndex + 1} of {cards.length}
            </span>
            <button 
              onClick={() => setCards([])}
              className="text-sm font-bold text-secondary-600 hover:text-secondary-700 flex items-center gap-1"
            >
              <RefreshCw className="w-4 h-4" /> New Deck
            </button>
          </div>

          <div 
            className="w-full aspect-[4/3] relative perspective-1000 cursor-pointer"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <motion.div
              initial={false}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.4, type: "spring", stiffness: 260, damping: 20 }}
              className="w-full h-full relative preserve-3d"
            >
              {/* Front - Question */}
              <div className="absolute w-full h-full backface-hidden bg-white rounded-3xl shadow-xl border border-slate-100 p-8 flex flex-col items-center justify-center text-center">
                <Layers className="w-8 h-8 text-secondary-400 mb-6" />
                <h3 className="text-2xl font-bold text-slate-800 leading-snug">{cards[currentIndex].question}</h3>
                <p className="text-sm text-slate-400 mt-8 absolute bottom-8">Tap to reveal answer</p>
              </div>

              {/* Back - Answer */}
              <div className="absolute w-full h-full backface-hidden bg-primary-50 rounded-3xl shadow-xl border border-primary-100 p-8 flex flex-col items-center justify-center text-center [transform:rotateY(180deg)]">
                <BrainCircuit className="w-8 h-8 text-primary-500 mb-6" />
                <div className="text-lg font-medium text-slate-700 leading-relaxed overflow-y-auto max-h-[80%]">
                   <Markdown>{cards[currentIndex].answer}</Markdown>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="flex items-center gap-4 mt-8 w-full">
            <button 
              onClick={prevCard}
              className="flex-1 bg-white hover:bg-slate-50 text-slate-700 font-bold py-4 rounded-2xl shadow-sm border border-slate-200 transition-all"
            >
              Previous
            </button>
            <button 
              onClick={nextCard}
              className="flex-1 bg-secondary-600 hover:bg-secondary-700 text-white font-bold py-4 rounded-2xl shadow-md transition-all"
            >
              Next Card
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
