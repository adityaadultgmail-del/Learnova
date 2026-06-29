import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../lib/auth";
import { db } from "../lib/firebase";
import {
  collection, addDoc, onSnapshot, query,
  orderBy, serverTimestamp
} from "firebase/firestore";
import { ArrowLeft, Send, Paperclip, Loader2, FileText, X } from "lucide-react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import Markdown from "react-markdown";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  attachmentBase64?: string;
  attachmentName?: string;
  attachmentType?: string;
  timestamp: any;
}

export function Chat() {
  const { chatId } = useParams<{ chatId: string }>();
  const [searchParams] = useSearchParams();
  const friendName = searchParams.get("friendName") || "Friend";
  const friendUid = searchParams.get("friendUid") || "";

  const { user, userData } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState<{ base64: string; name: string; type: string } | null>(null);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fileError, setFileError] = useState("");

  const bottomRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!chatId) return;
    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("timestamp", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
      setLoading(false);
    }, () => setLoading(false));
    return () => unsub();
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError("");
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 500 * 1024) {
      setFileError("File too large. Max 500KB allowed.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFile({ base64: reader.result as string, name: f.name, type: f.type });
    };
    reader.readAsDataURL(f);
    e.target.value = "";
  };

  const sendMessage = async () => {
    if ((!text.trim() && !file) || !user || !chatId) return;
    setSending(true);
    try {
      await addDoc(collection(db, "chats", chatId, "messages"), {
        senderId: user.uid,
        senderName: userData?.displayName || user.email || "User",
        text: text.trim(),
        attachmentBase64: file?.base64 || null,
        attachmentName: file?.name || null,
        attachmentType: file?.type || null,
        timestamp: serverTimestamp(),
      });
      setText("");
      setFile(null);
    } catch {
      alert("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const downloadAttachment = (msg: Message) => {
    if (!msg.attachmentBase64) return;
    const a = document.createElement("a");
    a.href = msg.attachmentBase64;
    a.download = msg.attachmentName || "attachment";
    a.click();
  };

  const isImage = (type?: string) => type?.startsWith("image/");

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-slate-700 mb-4">
        <button
          onClick={() => navigate("/connections")}
          className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        </button>
        <div className="w-10 h-10 rounded-full bg-[#0D3B94] flex items-center justify-center text-white font-bold text-sm uppercase shrink-0">
          {friendName[0]}
        </div>
        <div>
          <h2 className="font-bold text-slate-800 dark:text-slate-100">{friendName}</h2>
          <p className="text-xs text-green-500 font-medium">Connected</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <p className="font-medium">No messages yet</p>
            <p className="text-sm mt-1">Say hello to {friendName}!</p>
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.senderId === user?.uid;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[75%] space-y-1`}>
                  {!isMe && (
                    <p className="text-xs text-slate-400 dark:text-slate-500 ml-1">{msg.senderName}</p>
                  )}
                  <div className={`rounded-2xl px-4 py-2.5 ${isMe ? "bg-[#0D3B94] text-white rounded-tr-sm" : "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-sm"}`}>
                    {msg.text && (
                      <div className={`text-sm prose prose-sm max-w-none ${isMe ? "prose-invert" : "dark:prose-invert"}`}>
                        <Markdown>{msg.text}</Markdown>
                      </div>
                    )}
                    {msg.attachmentBase64 && (
                      <div className="mt-2">
                        {isImage(msg.attachmentType) ? (
                          <img
                            src={msg.attachmentBase64}
                            alt={msg.attachmentName || "image"}
                            className="max-w-[200px] rounded-xl cursor-pointer"
                            onClick={() => downloadAttachment(msg)}
                          />
                        ) : (
                          <button
                            onClick={() => downloadAttachment(msg)}
                            className={`flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl ${isMe ? "bg-white/20 hover:bg-white/30" : "bg-white dark:bg-slate-600 hover:bg-slate-50 dark:hover:bg-slate-500"} transition-colors`}
                          >
                            <FileText className="w-4 h-4 shrink-0" />
                            <span className="truncate max-w-[150px]">{msg.attachmentName}</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                  <p className={`text-[10px] text-slate-400 dark:text-slate-500 ${isMe ? "text-right mr-1" : "ml-1"}`}>
                    {msg.timestamp?.toDate?.()?.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) || ""}
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* File Preview */}
      <AnimatePresence>
        {file && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl mb-2 border border-blue-200 dark:border-blue-800"
          >
            <FileText className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="text-sm text-blue-700 dark:text-blue-300 truncate flex-1">{file.name}</span>
            <button onClick={() => setFile(null)} className="text-blue-400 hover:text-blue-600">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {fileError && (
        <p className="text-xs text-red-500 mb-2 px-1">{fileError}</p>
      )}

      {/* Input */}
      <div className="flex items-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
        <input type="file" ref={fileRef} onChange={handleFileChange} className="hidden" accept="image/*,.pdf,.doc,.docx,.txt,.ppt,.pptx" />
        <button
          onClick={() => fileRef.current?.click()}
          className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors shrink-0"
        >
          <Paperclip className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        </button>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder="Type a message... (Shift+Enter for new line)"
          rows={1}
          className="flex-1 resize-none bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 px-4 py-2.5 rounded-xl text-sm outline-none border border-transparent focus:border-[#0D3B94] dark:focus:border-blue-500 transition-colors placeholder:text-slate-400 max-h-32"
        />
        <button
          onClick={sendMessage}
          disabled={sending || (!text.trim() && !file)}
          className="w-10 h-10 rounded-xl bg-[#0D3B94] hover:bg-[#0a2f7a] flex items-center justify-center transition-colors disabled:opacity-50 shrink-0"
        >
          {sending ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
        </button>
      </div>
    </div>
  );
}
