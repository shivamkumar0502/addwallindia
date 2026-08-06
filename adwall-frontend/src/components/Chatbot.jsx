import { useState, useEffect, useRef } from "react";
import api from "@/services/api";
import { Send, X, MessageCircle, Sparkles, RefreshCw } from "lucide-react";

const WELCOME_MSG = {
  id: "welcome",
  role: "bot",
  text: "Namaste! 👋 Main **Addy** hoon — AdWall India ka AI assistant!\n\nAapki kaise help kar sakta hoon? Hoardings search, pricing, booking process — kuch bhi pucho! 😊",
  time: new Date(),
};

const formatText = (text) =>
  text
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n/g, "<br/>");

const Chatbot = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Suggestions fetch karo
  useEffect(() => {
    api.get("/chatbot/suggestions")
      .then(r => setSuggestions(r.data.data?.slice(0, 4) || []))
      .catch(() => {});
  }, []);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const sendMessage = async (text) => {
    const msgText = (text || input).trim();
    if (!msgText || loading) return;

    setInput("");
    setShowSuggestions(false);

    const userMsg = { id: Date.now(), role: "user", text: msgText, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      // History prepare karo (last 8 messages)
      const history = messages
        .filter(m => m.id !== "welcome")
        .slice(-8)
        .map(m => ({ role: m.role === "user" ? "user" : "model", text: m.text }));

      const { data } = await api.post("/chatbot/message", {
        message: msgText,
        history,
      });

      const botMsg = {
        id: Date.now() + 1,
        role: "bot",
        text: data.data.response,
        isAI: data.data.isAI,
        time: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);

      // Agar chat closed hai to unread badhao
      if (!open) setUnread(u => u + 1);
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: "bot",
        text: "Oops! Kuch error ho gaya. 😅 Please support@adwall.in pe contact kariye.",
        time: new Date(),
        isError: true,
      }]);
    } finally { setLoading(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleReset = () => {
    setMessages([WELCOME_MSG]);
    setShowSuggestions(true);
    setInput("");
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Unread badge */}
        {unread > 0 && !open && (
          <div className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center z-10">
            <span className="text-white text-xs font-bold">{unread}</span>
          </div>
        )}

        <button
          onClick={() => setOpen(!open)}
          className={`h-14 w-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110
            ${open
              ? "bg-gray-700 rotate-0"
              : "bg-gradient-to-br from-brand-500 to-brand-700 animate-pulse-slow"
            }`}
          aria-label="Open AI Chatbot"
        >
          {open
            ? <X size={22} className="text-white" />
            : <MessageCircle size={24} className="text-white" />
          }
        </button>

        {/* Tooltip (only when closed) */}
        {!open && (
          <div className="absolute bottom-16 right-0 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
            Addy AI — Kuch poochho! 🤖
          </div>
        )}
      </div>

      {/* Chat Window */}
      {open && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
          style={{ maxHeight: "75vh", height: "520px" }}>

          {/* Header */}
          <div className="bg-gradient-to-r from-brand-500 to-brand-700 px-4 py-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Sparkles size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">Addy — AdWall AI</p>
              <p className="text-orange-100 text-xs flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 inline-block animate-pulse" />
                Online — Powered by Gemini
              </p>
            </div>
            <button
              onClick={handleReset}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
              title="Clear chat"
            >
              <RefreshCw size={14} />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 bg-gray-50">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "bot" && (
                  <div className="h-7 w-7 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-0.5">
                    A
                  </div>
                )}
                <div className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed
                  ${msg.role === "user"
                    ? "bg-brand-500 text-white rounded-br-sm"
                    : msg.isError
                      ? "bg-red-50 text-red-700 border border-red-200 rounded-bl-sm"
                      : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm"
                  }`}
                  dangerouslySetInnerHTML={{ __html: formatText(msg.text) }}
                />
              </div>
            ))}

            {/* Loading dots */}
            {loading && (
              <div className="flex justify-start">
                <div className="h-7 w-7 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0">A</div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5 items-center">
                    {[0, 1, 2].map(i => (
                      <div key={i} className="h-2 w-2 bg-brand-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="px-3 py-2 bg-white border-t border-gray-100">
              <p className="text-xs text-gray-400 mb-2">Quick questions:</p>
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(s)}
                    className="text-xs bg-orange-50 text-brand-600 border border-orange-200 px-2.5 py-1 rounded-full hover:bg-orange-100 transition-colors text-left"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-3 bg-white border-t border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl border border-gray-200 px-3 py-1.5">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Kuch poochho..."
                maxLength={500}
                disabled={loading}
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}
                className="h-7 w-7 rounded-lg bg-brand-500 hover:bg-brand-600 flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
              >
                <Send size={13} className="text-white" />
              </button>
            </div>
            <p className="text-[10px] text-gray-300 text-center mt-1.5">Powered by Google Gemini ✨</p>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
