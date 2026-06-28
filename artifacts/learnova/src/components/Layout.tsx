import { Link, Outlet } from "react-router-dom";
import { BookOpen } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { useAuth } from "../lib/auth";
import { LoginModal } from "./LoginModal";
import { ProfileModal } from "./ProfileModal";
import { auth, db } from "../lib/firebase";
import { collection, doc, setDoc } from "firebase/firestore";

export function Layout() {
  const { user, userData } = useAuth();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [loadingUpgrade, setLoadingUpgrade] = useState(false);

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
      <header className="sticky top-0 z-50 h-16 border-b border-secondary-100 bg-white/40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 transition-colors group">
            <div className="relative w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-200 group-hover:scale-105 transition-transform text-white">
              <BookOpen className="w-6 h-6 absolute bottom-1" />
              <div className="absolute top-1 text-white flex flex-col items-center">
                 <div className="w-6 h-1 border-b-2 border-white rounded-sm -mb-1 z-10"></div>
                 <div className="w-4 h-3 bg-white rounded-sm"></div>
              </div>
            </div>
            <span className="text-xl font-bold text-[#0D3B94]">
              Lear<span className="text-[#FFB300]">nova</span>
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-slate-500 hover:text-secondary-600 transition-colors">Home</Link>
            
            {userData?.premiumStatus === 'approved' ? (
              <span className="text-sm font-bold text-primary-600 bg-primary-100 px-4 py-1.5 rounded-full">Premium ✨</span>
            ) : userData?.premiumStatus === 'pending' ? (
              <span className="text-sm font-bold text-slate-500 bg-slate-100 px-4 py-1.5 rounded-full">Request Pending</span>
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
                  className="w-10 h-10 rounded-full bg-primary-400 border-2 border-white flex items-center justify-center font-bold text-secondary-900 cursor-pointer shadow-sm text-sm uppercase hover:scale-105 transition-transform"
                >
                  {user.email?.[0] || 'U'}
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsLoginOpen(true)}
                className="text-sm font-bold text-secondary-600 hover:text-secondary-700 transition-colors"
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

      <footer className="border-t border-secondary-100 bg-white/40 backdrop-blur-md mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500">Made with ❤️ by <span className="font-bold text-slate-800">Indian</span></span>
            <div className="h-3 w-[1px] bg-slate-200"></div>
            <a href="mailto:example@gmail.com" className="text-xs text-slate-400 hover:text-secondary-500 transition-colors">contact: example@gmail.com</a>
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-secondary-500 hover:underline">LinkedIn</a>
            <a href="#" className="text-xs text-secondary-500 hover:underline">Instagram</a>
            <div className="h-3 w-[1px] bg-slate-200"></div>
            {userData?.role === 'admin' && (
              <Link to="/admin" className="text-xs font-bold text-slate-600 hover:text-secondary-600 uppercase tracking-tight transition-colors">Admin Panel</Link>
            )}
          </div>
        </div>
      </footer>
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
}
