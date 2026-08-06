const Notification = require("../models/Notification.model");
const ApiResponse = require("../utils/apiResponse");

// @desc   Apni notifications dekho
// @route  GET /api/notifications
// @access Private
const getMyNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const query = { user: req.user.id };
    if (unreadOnly === "true") query.isRead = false;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(parseInt(limit)),
      Notification.countDocuments(query),
      Notification.countDocuments({ user: req.user.id, isRead: false }),
    ]);

    return res.status(200).json(new ApiResponse(200, { notifications, total, unreadCount }, "Notifications fetched"));
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
};

// @desc   Notification read mark karo
// @route  PATCH /api/notifications/:id/read
// @access Private
const markAsRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isRead: true }
    );
    return res.status(200).json(new ApiResponse(200, null, "Marked as read"));
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
};

// @desc   Saari notifications read mark karo
// @route  PATCH /api/notifications/read-all
// @access Private
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user.id, isRead: false }, { isRead: true });
    return res.status(200).json(new ApiResponse(200, null, "All notifications marked as read"));
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
};

module.exports = { getMyNotifications, markAsRead, markAllAsRead };
