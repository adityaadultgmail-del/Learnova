import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { auth, db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { X, Trophy, LogOut, Loader2, Crown, Copy, Check, Hash, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';

export function ProfileModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { user, userData } = useAuth();
  const navigate = useNavigate();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      const fetchStats = async () => {
        setLoading(true);
        try {
          const q = query(collection(db, 'quizzes'), where('userId', '==', user.uid));
          const snap = await getDocs(q);
          setQuizzes(snap.docs.map(d => d.data()));
        } catch (error) {
          console.error("Error fetching quizzes:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchStats();
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const totalScore = quizzes.reduce((sum, q) => sum + q.score, 0);
  const totalQuestions = quizzes.reduce((sum, q) => sum + q.totalQuestions, 0);

  const copyCode = () => {
    if (userData?.userCode) {
      navigator.clipboard.writeText(userData.userCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative border border-slate-100 dark:border-slate-700"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col items-center mb-6">
              <div className="w-20 h-20 rounded-full bg-primary-100 dark:bg-primary-900/40 border-4 border-white dark:border-slate-600 flex items-center justify-center text-primary-600 dark:text-primary-300 font-bold text-3xl shadow-md mb-4 uppercase">
                {user.email?.[0] || 'U'}
              </div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{userData?.displayName || 'User'}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
              
              <div className="mt-3">
                {userData?.premiumStatus === 'approved' ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-primary-600 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/40 px-3 py-1 rounded-full border border-primary-200 dark:border-primary-800">
                    <Crown className="w-3 h-3" /> Premium Member
                  </span>
                ) : (
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full">
                    Free Plan
                  </span>
                )}
              </div>
            </div>

            {/* Friend Code */}
            {userData?.userCode && (
              <div className="bg-gradient-to-r from-[#0D3B94] to-[#1a52c9] rounded-2xl p-4 mb-5">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Hash className="w-3.5 h-3.5 text-yellow-300" />
                  <span className="text-xs font-semibold text-blue-200">Your Friend Code</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black tracking-widest text-yellow-300 font-mono">{userData.userCode}</span>
                  <button
                    onClick={copyCode}
                    className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 transition-colors px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>
            )}

            <div className="bg-slate-50 dark:bg-slate-700/60 rounded-2xl p-5 mb-4 border border-slate-100 dark:border-slate-600">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-secondary-500" /> Your Stats
              </h3>
              
              {loading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white dark:bg-slate-700 p-3 rounded-xl border border-slate-100 dark:border-slate-600 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Quizzes Taken</p>
                    <p className="text-2xl font-bold text-secondary-600 dark:text-secondary-400">{quizzes.length}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-700 p-3 rounded-xl border border-slate-100 dark:border-slate-600 text-center">
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Total Score</p>
                    <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">{totalScore} <span className="text-sm text-slate-400 dark:text-slate-500">/ {totalQuestions}</span></p>
                  </div>
                </div>
              )}
            </div>

            {/* Connections Button */}
            <button
              onClick={() => { onClose(); navigate("/connections"); }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-[#0D3B94] dark:text-blue-400 font-bold rounded-xl transition-colors mb-3"
            >
              <Users className="w-4 h-4" /> My Connections
            </button>

            <button 
              onClick={() => {
                auth.signOut();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 font-bold rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
