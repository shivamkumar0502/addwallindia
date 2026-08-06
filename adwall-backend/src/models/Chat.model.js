const mongoose = require("mongoose");

// Conversation — ek booking ke beech client aur owner ki chat thread
const conversationSchema = new mongoose.Schema(
  {
    booking: { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // [clientId, ownerId]
    lastMessage: { type: String, default: null },
    lastMessageAt: { type: Date, default: null },
    unreadCount: {
      client: { type: Number, default: 0 },
      owner: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

const Conversation = mongoose.model("Conversation", conversationSchema);

// Message — individual chat message
const messageSchema = new mongoose.Schema(
  {
    conversation: { type: mongoose.Schema.Types.ObjectId, ref: "Conversation", required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, default: null },
    imageUrl: { type: String, default: null }, // photo share karna
    type: { type: String, enum: ["text", "image", "system"], default: "text" },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Message = mongoose.model("Message", messageSchema);

module.exports = { Conversation, Message };
