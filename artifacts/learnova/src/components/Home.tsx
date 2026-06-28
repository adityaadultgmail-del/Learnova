import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { MessageSquareText, Mic, Lock, Crown, HelpCircle, Calendar, BrainCircuit, Unlock } from "lucide-react";
import { useAuth } from "../lib/auth";

export function Home() {
  const { userData } = useAuth();
  const isPremium = userData?.premiumStatus === 'approved';

  return (
    <div className="space-y-16 pb-12">
      <section className="text-center space-y-6 max-w-2xl mx-auto pt-8">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-extrabold text-slate-800 tracking-tight"
        >
          Master any topic with your <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary-500 to-primary-500">AI Tutor Learnova</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-slate-600"
        >
          Choose your mode: Text Mode or Voice Mode.
        </motion.p>
      </section>

      <section className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Link to="/text">
          <motion.div 
            whileHover={{ y: -5 }}
            className="group relative bg-secondary-600 p-8 rounded-3xl text-white shadow-2xl shadow-secondary-200 overflow-hidden cursor-pointer transition-all"
          >
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-secondary-400/30 rounded-full blur-3xl" />
            <div className="relative z-10 flex flex-col items-start text-left">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                <MessageSquareText className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-white">Text Mode</h2>
              <p className="text-secondary-100 text-sm opacity-90 leading-relaxed">
                Generate notes, youtube links, and take quizzes instantly based on any topic.
              </p>
              <div className="mt-6 flex items-center gap-2 font-semibold text-sm bg-white/10 w-fit px-4 py-2 rounded-full border border-white/20">
                Launch Text AI →
              </div>
            </div>
          </motion.div>
        </Link>

        <Link to="/voice">
          <motion.div 
            whileHover={{ y: -5 }}
            className="group relative bg-primary-400 p-8 rounded-3xl text-secondary-900 shadow-2xl shadow-primary-100 overflow-hidden cursor-pointer transition-all"
          >
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/30 rounded-full blur-3xl" />
            <div className="relative z-10 flex flex-col items-start text-left">
              <div className="w-12 h-12 bg-secondary-900/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                <Mic className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Voice Mode</h2>
              <p className="text-secondary-900/70 text-sm opacity-90 leading-relaxed">
                Speak naturally with your AI tutor. Perfect for language practice and verbal revision.
              </p>
              <div className="mt-6 flex items-center gap-2 font-semibold text-sm bg-secondary-900/10 w-fit px-4 py-2 rounded-full border border-secondary-900/10">
                Start Talking AI →
              </div>
            </div>
          </motion.div>
        </Link>
      </section>

      <section className="max-w-5xl mx-auto pt-12">
        <div className="flex items-center justify-center gap-3 mb-10">
          <Crown className="w-6 h-6 text-primary-500" />
          <h2 className="text-3xl font-bold text-slate-800 text-center">Premium Features</h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <PremiumCard 
            icon={<HelpCircle className="w-8 h-8" />}
            title="Doubt Solving"
            desc="24/7 AI tutor for complex doubts"
            isUnlocked={isPremium}
            path="/doubt-solving"
          />
          <PremiumCard 
            icon={<Calendar className="w-8 h-8" />}
            title="Study Plans"
            desc="Personalized roadmaps for your exams"
            isUnlocked={isPremium}
            path="/study-plans"
          />
          <PremiumCard 
            icon={<BrainCircuit className="w-8 h-8" />}
            title="Smart Revision"
            desc="Spaced repetition & memory tracking"
            isUnlocked={isPremium}
            path="/smart-revision"
          />
        </div>
      </section>
    </div>
  );
}

function PremiumCard({ icon, title, desc, isUnlocked, path }: { icon: React.ReactNode, title: string, desc: string, isUnlocked: boolean, path: string }) {
  if (isUnlocked) {
    return (
      <Link to={path} className="bg-gradient-to-br from-primary-50 to-white border border-primary-100 p-5 rounded-2xl flex flex-col gap-3 relative overflow-hidden select-none shadow-sm hover:shadow-md transition-all cursor-pointer group block">
        <div className="flex items-center justify-between">
           <span className="text-xs font-bold text-primary-600 bg-primary-100 px-2 py-1 rounded-md uppercase tracking-wider">Unlocked</span>
           <Unlock className="w-4 h-4 text-primary-400 group-hover:text-primary-600 transition-colors" />
        </div>
        <div className="text-left mt-2 flex flex-col gap-2">
          <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
            {icon}
          </div>
          <div>
            <h4 className="font-bold text-slate-800 text-lg">{title}</h4>
            <p className="text-sm text-slate-600 mt-1">{desc}</p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="bg-white/50 backdrop-blur-sm border border-white p-5 rounded-2xl flex flex-col gap-3 relative overflow-hidden select-none">
      <div className="flex items-center justify-between">
         <span className="text-xs font-bold text-secondary-600 bg-secondary-50 px-2 py-1 rounded-md uppercase tracking-wider">Locked</span>
         <Lock className="w-4 h-4 text-slate-400" />
      </div>
      <div className="filter blur-[2px] text-left">
        <h4 className="font-bold text-slate-700">{title}</h4>
        <p className="text-xs text-slate-400 mt-1">{desc}</p>
      </div>
    </div>
  );
}
