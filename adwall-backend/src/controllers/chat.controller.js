const { Conversation, Message } = require("../models/Chat.model");
const Booking = require("../models/Booking.model");
const ApiResponse = require("../utils/apiResponse");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

// @desc   Booking ke liye conversation get/create karo
// @route  GET /api/chat/booking/:bookingId
// @access Private (client/owner involved in booking)
const getOrCreateConversation = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json(new ApiResponse(404, null, "Booking not found"));

    const uid = req.user.id;
    const isAllowed = booking.client.toString() === uid || booking.owner.toString() === uid || req.user.role === "admin";
    if (!isAllowed) return res.status(403).json(new ApiResponse(403, null, "Access denied"));

    let conversation = await Conversation.findOne({ booking: bookingId })
      .populate("participants", "name avatar role");

    if (!conversation) {
      conversation = await Conversation.create({
        booking: bookingId,
        participants: [booking.client, booking.owner],
      });
      conversation = await Conversation.findById(conversation._id).populate("participants", "name avatar role");
    }

    // Unread count reset karo (jo user open kar raha hai uske liye)
    const isClient = booking.client.toString() === uid;
    if (isClient) conversation.unreadCount.client = 0;
    else conversation.unreadCount.owner = 0;
    await conversation.save();

    return res.status(200).json(new ApiResponse(200, conversation, "Conversation fetched"));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

// @desc   Messages fetch karo (paginated)
// @route  GET /api/chat/:conversationId/messages
// @access Private
const getMessages = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const messages = await Message.find({ conversation: req.params.conversationId })
      .populate("sender", "name avatar role")
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return res.status(200).json(new ApiResponse(200, messages.reverse(), "Messages fetched"));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

// @desc   Text message send karo (REST fallback — Socket.io preferred)
// @route  POST /api/chat/:conversationId/send
// @access Private
const sendMessage = async (req, res) => {
  try {
    const { text } = req.body;
    const conversation = await Conversation.findById(req.params.conversationId)
      .populate("booking");

    if (!conversation) return res.status(404).json(new ApiResponse(404, null, "Conversation not found"));

    const isParticipant = conversation.participants.some(p => p.toString() === req.user.id);
    if (!isParticipant) return res.status(403).json(new ApiResponse(403, null, "Access denied"));

    let imageUrl = null;
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, "chat");
      imageUrl = result.secure_url;
    }

    // Message create karo
    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user.id,
      text: text || null,
      imageUrl,
      type: imageUrl ? "image" : "text",
    });

    await message.populate("sender", "name avatar role");

    // Conversation last message update
    conversation.lastMessage = text || "📷 Image";
    conversation.lastMessageAt = new Date();

    // Dusre participant ka unread badhao
    const booking = conversation.booking;
    const isClient = booking.client.toString() === req.user.id;
    if (isClient) conversation.unreadCount.owner = (conversation.unreadCount.owner || 0) + 1;
    else conversation.unreadCount.client = (conversation.unreadCount.client || 0) + 1;
    await conversation.save();

    return res.status(201).json(new ApiResponse(201, message, "Message sent"));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

// @desc   User ki saari conversations
// @route  GET /api/chat/my
// @access Private
const getMyConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user.id })
      .populate("participants", "name avatar role")
      .populate("booking", "status hoarding")
      .sort({ lastMessageAt: -1 });

    return res.status(200).json(new ApiResponse(200, conversations, "Conversations fetched"));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

module.exports = { getOrCreateConversation, getMessages, sendMessage, getMyConversations };
