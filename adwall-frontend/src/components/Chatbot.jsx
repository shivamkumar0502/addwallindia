import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import api from "@/services/api";
import { Send, X, MessageCircle, Sparkles, RefreshCw } from "lucide-react";

const WELCOME_MSG = {
  id: "welcome", role: "bot",
  text: "Namaste! 👋 Main **Addy** hoon — AdWall India ka AI assistant!\n\nHoardings search, pricing, booking — kuch bhi pucho! 😊",
  time: new Date(),
};

const formatText = (text) =>
  text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br/>");

// FIX: chat page pe Addy ka floating button send button ke upar chadh
// jaata tha. In routes pe chatbot chhupa do — wahan user pehle se
// owner/client se baat kar raha hai, bot ki zarurat nahi.
const HIDE_ON = ["/chat", "/messages"];

const Chatbot = () => {
  const location = useLocation();
  const hidden = HIDE_ON.some((p) => location.pathname.startsWith(p));

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    api.get("/chatbot/suggestions").then(r => setSuggestions(r.data.data?.slice(0, 4) || [])).catch(() => {
      setSuggestions(["Hoarding book kaise karun?", "Apni hoarding list karni hai", "Escrow payment kya hai?", "KYC me kya documents lagenge?"]);
    });
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 100); }, [open]);

  // Route badalte hi band kar do
  useEffect(() => { if (hidden) setOpen(false); }, [hidden]);

  const sendMessage = async (text) => {
    const msgText = (text || input).trim();
    if (!msgText || loading) return;
    setInput(""); setShowSuggestions(false);
    setMessages(prev => [...prev, { id: Date.now(), role: "user", text: msgText, time: new Date() }]);
    setLoading(true);
    try {
      const history = messages.filter(m => m.id !== "welcome").slice(-8).map(m => ({ role: m.role === "user" ? "user" : "model", text: m.text }));
      const { data } = await api.post("/chatbot/message", { message: msgText, history });
      setMessages(prev => [...prev, { id: Date.now() + 1, role: "bot", text: data.data.response, time: new Date() }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: "bot", text: "Server se connect nahi ho pa raha 😅 Thodi der baad try karo.", time: new Date(), isError: true }]);
    } finally { setLoading(false); }
  };

  if (hidden) return null;

  return (
    <>
      <div className="fixed bottom-6 right-6 z-40">
        <button onClick={() => setOpen(!open)} className={`h-14 w-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-300 hover:scale-110 ${open ? "bg-gray-700" : "bg-gradient-to-br from-brand-500 to-brand-700"}`}>
          {open ? <X size={22} className="text-white" /> : <MessageCircle size={24} className="text-white" />}
        </button>
      </div>
      {open && (
        <div className="fixed bottom-24 right-6 z-40 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden" style={{ maxHeight: "75vh", height: "520px" }}>
          <div className="bg-gradient-to-r from-brand-500 to-brand-700 px-4 py-3 flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0"><Sparkles size={18} className="text-white" /></div>
            <div className="flex-1">
              <p className="text-white font-bold text-sm">Addy — AdWall AI</p>
              <p className="text-orange-100 text-xs flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-green-400 inline-block" />Gemini powered</p>
            </div>
            <button onClick={() => { setMessages([WELCOME_MSG]); setShowSuggestions(true); }} className="p-1.5 rounded-lg hover:bg-white/10 text-white/70"><RefreshCw size={14} /></button>
            <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/70"><X size={16} /></button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-3 bg-gray-50">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "bot" && <div className="h-7 w-7 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold mr-2 flex-shrink-0 mt-0.5">A</div>}
                <div className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === "user" ? "bg-brand-500 text-white rounded-br-sm" : msg.isError ? "bg-red-50 text-red-700 border border-red-200 rounded-bl-sm" : "bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-sm"}`}
                  dangerouslySetInnerHTML={{ __html: formatText(msg.text) }} />
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="h-7 w-7 rounded-full bg-brand-500 flex items-center justify-center text-white text-xs font-bold mr-2">A</div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5">{[0,1,2].map(i => <div key={i} className="h-2 w-2 bg-brand-400 rounded-full animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}</div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          {showSuggestions && suggestions.length > 0 && (
            <div className="px-3 py-2 bg-white border-t border-gray-100">
              <div className="flex flex-wrap gap-1.5">
                {suggestions.map((s, i) => <button key={i} onClick={() => sendMessage(s)} className="text-xs bg-orange-50 text-brand-600 border border-orange-200 px-2.5 py-1 rounded-full hover:bg-orange-100">{s}</button>)}
              </div>
            </div>
          )}
          <div className="px-3 py-3 bg-white border-t border-gray-100">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl border border-gray-200 px-3 py-1.5">
              <input ref={inputRef} type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())} placeholder="Kuch poochho..." maxLength={500} disabled={loading} className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 outline-none" />
              <button onClick={() => sendMessage()} disabled={!input.trim() || loading} className="h-7 w-7 rounded-lg bg-brand-500 hover:bg-brand-600 flex items-center justify-center disabled:opacity-40 flex-shrink-0"><Send size={13} className="text-white" /></button>
            </div>
            <p className="text-[10px] text-gray-300 text-center mt-1.5">Powered by Google Gemini ✨</p>
          </div>
        </div>
      )}
    </>
  );
};
export default Chatbot;