import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Bot, User, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import Markdown from "react-markdown";
import { motion } from "motion/react";

export function DoubtSolving() {
  const { userData } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<{ role: 'user' | 'model', content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (userData && userData.premiumStatus !== 'approved') {
      navigate('/');
    }
  }, [userData, navigate]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/study/doubt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doubt: userMsg })
      });
      const data = await res.json();

      if (data.text) {
        setMessages(prev => [...prev, { role: 'model', content: data.text }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', content: "Sorry, I couldn't process that right now. Please try again later." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[80vh]">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/" className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">24/7 Doubt Solving</h1>
          <p className="text-slate-500 text-sm">Ask any question and get instant clarity.</p>
        </div>
      </div>

      <div className="flex-1 bg-white/60 backdrop-blur-md border border-white rounded-3xl shadow-xl p-4 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <Bot className="w-16 h-16 mb-4 opacity-50" />
              <p>What's your doubt for today?</p>
            </div>
          )}
          
          {messages.map((msg, i) => (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              key={i} 
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-secondary-500 text-white' : 'bg-primary-100 text-primary-600'}`}>
                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              <div className={`px-5 py-3 rounded-2xl max-w-[80%] ${msg.role === 'user' ? 'bg-secondary-500 text-white rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
                {msg.role === 'user' ? (
                  msg.content
                ) : (
                  <div className="prose prose-sm prose-slate max-w-none">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex gap-4">
               <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5" />
               </div>
               <div className="bg-slate-100 px-5 py-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                 <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                 <span className="text-sm text-slate-500 font-medium">Thinking...</span>
               </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="p-2 border-t border-slate-100 bg-white/50 mt-2 rounded-2xl flex gap-2">
          <input 
            type="text" 
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Type your doubt here..."
            className="flex-1 bg-transparent px-4 py-3 outline-none"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || loading}
            className="bg-secondary-600 hover:bg-secondary-700 text-white p-3 rounded-xl transition-colors disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
