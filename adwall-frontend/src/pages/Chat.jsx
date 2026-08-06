import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/services/api";
import { connectSocket, getSocket } from "@/services/socket";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import Loader from "@/components/common/Loader";
import { Send, Image, ArrowLeft, RefreshCw } from "lucide-react";
import { useNavigate as useNav } from "react-router-dom";

const Chat = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const fileRef = useRef(null);
  const pollingRef = useRef(null);

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [convId, setConvId] = useState(null);

  const otherParticipant = conversation?.participants?.find(
    p => (p._id || p) !== user?.id
  );

  // ── Fetch conversation ──
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/chat/booking/${bookingId}`);
        const conv = data.data;
        setConversation(conv);
        setConvId(conv._id);
        await fetchMessages(conv._id);
      } catch (err) {
        console.error("Init error:", err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [bookingId]);

  // ── Fetch messages (REST) ──
  const fetchMessages = async (cId) => {
    try {
      const id = cId || convId;
      if (!id) return;
      const { data } = await api.get(`/chat/${id}/messages`);
      setMessages(data.data || []);
    } catch (err) {
      console.error("Messages fetch error:", err);
    }
  };

  // ── Socket.io setup (realtime layer) ──
  useEffect(() => {
    if (!convId) return;

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    try {
      const socket = connectSocket(token);

      socket.emit("join:conversation", bookingId);

      socket.on("new:message", (msg) => {
        setMessages(prev => {
          // Duplicate check
          const exists = prev.some(m => m._id === msg._id);
          if (exists) return prev;
          return [...prev, msg];
        });
      });

      socket.on("typing:start", ({ userId }) => {
        if (userId !== user?.id) setOtherTyping(true);
      });
      socket.on("typing:stop", ({ userId }) => {
        if (userId !== user?.id) setOtherTyping(false);
      });

      // Polling fallback (every 5 sec) agar socket disconnect ho
      pollingRef.current = setInterval(() => {
        if (!getSocket()?.connected) {
          fetchMessages(convId);
        }
      }, 5000);

      return () => {
        socket.off("new:message");
        socket.off("typing:start");
        socket.off("typing:stop");
        clearInterval(pollingRef.current);
      };
    } catch (err) {
      console.error("Socket setup error:", err);
      // Socket fail hone pe bhi polling se kaam chalta hai
      pollingRef.current = setInterval(() => fetchMessages(convId), 5000);
      return () => clearInterval(pollingRef.current);
    }
  }, [convId]);

  // ── Auto scroll ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── Send text message (REST + Socket) ──
  const handleSend = async () => {
    if (!text.trim() || !convId || sending) return;
    const msgText = text.trim();
    setText("");
    setSending(true);

    // Optimistic update
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg = {
      _id: tempId,
      conversation: convId,
      sender: { _id: user?.id, name: user?.name, avatar: user?.avatar },
      text: msgText,
      type: "text",
      createdAt: new Date().toISOString(),
      isOptimistic: true,
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      // Try socket first (fast)
      const socket = getSocket();
      if (socket?.connected) {
        socket.emit("send:message", { conversationId: convId, text: msgText });
        // Socket se real message aayega — optimistic hatao
        setTimeout(() => {
          setMessages(prev => prev.filter(m => m._id !== tempId));
        }, 2000);
      } else {
        // Socket nahi hai — REST use karo
        const { data } = await api.post(`/chat/${convId}/send`, { text: msgText });
        setMessages(prev => [
          ...prev.filter(m => m._id !== tempId),
          data.data
        ]);
      }
    } catch (err) {
      console.error("Send error:", err);
      // Remove optimistic on error
      setMessages(prev => prev.filter(m => m._id !== tempId));
      // Retry with REST
      try {
        const { data } = await api.post(`/chat/${convId}/send`, { text: msgText });
        setMessages(prev => [...prev, data.data]);
      } catch {}
    } finally {
      setSending(false);
    }

    // Typing stop
    getSocket()?.emit("typing:stop", { bookingId });
  };

  // ── Send image ──
  const handleImageSend = async (file) => {
    if (!file || !convId) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const { data } = await api.post(`/chat/${convId}/send`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setMessages(prev => [...prev, data.data]);
    } catch (err) {
      console.error("Image send error:", err);
    } finally {
      setSending(false);
    }
  };

  // ── Typing indicator ──
  const typingTimeout = useRef(null);
  const handleTyping = (val) => {
    setText(val);
    const socket = getSocket();
    if (!socket?.connected) return;
    socket.emit("typing:start", { bookingId });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("typing:stop", { bookingId });
    }, 1500);
  };

  // ── Is my message? ──
  const isMyMessage = (msg) => {
    const senderId = msg.sender?._id || msg.sender;
    return String(senderId) === String(user?.id);
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <Loader size="lg" />
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center gap-3 shadow-sm z-10">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={18} />
        </button>
        <Avatar
          src={otherParticipant?.avatar}
          alt={otherParticipant?.name}
          fallback={otherParticipant?.name?.[0]?.toUpperCase() || "?"}
          className="h-9 w-9"
        />
        <div className="flex-1">
          <p className="font-semibold text-gray-900 text-sm">{otherParticipant?.name || "Chat"}</p>
          <p className="text-xs text-gray-400 capitalize">{otherParticipant?.role || ""}</p>
        </div>
        {otherTyping && (
          <p className="text-xs text-brand-500 animate-pulse">typing...</p>
        )}
        <button
          onClick={() => fetchMessages()}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600"
          title="Refresh messages"
        >
          <RefreshCw size={15} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <div className="text-4xl mb-3">💬</div>
            <p className="text-sm">Conversation start karo!</p>
            <p className="text-xs text-gray-300 mt-1">Message type karo aur send karo</p>
          </div>
        ) : (
          messages.map((msg) => {
            const mine = isMyMessage(msg);
            return (
              <div key={msg._id} className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                {!mine && (
                  <Avatar
                    src={msg.sender?.avatar}
                    fallback={msg.sender?.name?.[0]?.toUpperCase() || "?"}
                    className="h-7 w-7 flex-shrink-0"
                  />
                )}
                <div className={`flex flex-col max-w-[70%] ${mine ? "items-end" : "items-start"}`}>
                  {msg.type === "image" ? (
                    <a href={msg.imageUrl} target="_blank" rel="noreferrer">
                      <img
                        src={msg.imageUrl}
                        className="max-w-[200px] rounded-2xl cursor-pointer hover:opacity-90 shadow"
                        alt="shared"
                      />
                    </a>
                  ) : (
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed
                      ${mine
                        ? `bg-brand-500 text-white rounded-br-sm ${msg.isOptimistic ? "opacity-70" : ""}`
                        : "bg-white text-gray-900 border border-gray-100 rounded-bl-sm shadow-sm"
                      }`}>
                      {msg.text}
                    </div>
                  )}
                  <p className="text-[10px] text-gray-400 mt-1 px-1">
                    {new Date(msg.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                    {msg.isOptimistic && " • Sending..."}
                  </p>
                </div>
              </div>
            );
          })
        )}

        {/* Typing indicator */}
        {otherTyping && (
          <div className="flex items-end gap-2">
            <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold">
              {otherParticipant?.name?.[0] || "?"}
            </div>
            <div className="bg-white border rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="bg-white border-t px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            disabled={sending}
            className="p-2 text-gray-400 hover:text-brand-500 rounded-lg hover:bg-gray-50 flex-shrink-0 transition-colors"
          >
            <Image size={20} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { if (e.target.files[0]) handleImageSend(e.target.files[0]); e.target.value = ""; }}
          />
          <Input
            className="flex-1 rounded-full bg-gray-50 border-gray-200 focus:border-brand-300"
            placeholder="Message likho..."
            value={text}
            onChange={e => handleTyping(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            disabled={sending}
          />
          <Button
            size="icon"
            className="rounded-full h-10 w-10 flex-shrink-0"
            onClick={handleSend}
            disabled={!text.trim() || sending}
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
