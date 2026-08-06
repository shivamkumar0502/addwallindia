const jwt = require("jsonwebtoken");
const { Message, Conversation } = require("../models/Chat.model");

const setupSocket = (io) => {
  // Socket auth middleware — JWT verify karo
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required"));
    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      socket.user = decoded; // { id, role }
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`🟢 Socket connected: ${socket.user.id}`);

    // User apna personal room join kare (notifications ke liye)
    socket.join(`user:${socket.user.id}`);

    // Booking conversation room join karo
    socket.on("join:conversation", (bookingId) => {
      socket.join(`booking:${bookingId}`);
      console.log(`💬 User ${socket.user.id} joined conversation: ${bookingId}`);
    });

    // Message send karo
    socket.on("send:message", async (data) => {
      try {
        const { conversationId, text, imageUrl } = data;

        const conversation = await Conversation.findById(conversationId).populate("booking");
        if (!conversation) return;

        // Participant check
        const isParticipant = conversation.participants.some(p => p.toString() === socket.user.id);
        if (!isParticipant) return;

        // Message save karo
        const message = await Message.create({
          conversation: conversationId,
          sender: socket.user.id,
          text: text || null,
          imageUrl: imageUrl || null,
          type: imageUrl ? "image" : "text",
        });

        await message.populate("sender", "name avatar role");

        // Conversation update
        conversation.lastMessage = text || "📷 Image";
        conversation.lastMessageAt = new Date();

        const booking = conversation.booking;
        const isClient = booking.client.toString() === socket.user.id;
        if (isClient) conversation.unreadCount.owner = (conversation.unreadCount.owner || 0) + 1;
        else conversation.unreadCount.client = (conversation.unreadCount.client || 0) + 1;
        await conversation.save();

        // Sender populate karo before emit
        await message.populate("sender", "name avatar role");
        
        // Booking room me broadcast karo — dono sides ko milega
        io.to(`booking:${booking._id}`).emit("new:message", message);

        // Dusre user ko notification bhi bhejo (agar offline hai)
        const otherUserId = isClient ? booking.owner : booking.client;
        io.to(`user:${otherUserId}`).emit("chat:notification", {
          conversationId,
          bookingId: booking._id,
          senderName: message.sender.name,
          text: text || "📷 Photo",
        });

      } catch (err) {
        console.error("Socket message error:", err.message);
        socket.emit("error", { message: "Message send failed" });
      }
    });

    // Typing indicator
    socket.on("typing:start", ({ bookingId }) => {
      socket.to(`booking:${bookingId}`).emit("typing:start", { userId: socket.user.id });
    });

    socket.on("typing:stop", ({ bookingId }) => {
      socket.to(`booking:${bookingId}`).emit("typing:stop", { userId: socket.user.id });
    });

    // Messages read mark karo
    socket.on("messages:read", async ({ conversationId }) => {
      try {
        await Message.updateMany(
          { conversation: conversationId, sender: { $ne: socket.user.id }, isRead: false },
          { isRead: true }
        );
        socket.to(`conversation:${conversationId}`).emit("messages:read", { userId: socket.user.id });
      } catch {}
    });

    socket.on("disconnect", () => {
      console.log(`🔴 Socket disconnected: ${socket.user.id}`);
    });
  });
};

module.exports = setupSocket;
