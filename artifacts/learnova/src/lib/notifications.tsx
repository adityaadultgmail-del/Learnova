import { createContext, useContext, useEffect, useState } from "react";
import { db } from "./firebase";
import { useAuth } from "./auth";
import {
  collection, query, where, onSnapshot,
  doc, onSnapshot as onDocSnapshot,
} from "firebase/firestore";

interface SessionInvite {
  sessionId: string;
  fromUid: string;
  fromName: string;
  createdAt: string;
}

interface NotificationsContextType {
  pendingRequestCount: number;
  sessionInvite: SessionInvite | null;
  totalCount: number;
}

const NotificationsContext = createContext<NotificationsContextType>({
  pendingRequestCount: 0,
  sessionInvite: null,
  totalCount: 0,
});

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [sessionInvite, setSessionInvite] = useState<SessionInvite | null>(null);

  // Listen for pending received friend requests
  useEffect(() => {
    if (!user) {
      setPendingRequestCount(0);
      return;
    }
    const q = query(
      collection(db, "friendRequests"),
      where("toUid", "==", user.uid),
      where("status", "==", "pending")
    );
    const unsub = onSnapshot(q, (snap) => {
      setPendingRequestCount(snap.size);
    }, () => {});
    return unsub;
  }, [user]);

  // Listen for active study session invite
  useEffect(() => {
    if (!user) {
      setSessionInvite(null);
      return;
    }
    const inviteRef = doc(db, "sessionInvites", user.uid);
    const unsub = onDocSnapshot(inviteRef, (snap) => {
      if (snap.exists()) {
        setSessionInvite(snap.data() as SessionInvite);
      } else {
        setSessionInvite(null);
      }
    }, () => {});
    return unsub;
  }, [user]);

  const totalCount = pendingRequestCount + (sessionInvite ? 1 : 0);

  return (
    <NotificationsContext.Provider value={{ pendingRequestCount, sessionInvite, totalCount }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => useContext(NotificationsContext);
