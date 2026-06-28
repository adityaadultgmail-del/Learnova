import { createContext, useContext, useState, type ReactNode } from "react";

export const GROQ_MODELS = [
  { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B", badge: "Best" },
  { id: "llama-3.1-8b-instant",    label: "Llama 3.1 8B",  badge: "Fastest" },
  { id: "mixtral-8x7b-32768",      label: "Mixtral 8x7B",  badge: "Long ctx" },
] as const;

export type GroqModelId = (typeof GROQ_MODELS)[number]["id"];

interface ModelContextType {
  model: GroqModelId;
  setModel: (m: GroqModelId) => void;
}

const ModelContext = createContext<ModelContextType | null>(null);

export function ModelProvider({ children }: { children: ReactNode }) {
  const [model, setModel] = useState<GroqModelId>("llama-3.3-70b-versatile");
  return (
    <ModelContext.Provider value={{ model, setModel }}>
      {children}
    </ModelContext.Provider>
  );
}

export function useModel() {
  const ctx = useContext(ModelContext);
  if (!ctx) throw new Error("useModel must be used within ModelProvider");
  return ctx;
}
