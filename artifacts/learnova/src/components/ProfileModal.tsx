import { useState, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { auth, db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { X, Trophy, LogOut, Loader2, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function ProfileModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const { user, userData } = useAuth();
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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

            <div className="bg-slate-50 dark:bg-slate-700/60 rounded-2xl p-5 mb-6 border border-slate-100 dark:border-slate-600">
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
