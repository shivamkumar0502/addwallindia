const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    hoarding: { type: mongoose.Schema.Types.ObjectId, ref: "Hoarding", required: true },

    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    status: {
      type: String,
      enum: ["quote_requested", "quote_received", "confirmed", "payment_pending",
             "payment_done", "installation_pending", "installed", "proof_submitted",
             "client_approved", "completed", "cancelled", "disputed"],
      default: "quote_requested",
    },

    // Pricing breakdown
    pricing: {
      baseAmount: { type: Number, default: 0 },
      platformFee: { type: Number, default: 0 },     // platform ka commission
      gst: { type: Number, default: 0 },
      totalAmount: { type: Number, default: 0 },
      ownerPayout: { type: Number, default: 0 },     // owner ko milega (total - commission)
    },

    // Installation proof (owner upload karega)
    installationProof: {
      images: [{ type: String }],
      video: { type: String, default: null },
      submittedAt: { type: Date, default: null },
    },

    // Client approval
    clientApproval: {
      approved: { type: Boolean, default: false },
      approvedAt: { type: Date, default: null },
      remarks: { type: String, default: null },
    },

    // Cancellation
    cancelledBy: { type: String, enum: ["client", "owner", "admin", null], default: null },
    cancellationReason: { type: String, default: null },
    cancelledAt: { type: Date, default: null },

    // Dispute resolution
    dispute: {
      reason: { type: String, default: null },
      description: { type: String, default: null },
      raisedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      raisedAt: { type: Date, default: null },
      status: { type: String, enum: ["open", "resolved", null], default: null },
      resolution: { type: String, default: null },
      resolvedAt: { type: Date, default: null },
      resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    },

    // References
    agreementId: { type: mongoose.Schema.Types.ObjectId, ref: "Agreement", default: null },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: "Payment", default: null },

    // Requirements (broadcast/quote flow se aata hai)
    requirements: { type: String, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Booking", bookingSchema);
