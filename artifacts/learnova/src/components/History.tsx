import { motion } from "motion/react";
import { Clock } from "lucide-react";

export function History() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="flex flex-col items-center gap-6"
      >
        <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
          <Clock className="w-12 h-12 text-blue-500" />
        </div>

        <div>
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Coming Soon</h1>
          <p className="text-lg text-gray-500 max-w-md">
            Study History is under construction. Soon you'll be able to revisit every topic you've explored.
          </p>
        </div>

        <div className="flex gap-2 mt-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-3 h-3 rounded-full bg-blue-400"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}
