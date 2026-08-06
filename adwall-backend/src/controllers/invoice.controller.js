const PDFDocument = require("pdfkit");
const Booking = require("../models/Booking.model");
const ApiResponse = require("../utils/apiResponse");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");

const uploadPdf = (buffer) => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
    { folder: "adwall/invoices", resource_type: "raw", format: "pdf" },
    (err, result) => err ? reject(err) : resolve(result)
  );
  streamifier.createReadStream(buffer).pipe(stream);
});

const generateInvoiceNumber = (bookingId) => {
  const date = new Date();
  return `INV-${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}-${bookingId.toString().slice(-6).toUpperCase()}`;
};

// @desc   GST Invoice generate + download
// @route  GET /api/invoices/booking/:bookingId
// @access Private (client/owner)
const generateInvoice = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId)
      .populate("client", "name email mobile businessDetails")
      .populate("owner", "name email mobile businessDetails kycDocuments")
      .populate("hoarding", "title location category dimensions");

    if (!booking) return res.status(404).json(new ApiResponse(404, null, "Booking not found"));

    const uid = req.user.id;
    const allowed = booking.client._id.toString() === uid ||
                    booking.owner._id.toString() === uid ||
                    req.user.role === "admin";
    if (!allowed) return res.status(403).json(new ApiResponse(403, null, "Access denied"));

    if (!["payment_done", "proof_submitted", "client_approved", "completed"].includes(booking.status))
      return res.status(400).json(new ApiResponse(400, null, "Payment hone ke baad invoice generate hoga"));

    const invoiceNo = generateInvoiceNumber(booking._id);
    const { client, owner, hoarding, pricing } = booking;
    const gstRate = 0.18;
    const cgst = Math.round((pricing.gst || 0) / 2);
    const sgst = Math.round((pricing.gst || 0) / 2);

    const pdfBuffer = await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const buffers = [];
      doc.on("data", c => buffers.push(c));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", reject);

      // ── Header ──
      doc.rect(0, 0, 595, 120).fill("#f97316");
      doc.fill("#ffffff").fontSize(26).font("Helvetica-Bold").text("ADWALL INDIA", 50, 35);
      doc.fontSize(11).font("Helvetica").text("India ka #1 Outdoor Advertising Marketplace", 50, 65);
      doc.text("www.adwall.in | support@adwall.in | GSTIN: 07XXXXXX1Z5", 50, 82);

      // Invoice label
      doc.fill("#ffffff").fontSize(20).font("Helvetica-Bold").text("TAX INVOICE", 380, 40, { align: "right" });
      doc.fontSize(11).font("Helvetica").text(`Invoice No: ${invoiceNo}`, 380, 68, { align: "right" });
      doc.text(`Date: ${new Date().toLocaleDateString("en-IN")}`, 380, 84, { align: "right" });

      doc.fill("#000000");
      doc.moveDown(4);

      // ── Billed To / From ──
      const y = doc.y;
      doc.fontSize(10).font("Helvetica-Bold").text("BILLED TO:", 50, y);
      doc.font("Helvetica").fontSize(10);
      doc.text(client.name, 50, y + 15);
      doc.text(client.email, 50, y + 27);
      doc.text(client.mobile, 50, y + 39);
      if (client.businessDetails?.companyName) doc.text(client.businessDetails.companyName, 50, y + 51);

      doc.fontSize(10).font("Helvetica-Bold").text("SERVICE PROVIDER:", 320, y);
      doc.font("Helvetica").fontSize(10);
      doc.text(owner.businessDetails?.agencyName || owner.name, 320, y + 15);
      doc.text(owner.email, 320, y + 27);
      doc.text(owner.mobile, 320, y + 39);
      if (owner.kycDocuments?.gstNumber) doc.text(`GSTIN: ${owner.kycDocuments.gstNumber}`, 320, y + 51);

      doc.moveDown(5);

      // ── Service Details Table ──
      const tableY = doc.y + 10;
      doc.rect(50, tableY, 495, 24).fill("#f3f4f6");
      doc.fill("#111827").font("Helvetica-Bold").fontSize(9);
      doc.text("DESCRIPTION", 60, tableY + 7);
      doc.text("LOCATION", 220, tableY + 7);
      doc.text("PERIOD", 320, tableY + 7);
      doc.text("AMOUNT", 490, tableY + 7, { align: "right" });

      doc.rect(50, tableY + 24, 495, 1).fill("#e5e7eb");

      const rowY = tableY + 34;
      doc.fill("#374151").font("Helvetica").fontSize(9);
      doc.text(`${hoarding.category?.replace(/_/g, " ").toUpperCase()} - ${hoarding.title}`, 60, rowY, { width: 150 });
      doc.text(`${hoarding.location?.area}, ${hoarding.location?.city}`, 220, rowY, { width: 95 });
      doc.text(`${new Date(booking.startDate).toLocaleDateString("en-IN")} to\n${new Date(booking.endDate).toLocaleDateString("en-IN")}`, 320, rowY);
      doc.text(`Rs. ${pricing.baseAmount?.toLocaleString("en-IN")}`, 490, rowY, { align: "right" });

      // ── Tax Summary ──
      const summaryY = rowY + 60;
      doc.rect(50, summaryY, 495, 1).fill("#e5e7eb");

      const summaryRows = [
        ["Sub Total", `Rs. ${pricing.baseAmount?.toLocaleString("en-IN")}`],
        ["Platform Fee", `Rs. ${pricing.platformFee?.toLocaleString("en-IN")}`],
        [`CGST @ ${(gstRate / 2 * 100).toFixed(0)}%`, `Rs. ${cgst.toLocaleString("en-IN")}`],
        [`SGST @ ${(gstRate / 2 * 100).toFixed(0)}%`, `Rs. ${sgst.toLocaleString("en-IN")}`],
      ];

      summaryRows.forEach(([label, value], i) => {
        const sy = summaryY + 12 + i * 18;
        doc.fill("#6b7280").font("Helvetica").fontSize(9).text(label, 350, sy);
        doc.fill("#374151").text(value, 490, sy, { align: "right" });
      });

      // Total
      const totalY = summaryY + 90;
      doc.rect(350, totalY, 195, 28).fill("#f97316");
      doc.fill("#ffffff").font("Helvetica-Bold").fontSize(12)
        .text("TOTAL AMOUNT", 360, totalY + 7)
        .text(`Rs. ${pricing.totalAmount?.toLocaleString("en-IN")}`, 490, totalY + 7, { align: "right" });

      // ── Footer ──
      const footerY = totalY + 60;
      doc.fill("#374151").font("Helvetica").fontSize(8);
      doc.text("Terms & Conditions:", 50, footerY, { font: "Helvetica-Bold" });
      doc.text("1. This invoice is computer generated and is valid without signature.", 50, footerY + 14);
      doc.text("2. Payment is held in escrow and released upon client approval.", 50, footerY + 26);
      doc.text("3. GST is applicable as per Indian tax regulations.", 50, footerY + 38);
      doc.text("4. For disputes, contact support@adwall.in within 7 days.", 50, footerY + 50);

      doc.rect(50, footerY + 70, 495, 1).fill("#e5e7eb");
      doc.fill("#9ca3af").fontSize(8).text(
        "AdWall India Pvt. Ltd. | CIN: UXXXXX | New Delhi, India | adwall.in",
        50, footerY + 80, { align: "center", width: 495 }
      );

      doc.end();
    });

    const result = await uploadPdf(pdfBuffer);

    return res.status(200).json(new ApiResponse(200, {
      invoiceNumber: invoiceNo,
      pdfUrl: result.secure_url,
      booking: req.params.bookingId,
    }, "Invoice ready hai!"));
  } catch (err) { return res.status(500).json(new ApiResponse(500, null, err.message)); }
};

module.exports = { generateInvoice };
