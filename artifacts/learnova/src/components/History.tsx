import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../lib/auth";
import { db } from "../lib/firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { History as HistoryIcon, BookOpen, Trash2, Youtube, Clock, Search, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Markdown from "react-markdown";

interface HistoryEntry {
  id: string;
  topic: string;
  notesPreview: string;
  youtubeSuggestions: { title: string; url: string }[];
  quizTopic: string;
  model: string;
  searchedAt: string;
}

export function History() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "studyHistory", user.uid, "entries"),
      orderBy("searchedAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      setEntries(
        snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<HistoryEntry, "id">) }))
      );
      setLoading(false);
    });

    return () => unsub();
  }, [user, authLoading]);

  const handleDelete = async (entryId: string) => {
    if (!user) return;
    setDeleting(entryId);
    try {
      await deleteDoc(doc(db, "studyHistory", user.uid, "entries", entryId));
    } catch (err) {
      console.error("Failed to delete entry", err);
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 animate-spin text-secondary-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 space-y-4">
        <HistoryIcon className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300">Sign in to view your history</h2>
        <p className="text-slate-500 dark:text-slate-400">Your studied topics will be saved here once you log in.</p>
        <Link
          to="/"
          className="inline-block mt-2 bg-secondary-600 hover:bg-secondary-700 text-white px-6 py-2.5 rounded-full font-semibold transition-all"
        >
          Go Home
        </Link>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="max-w-lg mx-auto text-center py-20 space-y-4">
        <BookOpen className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto" />
        <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300">No history yet</h2>
        <p className="text-slate-500 dark:text-slate-400">Topics you study in Text Mode will appear here.</p>
        <Link
          to="/text"
          className="inline-flex items-center gap-2 mt-2 bg-secondary-600 hover:bg-secondary-700 text-white px-6 py-2.5 rounded-full font-semibold transition-all"
        >
          <Search className="w-4 h-4" />
          Start Studying
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <HistoryIcon className="w-7 h-7 text-secondary-600 dark:text-secondary-400" />
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">Study History</h2>
          <span className="text-sm font-semibold bg-secondary-100 dark:bg-secondary-900/40 text-secondary-700 dark:text-secondary-300 px-2.5 py-1 rounded-full">
            {entries.length} topic{entries.length !== 1 ? "s" : ""}
          </span>
        </div>
        <Link
          to="/text"
          className="flex items-center gap-2 bg-secondary-600 hover:bg-secondary-700 text-white px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-sm"
        >
          <Search className="w-4 h-4" />
          <span className="hidden sm:inline">Study New Topic</span>
          <span className="sm:hidden">New</span>
        </Link>
      </motion.div>

      <div className="space-y-4">
        {entries.map((entry, i) => (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="glass rounded-2xl overflow-hidden"
          >
            {/* Header row */}
            <div className="flex items-start gap-3 p-4 sm:p-5">
              <div className="w-10 h-10 rounded-xl bg-secondary-100 dark:bg-secondary-900/40 flex items-center justify-center shrink-0 mt-0.5">
                <BookOpen className="w-5 h-5 text-secondary-600 dark:text-secondary-400" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg leading-tight truncate">
                  {entry.topic}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-slate-400 dark:text-slate-500">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  <span>{formatDate(entry.searchedAt)}</span>
                  {entry.model && (
                    <>
                      <span>·</span>
                      <span className="font-medium bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-full text-slate-500 dark:text-slate-400">
                        {entry.model.split("-").slice(0, 2).join(" ")}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() =>
                    navigate("/text", { state: { prefillTopic: entry.topic } })
                  }
                  className="text-xs font-semibold bg-secondary-50 dark:bg-secondary-900/30 text-secondary-600 dark:text-secondary-400 hover:bg-secondary-100 dark:hover:bg-secondary-900/60 px-3 py-1.5 rounded-full transition-colors"
                >
                  Re-study
                </button>
                <button
                  onClick={() =>
                    setExpanded(expanded === entry.id ? null : entry.id)
                  }
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-400 transition-colors"
                >
                  {expanded === entry.id ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleDelete(entry.id)}
                  disabled={deleting === entry.id}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
                >
                  {deleting === entry.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Expanded panel */}
            <AnimatePresence>
              {expanded === entry.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-white/60 dark:border-slate-700 px-4 sm:px-5 py-4 space-y-4">
                    {entry.notesPreview && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Notes Preview</p>
                        <div className="prose prose-sm prose-slate dark:prose-invert max-w-none line-clamp-6">
                          <Markdown>{entry.notesPreview + (entry.notesPreview.length >= 300 ? "…" : "")}</Markdown>
                        </div>
                      </div>
                    )}

                    {entry.youtubeSuggestions?.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Youtube className="w-3.5 h-3.5 text-red-500" /> YouTube Links
                        </p>
                        <div className="flex flex-col gap-2">
                          {entry.youtubeSuggestions.slice(0, 3).map((v, idx) => (
                            <a
                              key={idx}
                              href={v.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm text-secondary-600 dark:text-secondary-400 hover:underline truncate"
                            >
                              {v.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
