import { cn } from "@/lib/utils";
export const Toast = ({ message, type = "success", onClose }) => (
  <div className={cn("fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-lg px-4 py-3 shadow-lg text-white text-sm",
    type === "success" ? "bg-green-600" : type === "error" ? "bg-red-600" : "bg-gray-800")}>
    <span>{message}</span>
    <button onClick={onClose} className="ml-2 text-white/80 hover:text-white">✕</button>
  </div>
);
