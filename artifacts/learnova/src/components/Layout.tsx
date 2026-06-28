import { Link, Outlet } from "react-router-dom";
import { ChevronDown, Moon, Sun, Menu, X } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../lib/auth";
import { LoginModal } from "./LoginModal";
import { ProfileModal } from "./ProfileModal";
import { db } from "../lib/firebase";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeModel = GROQ_MODELS.find(m => m.id === model)!;

  const handleUpgrade = async () => {
    if (!user) {
      setIsLoginOpen(true);
      setMobileMenuOpen(false);
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
      alert("Premium request submitted! An admin will review it.");
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
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 transition-colors group shrink-0">
            <img
              src="/logo.png"
              alt="Learnova"
              className="w-9 h-9 object-contain group-hover:scale-105 transition-transform"
            />
            <span className="text-xl font-bold text-[#0D3B94] dark:text-secondary-300">
              Lear<span className="text-[#FFB300]">nova</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            <Link to="/" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-secondary-600 dark:hover:text-secondary-300 transition-colors">
              Home
            </Link>

            {/* Model Selector */}
            <div className="relative">
              <button
                onClick={() => setModelOpen(o => !o)}
                className="flex items-center gap-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-3 py-1.5 rounded-full transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <span className="max-w-[80px] truncate">{activeModel.label}</span>
                <span className="text-[10px] font-bold text-primary-600 bg-primary-100 dark:bg-primary-900 dark:text-primary-300 px-1.5 py-0.5 rounded-full hidden lg:inline">
                  {activeModel.badge}
                </span>
                <ChevronDown className={`w-3 h-3 transition-transform shrink-0 ${modelOpen ? "rotate-180" : ""}`} />
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

            {/* Dark Mode */}
            <button
              onClick={toggleDark}
              aria-label="Toggle dark mode"
              className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-primary-300 transition-all shrink-0"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Premium Badge / Upgrade Button */}
            {userData?.premiumStatus === 'approved' ? (
              <span className="text-sm font-bold text-primary-600 bg-primary-100 dark:bg-primary-900/40 dark:text-primary-300 px-4 py-1.5 rounded-full whitespace-nowrap">Premium ✨</span>
            ) : userData?.premiumStatus === 'pending' ? (
              <span className="text-sm font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-4 py-1.5 rounded-full whitespace-nowrap">Pending</span>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={loadingUpgrade}
                className="bg-secondary-600 hover:bg-secondary-700 text-white px-4 py-2 rounded-full text-sm font-semibold shadow-md transition-all disabled:opacity-70 whitespace-nowrap"
              >
                {loadingUpgrade ? 'Processing...' : 'Upgrade ✨'}
              </button>
            )}

            {/* User / Login */}
            {user ? (
              <button
                onClick={() => setIsProfileOpen(true)}
                className="w-10 h-10 rounded-full bg-primary-400 border-2 border-white dark:border-slate-600 flex items-center justify-center font-bold text-secondary-900 cursor-pointer shadow-sm text-sm uppercase hover:scale-105 transition-transform shrink-0"
              >
                {user.displayName?.[0] || user.email?.[0] || 'U'}
              </button>
            ) : (
              <button
                onClick={() => setIsLoginOpen(true)}
                className="text-sm font-bold text-secondary-600 dark:text-secondary-300 hover:text-secondary-700 dark:hover:text-secondary-200 transition-colors"
              >
                Login
              </button>
            )}
          </div>

          {/* Mobile: dark mode + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleDark}
              aria-label="Toggle dark mode"
              className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-primary-300 transition-all"
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            {user ? (
              <button
                onClick={() => setIsProfileOpen(true)}
                className="w-9 h-9 rounded-full bg-primary-400 border-2 border-white dark:border-slate-600 flex items-center justify-center font-bold text-secondary-900 text-sm uppercase shadow-sm"
              >
                {user.displayName?.[0] || user.email?.[0] || 'U'}
              </button>
            ) : null}
            <button
              onClick={() => setMobileMenuOpen(o => !o)}
              aria-label="Toggle menu"
              className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-700 px-4 py-4 space-y-3 shadow-lg">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-secondary-600 py-2"
            >
              Home
            </Link>

            {/* Model Selector mobile */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">AI Model</p>
              <div className="grid grid-cols-1 gap-1">
                {GROQ_MODELS.map(m => (
                  <button
                    key={m.id}
                    onClick={() => { setModel(m.id as GroqModelId); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm rounded-xl transition-colors ${model === m.id ? "bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-semibold" : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
                  >
                    <span className="flex items-center gap-2">
                      {model === m.id && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />}
                      {m.label}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded-full">{m.badge}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-700 pt-3">
              {userData?.premiumStatus === 'approved' ? (
                <span className="block text-sm font-bold text-primary-600 bg-primary-100 dark:bg-primary-900/40 dark:text-primary-300 px-4 py-2 rounded-full text-center">Premium ✨</span>
              ) : userData?.premiumStatus === 'pending' ? (
                <span className="block text-sm font-bold text-slate-500 bg-slate-100 dark:bg-slate-700 px-4 py-2 rounded-full text-center">Request Pending</span>
              ) : (
                <button
                  onClick={() => { handleUpgrade(); setMobileMenuOpen(false); }}
                  disabled={loadingUpgrade}
                  className="w-full bg-secondary-600 hover:bg-secondary-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-md transition-all disabled:opacity-70 text-center"
                >
                  {loadingUpgrade ? 'Processing...' : 'Upgrade to Premium ✨'}
                </button>
              )}

              {!user && (
                <button
                  onClick={() => { setIsLoginOpen(true); setMobileMenuOpen(false); }}
                  className="w-full mt-2 text-sm font-bold text-secondary-600 dark:text-secondary-300 hover:text-secondary-700 py-2 text-center"
                >
                  Login / Sign Up
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Outlet />
      </main>

      <footer className="border-t border-secondary-100 dark:border-slate-700 bg-white/40 dark:bg-slate-900/80 backdrop-blur-md mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <div className="flex items-center gap-2">
              <img src="/coffee-to-code.jpeg" alt="Coffee To Code" className="w-8 h-8 rounded-full object-cover" />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">A Part Of Coffee To Code</span>
            </div>
            <div className="hidden sm:block h-3 w-[1px] bg-slate-200 dark:bg-slate-600"></div>
            <a href="mailto:coffee.to.code26@gmail.com" className="text-xs text-slate-400 dark:text-slate-500 hover:text-secondary-500 transition-colors">
              coffee.to.code26@gmail.com
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://github.com/CoffeetoCode26" target="_blank" rel="noopener noreferrer" className="text-xs text-secondary-500 dark:text-secondary-400 hover:underline">GitHub</a>
            <a href="https://www.instagram.com/coffee_code.2.6?utm_source=qr&igsh=MTZuaDdzZXQ5NWd2Nw==" target="_blank" rel="noopener noreferrer" className="text-xs text-secondary-500 dark:text-secondary-400 hover:underline">Instagram</a>
            {userData?.role === 'admin' && (
              <>
                <div className="h-3 w-[1px] bg-slate-200 dark:bg-slate-600"></div>
                <Link to="/admin" className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-secondary-600 uppercase tracking-tight transition-colors">Admin Panel</Link>
              </>
            )}
          </div>
        </div>
      </footer>

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
}
