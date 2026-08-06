const PDFDocument = require("pdfkit");
const Agreement = require("../models/Agreement.model");
const Booking = require("../models/Booking.model");
const ApiResponse = require("../utils/apiResponse");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

// Unique agreement number generate karna
const generateAgreementNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `ADW-${timestamp}-${random}`;
};

// PDF buffer ko Cloudinary pe upload karna
const uploadPdfToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "adwall/agreements", resource_type: "raw", format: "pdf" },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// @desc   Booking ke liye agreement generate karo
// @route  POST /api/agreements/generate/:bookingId
// @access Private (client/owner)
const generateAgreement = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate("client", "name email mobile")
      .populate("owner", "name email mobile businessDetails")
      .populate("hoarding", "title location dimensions pricing category");

    if (!booking) return res.status(404).json(new ApiResponse(404, null, "Booking not found"));

    if (!["confirmed", "payment_pending", "payment_done"].includes(booking.status)) {
      return res.status(400).json(new ApiResponse(400, null, "Booking confirmed hone ke baad agreement ban sakta hai"));
    }

    // Agar already exist karta hai to return kar do
    const existing = await Agreement.findOne({ booking: booking._id });
    if (existing) return res.status(200).json(new ApiResponse(200, existing, "Agreement already exists"));

    // PDF generate karo using pdfkit
    const pdfBuffer = await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];
      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      const { client, owner, hoarding } = booking;
      const agreementNum = generateAgreementNumber();

      // Header
      doc.fontSize(22).font("Helvetica-Bold").text("ADWALL INDIA", { align: "center" });
      doc.fontSize(14).font("Helvetica").text("Advertising Space Agreement", { align: "center" });
      doc.moveDown();
      doc.fontSize(11).text(`Agreement No: ${agreementNum}`, { align: "right" });
      doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, { align: "right" });
      doc.moveDown();

      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Parties
      doc.fontSize(13).font("Helvetica-Bold").text("PARTIES");
      doc.moveDown(0.5);
      doc.fontSize(11).font("Helvetica");
      doc.text(`Advertiser (Client): ${client.name}`);
      doc.text(`Email: ${client.email} | Mobile: ${client.mobile}`);
      doc.moveDown(0.5);
      doc.text(`Space Owner: ${owner.businessDetails?.agencyName || owner.name}`);
      doc.text(`Email: ${owner.email} | Mobile: ${owner.mobile}`);
      doc.moveDown();

      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Hoarding Details
      doc.fontSize(13).font("Helvetica-Bold").text("ADVERTISEMENT SPACE DETAILS");
      doc.moveDown(0.5);
      doc.fontSize(11).font("Helvetica");
      doc.text(`Title: ${hoarding.title}`);
      doc.text(`Category: ${hoarding.category.replace("_", " ").toUpperCase()}`);
      doc.text(`Location: ${hoarding.location.area}, ${hoarding.location.city}`);
      doc.text(`Size: ${hoarding.dimensions.width} x ${hoarding.dimensions.height} ${hoarding.dimensions.unit}`);
      doc.moveDown();

      // Booking Details
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();
      doc.fontSize(13).font("Helvetica-Bold").text("BOOKING DETAILS");
      doc.moveDown(0.5);
      doc.fontSize(11).font("Helvetica");
      doc.text(`Start Date: ${new Date(booking.startDate).toLocaleDateString("en-IN")}`);
      doc.text(`End Date: ${new Date(booking.endDate).toLocaleDateString("en-IN")}`);
      doc.moveDown();

      // Payment Details
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();
      doc.fontSize(13).font("Helvetica-Bold").text("PAYMENT DETAILS");
      doc.moveDown(0.5);
      doc.fontSize(11).font("Helvetica");
      doc.text(`Base Amount: Rs. ${booking.pricing.baseAmount}`);
      doc.text(`Platform Fee: Rs. ${booking.pricing.platformFee}`);
      doc.text(`GST (18%): Rs. ${booking.pricing.gst}`);
      doc.font("Helvetica-Bold").text(`Total Amount: Rs. ${booking.pricing.totalAmount}`);
      doc.moveDown();

      // Terms
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();
      doc.fontSize(13).font("Helvetica-Bold").text("TERMS & CONDITIONS");
      doc.moveDown(0.5);
      doc.fontSize(10).font("Helvetica");
      const terms = [
        "1. The advertiser shall provide creative material within 48 hours of booking confirmation.",
        "2. Payment is held in escrow and released to owner after client approval of installation.",
        "3. Any damage to the advertising space is the responsibility of the advertiser.",
        "4. Cancellation 24 hours before start date will incur 25% cancellation fee.",
        "5. AdWall India acts as a marketplace facilitator and is not responsible for content accuracy.",
        "6. This agreement is governed by Indian law and jurisdiction of New Delhi courts.",
      ];
      terms.forEach((t) => { doc.text(t); doc.moveDown(0.3); });

      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();
      doc.fontSize(11).font("Helvetica");
      doc.text("Client Signature: _______________________", 50);
      doc.text("Owner Signature: _______________________", 300, doc.y - 14);
      doc.moveDown(2);
      doc.text("AdWall India Platform", { align: "center" });
      doc.text("www.adwall.com | support@adwall.com", { align: "center" });

      doc.end();
    });

    // Upload to Cloudinary
    const uploadResult = await uploadPdfToCloudinary(pdfBuffer);

    const agreementNumber = generateAgreementNumber();
    const agreement = await Agreement.create({
      booking: booking._id,
      client: booking.client._id,
      owner: booking.owner._id,
      hoarding: booking.hoarding._id,
      agreementNumber,
      pdfUrl: uploadResult.secure_url,
    });

    booking.agreementId = agreement._id;
    await booking.save();

    return res.status(201).json(new ApiResponse(201, agreement, "Agreement generate ho gaya"));
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
};

// @desc   Booking ka agreement fetch karo
// @route  GET /api/agreements/booking/:bookingId
// @access Private
const getAgreementByBooking = async (req, res) => {
  try {
    const agreement = await Agreement.findOne({ booking: req.params.bookingId });
    if (!agreement) return res.status(404).json(new ApiResponse(404, null, "Agreement not found"));
    return res.status(200).json(new ApiResponse(200, agreement, "Agreement fetched"));
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
};

// @desc   Client ya owner agreement sign kare
// @route  POST /api/agreements/:id/sign
// @access Private
const signAgreement = async (req, res) => {
  try {
    const agreement = await Agreement.findById(req.params.id);
    if (!agreement) return res.status(404).json(new ApiResponse(404, null, "Agreement not found"));

    const isClient = agreement.client.toString() === req.user.id;
    const isOwner = agreement.owner.toString() === req.user.id;

    if (!isClient && !isOwner) return res.status(403).json(new ApiResponse(403, null, "Access denied"));

    if (isClient) { agreement.clientSigned = true; agreement.clientSignedAt = new Date(); }
    if (isOwner) { agreement.ownerSigned = true; agreement.ownerSignedAt = new Date(); }

    await agreement.save();
    return res.status(200).json(new ApiResponse(200, agreement, "Agreement sign ho gaya"));
  } catch (err) {
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
};

module.exports = { generateAgreement, getAgreementByBooking, signAgreement };
