import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../lib/auth";
import { db } from "../lib/firebase";
import {
  doc, collection, onSnapshot, addDoc, updateDoc,
  setDoc, getDoc, serverTimestamp, query, orderBy,
} from "firebase/firestore";
import {
  ArrowLeft, BookOpen, Send, Loader2, Users,
  Sparkles, AlertCircle, RotateCcw, Crown,
} from "lucide-react";

interface Turn {
  id: string;
  question: string;
  askedBy: string;
  askedByName: string;
  response: string;
  status: "pending" | "answered" | "error";
  createdAt: string;
}

interface SessionDoc {
  participants: string[];
  participantNames: Record<string, string>;
  status: "active" | "ended";
  createdBy: string;
  topic?: string;
}

function getSessionId(uid1: string, uid2: string) {
  return [uid1, uid2].sort().join("_");
}

const BASE_URL = import.meta.env.BASE_URL ?? "/";

export function StudySession() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [params] = useSearchParams();
  const friendName = params.get("friendName") || "Friend";
  const friendUid = params.get("friendUid") || "";
  const navigate = useNavigate();
  const { user, userData } = useAuth();

  const [session, setSession] = useState<SessionDoc | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Create or join session
  useEffect(() => {
    if (!user || !sessionId) return;
    const sessionRef = doc(db, "studySessions", sessionId);
    const init = async () => {
      try {
        const snap = await getDoc(sessionRef);
        const myName = userData?.displayName || user.email?.split("@")[0] || "User";
        if (!snap.exists()) {
          await setDoc(sessionRef, {
            participants: [user.uid, friendUid].filter(Boolean),
            participantNames: {
              [user.uid]: myName,
              ...(friendUid ? { [friendUid]: friendName } : {}),
            },
            status: "active",
            createdBy: user.uid,
            createdAt: new Date().toISOString(),
          });
        } else {
          // Ensure my name is in the doc (friend joining)
          const data = snap.data() as SessionDoc;
          if (!data.participantNames?.[user.uid]) {
            await updateDoc(sessionRef, {
              [`participantNames.${user.uid}`]: myName,
            });
          }
        }
      } catch (e) {
        console.error("Session init error", e);
      } finally {
        setSessionLoading(false);
      }
    };
    init();
  }, [user, sessionId, friendUid, friendName, userData]);

  // Listen to session doc
  useEffect(() => {
    if (!sessionId) return;
    const unsub = onSnapshot(doc(db, "studySessions", sessionId), (snap) => {
      if (snap.exists()) setSession(snap.data() as SessionDoc);
    });
    return unsub;
  }, [sessionId]);

  // Listen to turns
  useEffect(() => {
    if (!sessionId) return;
    const q = query(
      collection(db, "studySessions", sessionId, "turns"),
      orderBy("createdAt", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setTurns(snap.docs.map(d => ({ id: d.id, ...d.data() } as Turn)));
    });
    return unsub;
  }, [sessionId]);

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns]);

  const askQuestion = async () => {
    if (!question.trim() || asking || !user || !sessionId) return;
    const q = question.trim();
    setQuestion("");
    setAsking(true);
    setError("");

    // Save turn with pending status
    const turnRef = await addDoc(
      collection(db, "studySessions", sessionId, "turns"),
      {
        question: q,
        askedBy: user.uid,
        askedByName: userData?.displayName || user.email?.split("@")[0] || "User",
        response: "",
        status: "pending",
        createdAt: new Date().toISOString(),
      }
    );

    try {
      const apiBase = BASE_URL.replace(/\/$/, "");
      const res = await fetch(`${apiBase}/api/study/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      await updateDoc(doc(db, "studySessions", sessionId, "turns", turnRef.id), {
        response: data.answer || "No response.",
        status: "answered",
      });
    } catch {
      await updateDoc(doc(db, "studySessions", sessionId, "turns", turnRef.id), {
        response: "Sorry, couldn't get an answer. Please try again.",
        status: "error",
      });
      setError("AI couldn't respond. Please try again.");
    } finally {
      setAsking(false);
      inputRef.current?.focus();
    }
  };

  const endSession = async () => {
    if (!sessionId) return;
    await updateDoc(doc(db, "studySessions", sessionId), { status: "ended" });
    navigate("/connections");
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-center">
        <Users className="w-14 h-14 text-slate-300" />
        <p className="text-slate-600 dark:text-slate-300 font-semibold">Sign in to join a study session</p>
      </div>
    );
  }

  if (sessionLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#0D3B94]" />
        <p className="text-slate-500 dark:text-slate-400">Setting up session…</p>
      </div>
    );
  }

  const participants = session?.participantNames
    ? Object.values(session.participantNames)
    : [userData?.displayName || "You", friendName];

  const isEnded = session?.status === "ended";

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 rounded-t-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/connections")}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0D3B94] to-purple-600 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">Study Session</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{participants.join(" & ")}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isEnded ? (
            <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">Ended</span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-3 py-1 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              Live
            </span>
          )}
          {!isEnded && (
            <button
              onClick={endSession}
              className="text-xs text-red-500 hover:text-red-600 dark:hover:text-red-400 font-bold px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
            >
              End Session
            </button>
          )}
        </div>
      </div>

      {/* Turns */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-slate-50 dark:bg-slate-900/50">
        {turns.length === 0 && !isEnded && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full gap-4 text-center py-16"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0D3B94] to-purple-600 flex items-center justify-center shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-700 dark:text-slate-200 text-lg">Session started!</h3>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">
                Ask anything — both of you will see the AI's answer live.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap justify-center mt-2">
              {["Explain photosynthesis simply", "What is Newton's 3rd law?", "How does recursion work?"].map(s => (
                <button
                  key={s}
                  onClick={() => setQuestion(s)}
                  className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 hover:border-[#0D3B94] dark:hover:border-blue-500 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-full transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {isEnded && turns.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-16">
            <RotateCcw className="w-10 h-10 text-slate-300" />
            <p className="text-slate-500 dark:text-slate-400">This session has ended.</p>
            <button onClick={() => navigate("/connections")} className="text-sm font-bold text-[#0D3B94] dark:text-blue-400 hover:underline">
              Back to Connections
            </button>
          </div>
        )}

        <AnimatePresence>
          {turns.map((turn) => (
            <motion.div
              key={turn.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              {/* Question bubble */}
              <div className="flex items-start gap-2 justify-end">
                <div className="max-w-[80%]">
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-1 text-right font-medium">{turn.askedByName}</p>
                  <div className="bg-[#0D3B94] text-white px-4 py-2.5 rounded-2xl rounded-tr-sm shadow-sm">
                    <p className="text-sm leading-relaxed">{turn.question}</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#0D3B94]/20 flex items-center justify-center text-[#0D3B94] dark:text-blue-400 font-bold text-xs uppercase shrink-0 mt-5">
                  {turn.askedByName[0]}
                </div>
              </div>

              {/* AI Answer */}
              <div className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-[#0D3B94] flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="max-w-[85%]">
                  <p className="text-xs text-slate-400 dark:text-slate-500 mb-1 font-medium">Learnova AI</p>
                  {turn.status === "pending" ? (
                    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-sm">Thinking…</span>
                        <div className="flex gap-1 ml-1">
                          {[0, 1, 2].map(i => (
                            <motion.div
                              key={i}
                              className="w-1.5 h-1.5 rounded-full bg-slate-300"
                              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                              transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : turn.status === "error" ? (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 rounded-2xl rounded-tl-sm">
                      <div className="flex items-center gap-2 text-red-500 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {turn.response}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
                      <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">{turn.response}</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {!isEnded ? (
        <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 rounded-b-2xl">
          {error && (
            <p className="text-xs text-red-500 mb-2 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {error}
            </p>
          )}
          <div className="flex gap-3 items-end">
            <textarea
              ref={inputRef}
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); askQuestion(); }
              }}
              placeholder="Ask anything — both of you will see the AI answer…"
              rows={2}
              disabled={asking}
              className="flex-1 resize-none bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-2xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0D3B94] dark:focus:ring-blue-500 transition-all placeholder:text-slate-400 disabled:opacity-60"
            />
            <button
              onClick={askQuestion}
              disabled={!question.trim() || asking}
              className="flex-shrink-0 w-11 h-11 bg-[#0D3B94] hover:bg-[#0a2f7a] disabled:opacity-50 text-white rounded-2xl flex items-center justify-center transition-colors shadow-sm"
            >
              {asking ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center">
            Enter to send · Shift+Enter for new line · Both participants see answers live
          </p>
        </div>
      ) : (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-700 rounded-b-2xl text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Session ended · {turns.length} questions answered</p>
          <button onClick={() => navigate("/connections")} className="text-sm font-bold text-[#0D3B94] dark:text-blue-400 hover:underline">
            ← Back to Connections
          </button>
        </div>
      )}
    </div>
  );
}
