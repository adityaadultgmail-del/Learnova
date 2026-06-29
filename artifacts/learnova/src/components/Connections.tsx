import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../lib/auth";
import { db } from "../lib/firebase";
import {
  collection, query, where, onSnapshot, doc,
  setDoc, getDocs, updateDoc, deleteDoc,
} from "firebase/firestore";
import {
  Users, Copy, Check, Search, MessageCircle,
  X, UserCheck, Loader2, Hash, UserPlus, Clock, AlertCircle, BookOpen
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../lib/notifications";

interface FriendRequest {
  id: string;
  fromUid: string;
  toUid: string;
  fromName: string;
  fromEmail: string;
  fromCode: string;
  toCode: string;
  toName: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

interface FriendUser {
  uid: string;
  displayName: string;
  userCode: string;
  requestId: string;
}

export function Connections() {
  const { user, userData } = useAuth();
  const navigate = useNavigate();

  const [mainTab, setMainTab] = useState<"friends" | "requests">("friends");
  const [requestTab, setRequestTab] = useState<"received" | "sent">("received");

  const [allSent, setAllSent] = useState<FriendRequest[]>([]);
  const [allReceived, setAllReceived] = useState<FriendRequest[]>([]);

  const [searchCode, setSearchCode] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<{ uid: string; displayName: string; userCode: string } | null>(null);
  const [searchError, setSearchError] = useState("");

  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { sessionInvite } = useNotifications();

  const sentRef = useRef<FriendRequest[]>([]);
  const receivedRef = useRef<FriendRequest[]>([]);

  useEffect(() => {
    if (!user) return;

    const sentQ = query(collection(db, "friendRequests"), where("fromUid", "==", user.uid));
    const unsubSent = onSnapshot(sentQ, (snap) => {
      sentRef.current = snap.docs.map(d => ({ id: d.id, ...d.data() } as FriendRequest));
      setAllSent([...sentRef.current]);
    }, () => {});

    const recQ = query(collection(db, "friendRequests"), where("toUid", "==", user.uid));
    const unsubRec = onSnapshot(recQ, (snap) => {
      receivedRef.current = snap.docs.map(d => ({ id: d.id, ...d.data() } as FriendRequest));
      setAllReceived([...receivedRef.current]);
    }, () => {});

    return () => { unsubSent(); unsubRec(); };
  }, [user]);

  const friends = useMemo<FriendUser[]>(() => {
    const fromSent = allSent
      .filter(r => r.status === "accepted")
      .map(r => ({ uid: r.toUid, displayName: r.toName || "User", userCode: r.toCode, requestId: r.id }));
    const fromRec = allReceived
      .filter(r => r.status === "accepted")
      .map(r => ({ uid: r.fromUid, displayName: r.fromName || "User", userCode: r.fromCode, requestId: r.id }));
    const seen = new Set<string>();
    return [...fromSent, ...fromRec].filter(f => {
      if (seen.has(f.uid)) return false;
      seen.add(f.uid);
      return true;
    });
  }, [allSent, allReceived]);

  const pendingSent = useMemo(() => allSent.filter(r => r.status === "pending"), [allSent]);
  const pendingReceived = useMemo(() => allReceived.filter(r => r.status === "pending"), [allReceived]);

  const copyCode = () => {
    if (userData?.userCode) {
      navigator.clipboard.writeText(userData.userCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const searchUser = async () => {
    if (!searchCode.trim() || searchCode.trim().length < 3) return;
    setSearchLoading(true);
    setSearchResult(null);
    setSearchError("");
    try {
      const code = searchCode.trim().toUpperCase();
      if (code === userData?.userCode) {
        setSearchError("That's your own code!");
        return;
      }
      const q = query(collection(db, "users"), where("userCode", "==", code));
      const snap = await getDocs(q);
      if (snap.empty) {
        setSearchError("No user found with that code.");
        return;
      }
      const found = snap.docs[0].data() as { uid: string; displayName: string; userCode: string };
      const alreadyFriend = friends.find(f => f.uid === found.uid);
      if (alreadyFriend) {
        setSearchError("You're already connected with this user.");
        return;
      }
      const alreadySent = pendingSent.find(r => r.toCode === code);
      if (alreadySent) {
        setSearchError("Request already sent to this user.");
        return;
      }
      setSearchResult(found);
    } catch {
      setSearchError("Failed to search. Please try again.");
    } finally {
      setSearchLoading(false);
    }
  };

  const sendRequest = async (to: { uid: string; displayName: string; userCode: string }) => {
    if (!user || !userData) return;
    setActionLoading("send");
    try {
      const reqId = `${user.uid}_${to.uid}`;
      await setDoc(doc(db, "friendRequests", reqId), {
        fromUid: user.uid,
        toUid: to.uid,
        fromName: userData.displayName || user.email || "User",
        fromEmail: user.email || "",
        fromCode: userData.userCode || "",
        toCode: to.userCode,
        toName: to.displayName,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
      setSearchResult(null);
      setSearchCode("");
      setRequestTab("sent");
    } catch {
      setSearchError("Failed to send request.");
    } finally {
      setActionLoading(null);
    }
  };

  const acceptRequest = async (req: FriendRequest) => {
    setActionLoading(req.id);
    try {
      await updateDoc(doc(db, "friendRequests", req.id), { status: "accepted" });
    } catch {
      alert("Failed to accept request.");
    } finally {
      setActionLoading(null);
    }
  };

  const rejectRequest = async (req: FriendRequest) => {
    setActionLoading(req.id + "_reject");
    try {
      await updateDoc(doc(db, "friendRequests", req.id), { status: "rejected" });
    } catch {
      alert("Failed to reject request.");
    } finally {
      setActionLoading(null);
    }
  };

  const cancelRequest = async (req: FriendRequest) => {
    setActionLoading(req.id + "_cancel");
    try {
      await updateDoc(doc(db, "friendRequests", req.id), { status: "rejected" });
    } catch {
      alert("Failed to cancel request.");
    } finally {
      setActionLoading(null);
    }
  };

  const getChatId = (uid1: string, uid2: string) => [uid1, uid2].sort().join("_");
  const getSessionId = (uid1: string, uid2: string) => [uid1, uid2].sort().join("_");

  const startStudySession = async (friend: FriendUser) => {
    if (!user || !userData) return;
    const sessionId = getSessionId(user.uid, friend.uid);
    // Write an invite notification to the friend
    try {
      await setDoc(doc(db, "sessionInvites", friend.uid), {
        sessionId,
        fromUid: user.uid,
        fromName: userData.displayName || user.email?.split("@")[0] || "A friend",
        createdAt: new Date().toISOString(),
      });
    } catch { /* non-critical */ }
    navigate(`/study-session/${sessionId}?friendName=${encodeURIComponent(friend.displayName)}&friendUid=${friend.uid}`);
  };

  // Clear own session invite when visiting Connections
  useEffect(() => {
    if (!user) return;
    deleteDoc(doc(db, "sessionInvites", user.uid)).catch(() => {});
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <Users className="w-16 h-16 text-slate-300" />
        <h2 className="text-xl font-bold text-slate-700 dark:text-slate-200">Sign in to connect</h2>
        <p className="text-slate-500 dark:text-slate-400">Log in to find friends and start studying together.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-6">
      {/* Session Invite Banner */}
      <AnimatePresence>
        {sessionInvite && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-4 text-white shadow-lg flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-sm">Study session invite!</p>
                <p className="text-xs text-purple-200">{sessionInvite.fromName} wants to study together</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/study-session/${sessionInvite.sessionId}?friendName=${encodeURIComponent(sessionInvite.fromName)}&friendUid=${sessionInvite.fromUid}`)}
              className="bg-white text-purple-700 font-bold text-xs px-4 py-2 rounded-xl hover:bg-purple-50 transition-colors shrink-0"
            >
              Join Now →
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* User Code Card */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-[#0D3B94] to-[#1a52c9] rounded-2xl p-5 text-white shadow-lg"
      >
        <div className="flex items-center gap-2 mb-2">
          <Hash className="w-4 h-4 text-yellow-300" />
          <span className="text-sm font-semibold text-blue-200">Your Friend Code</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-4xl font-black tracking-widest text-yellow-300 font-mono">
            {userData?.userCode || "------"}
          </span>
          <button
            onClick={copyCode}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 transition-colors px-4 py-2 rounded-xl text-sm font-bold"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <p className="text-xs text-blue-200 mt-2">Share this code with friends so they can connect with you</p>
      </motion.div>

      {/* Main Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="flex border-b border-slate-100 dark:border-slate-700">
          {[
            { key: "friends", label: "Friends", count: friends.length },
            { key: "requests", label: "Requests", count: pendingReceived.length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setMainTab(tab.key as any)}
              className={`relative flex-1 py-4 text-sm font-bold transition-colors ${mainTab === tab.key ? "text-[#0D3B94] dark:text-blue-400" : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"}`}
            >
              <span className="flex items-center justify-center gap-2">
                {tab.label}
                {tab.count > 0 && (
                  <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${tab.key === "requests" ? "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400" : "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400"}`}>
                    {tab.count}
                  </span>
                )}
              </span>
              {mainTab === tab.key && (
                <motion.div layoutId="mainTabBar" className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0D3B94] dark:bg-blue-400" />
              )}
            </button>
          ))}
        </div>

        <div className="p-5">
          <AnimatePresence mode="wait">
            {/* FRIENDS TAB */}
            {mainTab === "friends" && (
              <motion.div key="friends" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}>
                {friends.length === 0 ? (
                  <div className="text-center py-10">
                    <Users className="w-12 h-12 text-slate-200 dark:text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500 dark:text-slate-400 font-medium">No friends yet</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Go to Requests → Sent to find and add friends</p>
                    <button onClick={() => { setMainTab("requests"); setRequestTab("sent"); }} className="mt-4 text-sm font-bold text-[#0D3B94] dark:text-blue-400 hover:underline">
                      Add a friend →
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {friends.map(friend => (
                      <motion.div
                        key={friend.uid}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/60 rounded-xl border border-slate-100 dark:border-slate-600"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#0D3B94] flex items-center justify-center text-white font-bold text-sm uppercase">
                            {friend.displayName[0]}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 dark:text-slate-100">{friend.displayName}</p>
                            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono"># {friend.userCode}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startStudySession(friend)}
                            className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
                          >
                            <BookOpen className="w-3.5 h-3.5" />
                            Study
                          </button>
                          <button
                            onClick={() => navigate(`/chat/${getChatId(user.uid, friend.uid)}?friendName=${encodeURIComponent(friend.displayName)}&friendUid=${friend.uid}`)}
                            className="flex items-center gap-2 bg-[#0D3B94] hover:bg-[#0a2f7a] text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            Chat
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* REQUESTS TAB */}
            {mainTab === "requests" && (
              <motion.div key="requests" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
                {/* Sub-tabs */}
                <div className="flex bg-slate-100 dark:bg-slate-700 rounded-xl p-1 mb-5">
                  {[
                    { key: "received", label: "Received", count: pendingReceived.length },
                    { key: "sent", label: "Sent", count: pendingSent.length },
                  ].map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setRequestTab(tab.key as any)}
                      className={`relative flex-1 py-2 text-sm font-bold rounded-lg transition-all ${requestTab === tab.key ? "bg-white dark:bg-slate-800 text-[#0D3B94] dark:text-blue-400 shadow-sm" : "text-slate-500 dark:text-slate-400"}`}
                    >
                      <span className="flex items-center justify-center gap-2">
                        {tab.label}
                        {tab.count > 0 && (
                          <span className="text-xs bg-yellow-400 text-yellow-900 rounded-full px-1.5 py-0.5 font-black">{tab.count}</span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {/* RECEIVED */}
                  {requestTab === "received" && (
                    <motion.div key="received" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-3">
                      {pendingReceived.length === 0 ? (
                        <div className="text-center py-8">
                          <UserCheck className="w-10 h-10 text-slate-200 dark:text-slate-600 mx-auto mb-2" />
                          <p className="text-slate-500 dark:text-slate-400 font-medium">No pending requests</p>
                        </div>
                      ) : (
                        pendingReceived.map(req => (
                          <motion.div
                            key={req.id}
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/60 rounded-xl border border-slate-100 dark:border-slate-600"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center text-yellow-900 font-bold text-sm uppercase">
                                {req.fromName[0]}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-800 dark:text-slate-100">{req.fromName}</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 font-mono"># {req.fromCode}</p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => acceptRequest(req)}
                                disabled={!!actionLoading}
                                className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-60"
                              >
                                {actionLoading === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                Accept
                              </button>
                              <button
                                onClick={() => rejectRequest(req)}
                                disabled={!!actionLoading}
                                className="flex items-center gap-1 bg-slate-200 hover:bg-red-100 dark:bg-slate-600 dark:hover:bg-red-900/40 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-60"
                              >
                                {actionLoading === req.id + "_reject" ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                                Decline
                              </button>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </motion.div>
                  )}

                  {/* SENT */}
                  {requestTab === "sent" && (
                    <motion.div key="sent" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
                      {/* Search Box */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Find a friend by code</label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                              type="text"
                              value={searchCode}
                              onChange={e => { setSearchCode(e.target.value.toUpperCase()); setSearchError(""); setSearchResult(null); }}
                              onKeyDown={e => e.key === "Enter" && searchUser()}
                              placeholder="Enter 6-char code e.g. ABC123"
                              maxLength={6}
                              className="w-full pl-9 pr-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl text-sm font-mono font-bold tracking-widest placeholder:font-normal placeholder:tracking-normal border border-transparent focus:border-[#0D3B94] dark:focus:border-blue-500 outline-none transition-colors"
                            />
                          </div>
                          <button
                            onClick={searchUser}
                            disabled={searchLoading || searchCode.trim().length < 3}
                            className="bg-[#0D3B94] hover:bg-[#0a2f7a] text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center gap-2"
                          >
                            {searchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            Search
                          </button>
                        </div>

                        {/* Search Error */}
                        {searchError && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            {searchError}
                          </motion.div>
                        )}

                        {/* Search Result */}
                        {searchResult && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.97 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#0D3B94] flex items-center justify-center text-white font-bold text-sm uppercase">
                                {searchResult.displayName[0]}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-800 dark:text-slate-100">{searchResult.displayName}</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 font-mono"># {searchResult.userCode}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => sendRequest(searchResult)}
                              disabled={actionLoading === "send"}
                              className="flex items-center gap-2 bg-[#0D3B94] hover:bg-[#0a2f7a] text-white px-3 py-1.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-60"
                            >
                              {actionLoading === "send" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                              Send Request
                            </button>
                          </motion.div>
                        )}
                      </div>

                      {/* Sent Requests List */}
                      {pendingSent.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pending Requests</p>
                          {pendingSent.map(req => (
                            <motion.div
                              key={req.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/60 rounded-xl border border-slate-100 dark:border-slate-600"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-slate-300 dark:bg-slate-500 flex items-center justify-center text-slate-600 dark:text-slate-200 font-bold text-sm uppercase">
                                  {req.toName?.[0] || "?"}
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-800 dark:text-slate-100">{req.toName || "Unknown"}</p>
                                  <div className="flex items-center gap-1.5">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    <p className="text-xs text-slate-400 dark:text-slate-500">Pending</p>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => cancelRequest(req)}
                                disabled={!!actionLoading}
                                className="text-xs text-slate-400 hover:text-red-500 dark:hover:text-red-400 font-bold transition-colors disabled:opacity-50"
                              >
                                {actionLoading === req.id + "_cancel" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Cancel"}
                              </button>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
