export const formatCurrency = (amount) =>
  amount == null ? "₹0" : `₹${Number(amount).toLocaleString("en-IN")}`;

export const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";

// returns { bg, text } hex colors (RN doesn't do className-based colors)
export const getStatusColor = (status) => {
  const map = {
    verified: { bg: "#dcfce7", text: "#15803d" },
    pending: { bg: "#fef9c3", text: "#a16207" },
    rejected: { bg: "#fee2e2", text: "#b91c1c" },
    completed: { bg: "#dbeafe", text: "#1d4ed8" },
    cancelled: { bg: "#f3f4f6", text: "#374151" },
    payment_done: { bg: "#f3e8ff", text: "#7e22ce" },
    confirmed: { bg: "#e0e7ff", text: "#4338ca" },
    quote_requested: { bg: "#ffedd5", text: "#c2410c" },
  };
  return map[status] || { bg: "#f3f4f6", text: "#374151" };
};
