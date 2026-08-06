const Wallet = require("../models/Wallet.model");
const Transaction = require("../models/Transaction.model");
const ApiResponse = require("../utils/apiResponse");

// @desc   Apna wallet dekho
// @route  GET /api/wallet
// @access Private
const getMyWallet = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet) wallet = await Wallet.create({ user: req.user.id });
    return res.status(200).json(new ApiResponse(200, wallet, "Wallet fetched"));
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
};

// @desc   Transaction history
// @route  GET /api/wallet/transactions
// @access Private
const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const wallet = await Wallet.findOne({ user: req.user.id });
    if (!wallet) return res.status(404).json(new ApiResponse(404, null, "Wallet not found"));

    const query = { wallet: wallet._id };
    if (type) query.type = type;

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Transaction.countDocuments(query),
    ]);

    return res.status(200).json(new ApiResponse(200, { transactions, total, wallet }, "Transactions fetched"));
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
};

// @desc   Admin - kisi bhi user ka wallet dekho
// @route  GET /api/wallet/admin/:userId
// @access Private (admin)
const adminGetWallet = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.params.userId }).populate("user", "name email role");
    if (!wallet) return res.status(404).json(new ApiResponse(404, null, "Wallet not found"));
    return res.status(200).json(new ApiResponse(200, wallet, "Wallet fetched"));
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
};

module.exports = { getMyWallet, getTransactions, adminGetWallet };
