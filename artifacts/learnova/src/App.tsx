import { Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./components/Home";
import { TextMode } from "./components/TextMode";
import { VoiceMode } from "./components/VoiceMode";
import { AdminPanel } from "./components/AdminPanel";
import { DoubtSolving } from "./components/DoubtSolving";
import { StudyPlans } from "./components/StudyPlans";
import { SmartRevision } from "./components/SmartRevision";
import { History } from "./components/History";
import { Connections } from "./components/Connections";
import { Chat } from "./components/Chat";
import { StudySession } from "./components/StudySession";
import { AuthProvider } from "./lib/auth";
import { NotificationsProvider } from "./lib/notifications";

export default function App() {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="text" element={<TextMode />} />
            <Route path="voice" element={<VoiceMode />} />
            <Route path="admin" element={<AdminPanel />} />
            <Route path="doubt-solving" element={<DoubtSolving />} />
            <Route path="study-plans" element={<StudyPlans />} />
            <Route path="smart-revision" element={<SmartRevision />} />
            <Route path="history" element={<History />} />
            <Route path="connections" element={<Connections />} />
            <Route path="chat/:chatId" element={<Chat />} />
            <Route path="study-session/:sessionId" element={<StudySession />} />
          </Route>
        </Routes>
      </NotificationsProvider>
    </AuthProvider>
  );
}
