import { Link, Outlet } from "react-router-dom";
import { ChevronDown, Moon, Sun } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../lib/auth";
import { LoginModal } from "./LoginModal";
import { ProfileModal } from "./ProfileModal";
import { auth, db } from "../lib/firebase";
import { collection, doc, setDoc } from "firebase/firestore";
import { useModel, GROQ_MODELS, type GroqModelId } from "../lib/modelContext";
import { useDarkMode } from "../lib/useDarkMode";

export function Layout() {
  const { user, userData } = useAuth();
  const { model, setModel } = useModel();
  const { dark, toggle: toggleDark } = useDarkMode();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [loadingUpgrade, setLoadingUpgrade] = useState(false);
  const [modelOpen, setModelOpen] = useState(false);

  const activeModel = GROQ_MODELS.find(m => m.id === model)!;

  const handleUpgrade = async () => {
    if (!user) {
      setIsLoginOpen(true);
      return;
    }

    if (userData?.premiumStatus === 'pending') {
      alert("Your premium request is already pending approval.");
      return;
    }

    if (userData?.premiumStatus === 'approved') {
      alert("You are already a premium member!");
      return;
    }

    setLoadingUpgrade(true);
    try {
      await setDoc(doc(db, 'users', user.uid), { premiumStatus: 'pending' }, { merge: true });
      await setDoc(doc(collection(db, 'premiumRequests')), {
        userId: user.uid,
        userEmail: user.email,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      alert("Premium request submitted successfully! An admin will review it.");
    } catch (error) {
      console.error(error);
      alert("Failed to submit request.");
    } finally {
      setLoadingUpgrade(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 h-16 border-b border-secondary-100 dark:border-slate-700 bg-white/40 dark:bg-slate-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 transition-colors group">
            <img
              src="/logo.png"
              alt="Learnova"
              className="w-10 h-10 object-contain group-hover:scale-105 transition-transform"
            />
            <span className="text-xl font-bold text-[#0D3B94] dark:text-secondary-300">
              Lear<span className="text-[#FFB300]">nova</span>
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-secondary-600 dark:hover:text-secondary-300 transition-colors">Home</Link>

            {/* Model Selector */}
            <div className="relative">
              <button
                onClick={() => setModelOpen(o => !o)}
                className="flex items-center gap-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-full transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                {activeModel.label}
                <span className="text-[10px] font-bold text-primary-600 bg-primary-100 dark:bg-primary-900 dark:text-primary-300 px-1.5 py-0.5 rounded-full">{activeModel.badge}</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${modelOpen ? "rotate-180" : ""}`} />
              </button>
              {modelOpen && (
                <div className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden">
                  {GROQ_MODELS.map(m => (
                    <button
                      key={m.id}
                      onClick={() => { setModel(m.id as GroqModelId); setModelOpen(false); }}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-slate-50 dark:hover:bg-slate-700 ${model === m.id ? "bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-semibold" : "text-slate-700 dark:text-slate-300"}`}
                    >
                      <span>{m.label}</span>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-600 px-1.5 py-0.5 rounded-full">{m.badge}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Dark Mode Toggle */}
            <button
              onClick={toggleDark}
              aria-label="Toggle dark mode"
              className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-primary-300 transition-all"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            
            {userData?.premiumStatus === 'approved' ? (
              <span className="text-sm font-bold text-primary-600 bg-primary-100 dark:bg-primary-900/40 dark:text-primary-300 px-4 py-1.5 rounded-full">Premium ✨</span>
            ) : userData?.premiumStatus === 'pending' ? (
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-4 py-1.5 rounded-full">Request Pending</span>
            ) : (
              <button 
                onClick={handleUpgrade}
                disabled={loadingUpgrade}
                className="bg-secondary-600 hover:bg-secondary-700 text-white px-5 py-2 rounded-full text-sm font-semibold shadow-md transition-all disabled:opacity-70"
              >
                {loadingUpgrade ? 'Processing...' : 'Upgrade to Premium ✨'}
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsProfileOpen(true)}
                  className="w-10 h-10 rounded-full bg-primary-400 border-2 border-white dark:border-slate-600 flex items-center justify-center font-bold text-secondary-900 cursor-pointer shadow-sm text-sm uppercase hover:scale-105 transition-transform"
                >
                  {user.email?.[0] || 'U'}
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsLoginOpen(true)}
                className="text-sm font-bold text-secondary-600 dark:text-secondary-300 hover:text-secondary-700 dark:hover:text-secondary-200 transition-colors"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-secondary-100 dark:border-slate-700 bg-white/40 dark:bg-slate-900/80 backdrop-blur-md mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <img src="/coffee-to-code.jpeg" alt="Coffee To Code" className="w-8 h-8 rounded-full object-cover" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">A Part Of Coffee To Code</span>
            </div>
            <div className="h-3 w-[1px] bg-slate-200 dark:bg-slate-600"></div>
            <a href="mailto:coffee.to.code26@gmail.com" className="text-xs text-slate-400 dark:text-slate-500 hover:text-secondary-500 transition-colors">coffee.to.code26@gmail.com</a>
          </div>
          <div className="flex items-center gap-6">
            <a href="https://github.com/CoffeetoCode26" target="_blank" rel="noopener noreferrer" className="text-xs text-secondary-500 dark:text-secondary-400 hover:underline">GitHub</a>
            <a href="https://www.instagram.com/coffee_code.2.6?utm_source=qr&igsh=MTZuaDdzZXQ5NWd2Nw==" target="_blank" rel="noopener noreferrer" className="text-xs text-secondary-500 dark:text-secondary-400 hover:underline">Instagram</a>
            <div className="h-3 w-[1px] bg-slate-200 dark:bg-slate-600"></div>
            {userData?.role === 'admin' && (
              <Link to="/admin" className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-secondary-600 uppercase tracking-tight transition-colors">Admin Panel</Link>
            )}
          </div>
        </div>
      </footer>
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
}
