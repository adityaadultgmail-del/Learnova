import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";
import { Mic, Square, Play, Pause, RefreshCw, Loader2, Volume2, Sparkles } from "lucide-react";

export function VoiceMode() {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [history, setHistory] = useState<{role: string, text: string}[]>([]);
  
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        if (transcript) {
          handleVoiceSubmit(transcript);
        }
      };
      
      recognitionRef.current.onerror = (e: any) => {
        console.error("Speech recognition error:", e.error);
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
      window.speechSynthesis.cancel();
    };
  }, [transcript]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setTranscript("");
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  const handleVoiceSubmit = async (text: string) => {
    setIsProcessing(true);
    try {
      setHistory(prev => [...prev, { role: 'user', text }]);
      
      const res = await fetch("/api/study/voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, history })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || `API error: ${res.status}`);
      }
      
      setAiResponse(data.text);
      setHistory(prev => [...prev, { role: 'ai', text: data.text }]);
      speakText(data.text);
    } catch (error: any) {
      console.error(error);
      alert(`Failed to process voice query: ${error.message || "Unknown error"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const speakText = (text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    synthesisRef.current = utterance;
    
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.includes('en-') && v.name.includes('Google')) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;
    
    window.speechSynthesis.speak(utterance);
  };

  const togglePlayback = () => {
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      } else if (aiResponse) {
        speakText(aiResponse);
      }
      setIsPlaying(true);
    }
  };
  
  const replay = () => {
    if (aiResponse) speakText(aiResponse);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-8">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-extrabold text-slate-800">Voice Mode</h2>
        <p className="text-slate-600">Speak naturally to your AI tutor for language practice and quick answers.</p>
      </div>

      <div className="bg-white/40 backdrop-blur-md rounded-[3rem] p-12 flex flex-col items-center justify-center relative overflow-hidden min-h-[450px] border border-white shadow-xl shadow-secondary-100/50">
        {/* Animated Background Rings when listening */}
        {isListening && (
          <>
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 2.5, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
              className="absolute w-40 h-40 bg-secondary-400/20 rounded-full z-0"
            />
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ repeat: Infinity, duration: 2, delay: 0.5, ease: "easeOut" }}
              className="absolute w-40 h-40 bg-primary-400/20 rounded-full z-0"
            />
          </>
        )}

        <div className="relative z-10 flex flex-col items-center gap-12 w-full">
          <button
            onClick={toggleListening}
            disabled={isProcessing}
            className={`w-32 h-32 rounded-full flex items-center justify-center shadow-2xl transition-all ${
              isListening 
                ? "bg-red-500 hover:bg-red-600 animate-pulse text-white shadow-red-500/40" 
                : "bg-gradient-to-br from-secondary-500 to-secondary-600 hover:scale-105 text-white shadow-secondary-500/40"
            } disabled:opacity-50 disabled:hover:scale-100`}
          >
            {isProcessing ? (
              <Loader2 className="w-12 h-12 animate-spin text-white/80" />
            ) : isListening ? (
              <Square className="w-12 h-12 fill-current" />
            ) : (
              <Mic className="w-14 h-14" />
            )}
          </button>

          <div className="text-center w-full max-w-2xl min-h-[120px] flex flex-col items-center justify-start">
            {isListening ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div className="flex justify-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: ["10px", "30px", "10px"] }}
                      transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }}
                      className="w-1.5 bg-secondary-500 rounded-full"
                    />
                  ))}
                </div>
                <p className="text-slate-600 text-lg font-medium italic">"{transcript}"</p>
              </motion.div>
            ) : isProcessing ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="text-secondary-600 font-bold flex items-center justify-center gap-3 text-xl">
                  <Loader2 className="w-6 h-6 animate-spin" /> AI is thinking...
                </p>
              </motion.div>
            ) : aiResponse ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 w-full">
                <div className="bg-white/70 backdrop-blur-sm p-6 rounded-3xl shadow-sm border border-white text-left relative">
                  <Sparkles className="absolute top-6 left-6 w-5 h-5 text-primary-500" />
                  <p className="text-slate-800 font-medium text-lg pl-8 leading-relaxed">
                    {aiResponse}
                  </p>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <button 
                    onClick={togglePlayback}
                    className="flex items-center gap-2 px-6 py-3 bg-secondary-100 hover:bg-secondary-200 text-secondary-700 rounded-full transition-colors font-bold shadow-sm"
                  >
                    {isPlaying ? <><Pause className="w-5 h-5" /> Pause</> : <><Play className="w-5 h-5" /> Listen</>}
                  </button>
                  <button 
                    onClick={replay}
                    className="p-3 bg-white hover:bg-slate-50 text-slate-600 rounded-full transition-colors border border-slate-200 shadow-sm"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <p className="text-slate-400 font-medium">Tap the microphone to start speaking</p>
            )}
          </div>
        </div>
      </div>
      
      {!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) && (
        <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-center text-sm font-medium border border-red-100">
          Your browser does not support Voice Recognition. Please try using Google Chrome.
        </div>
      )}
    </div>
  );
}
