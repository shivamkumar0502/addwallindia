const nodemailer = require("nodemailer");
const Notification = require("../models/Notification.model");

/* ─────────────────────────────────────────
   Email transporter
───────────────────────────────────────── */
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.gmail.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: false,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

/* ─────────────────────────────────────────
   SMS via Twilio (lazy load — agar key nahi hai to skip)
───────────────────────────────────────── */
const getSmsClient = () => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) return null;
  try {
    const twilio = require("twilio");
    return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  } catch { return null; }
};

/* ─────────────────────────────────────────
   HTML Email Template
───────────────────────────────────────── */
const emailTemplate = (title, body, ctaText = null, ctaLink = null) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:30px 0;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#f97316,#ea580c);padding:28px 32px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:rgba(255,255,255,0.2);border-radius:8px;padding:8px 12px;margin-right:10px;">
                  <span style="color:#fff;font-size:16px;font-weight:900;">AW</span>
                </td>
                <td style="padding-left:12px;">
                  <span style="color:#fff;font-size:20px;font-weight:900;">AdWall India</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            <h2 style="margin:0 0 16px;color:#111827;font-size:22px;">${title}</h2>
            ${body}
            ${ctaText && ctaLink ? `
            <div style="margin-top:28px;text-align:center;">
              <a href="${ctaLink}" style="background:#f97316;color:#fff;padding:12px 32px;border-radius:8px;font-weight:700;text-decoration:none;display:inline-block;">${ctaText}</a>
            </div>` : ""}
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:20px 32px;border-top:1px solid #e5e7eb;">
            <p style="margin:0;color:#6b7280;font-size:12px;text-align:center;">
              AdWall India — India ka #1 Outdoor Advertising Marketplace<br/>
              <a href="https://adwall.in" style="color:#f97316;">adwall.in</a> | 
              <a href="mailto:support@adwall.in" style="color:#f97316;">support@adwall.in</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

/* ─────────────────────────────────────────
   Core senders
───────────────────────────────────────── */
const sendEmail = async ({ to, subject, html }) => {
  if (process.env.NOTIFY_EMAIL === "false" || !process.env.EMAIL_USER) return;
  try {
    await transporter.sendMail({ from: process.env.EMAIL_FROM || "AdWall India <noreply@adwall.in>", to, subject, html });
    console.log(`📧 Email sent → ${to}`);
  } catch (err) {
    console.error(`❌ Email failed → ${to}:`, err.message);
  }
};

const sendSMS = async (mobile, message) => {
  if (process.env.NOTIFY_SMS === "false" || !mobile) return;
  // Clean mobile number
  const cleaned = mobile?.replace(/\D/g, "");
  if (!cleaned || cleaned.length < 10 || cleaned.startsWith("pending")) return;

  const client = getSmsClient();
  if (!client) {
    console.log(`📱 SMS (no Twilio key) → ${mobile}: ${message}`);
    return;
  }
  try {
    const to = cleaned.startsWith("91") ? `+${cleaned}` : `+91${cleaned.slice(-10)}`;
    await client.messages.create({ body: message, from: process.env.TWILIO_PHONE_FROM, to });
    console.log(`📱 SMS sent → ${to}`);
  } catch (err) {
    console.error(`❌ SMS failed → ${mobile}:`, err.message);
  }
};

const createInAppNotification = async ({ userId, title, message, type, reference, referenceModel }) => {
  try {
    await Notification.create({ user: userId, title, message, type, reference, referenceModel });
  } catch (err) {
    console.error("In-app notification error:", err.message);
  }
};

/* ─────────────────────────────────────────
   NOTIFICATION TEMPLATES — ALL KEY EVENTS
───────────────────────────────────────── */

// 1. New booking request → Owner ko batao
const notifyNewBooking = async (booking, client, owner) => {
  const msg = `AdWall: Naya booking request aaya hai! ${client.name} ne aapki hoarding book karne ki request ki hai. App pe dekho aur quote bhejo.`;

  await Promise.all([
    sendSMS(owner.mobile, msg),
    sendEmail({
      to: owner.email,
      subject: "📋 Naya Booking Request — AdWall India",
      html: emailTemplate(
        "Naya Booking Request Aaya!",
        `<p style="color:#374151;font-size:15px;">Hello <strong>${owner.name}</strong>,</p>
         <p style="color:#374151;">Ek advertiser ne aapki hoarding book karne ki request ki hai. Jaldi quote bhejo!</p>
         <table style="background:#f9fafb;border-radius:8px;padding:16px;width:100%;border:1px solid #e5e7eb;">
           <tr><td><strong>Client:</strong></td><td>${client.name} (${client.email})</td></tr>
           <tr><td><strong>Dates:</strong></td><td>${new Date(booking.startDate).toLocaleDateString("en-IN")} → ${new Date(booking.endDate).toLocaleDateString("en-IN")}</td></tr>
           ${booking.requirements ? `<tr><td><strong>Requirements:</strong></td><td>${booking.requirements}</td></tr>` : ""}
         </table>`,
        "App Pe Dekho & Quote Bhejo",
        `${process.env.CLIENT_URL}/owner/bookings/${booking._id}`
      ),
    }),
    createInAppNotification({ userId: owner._id, title: "Naya Booking Request!", message: `${client.name} ne quote request kiya hai.`, type: "booking", reference: booking._id, referenceModel: "Booking" }),
  ]);
};

// 2. Quote received → Client ko batao
const notifyQuoteReceived = async (quote, client, owner) => {
  const amount = `₹${quote.amount.toLocaleString("en-IN")}`;
  const msg = `AdWall: ${owner.name} ne ${amount} ka quote bheja hai. App pe dekho aur accept/reject karo.`;

  await Promise.all([
    sendSMS(client.mobile, msg),
    sendEmail({
      to: client.email,
      subject: `💰 Naya Quote Aaya — ${amount} — AdWall India`,
      html: emailTemplate(
        `Quote Aaya: ${amount}`,
        `<p style="color:#374151;">Hello <strong>${client.name}</strong>,</p>
         <p style="color:#374151;"><strong>${owner.name}</strong> ne aapki hoarding request ke liye quote bheja hai.</p>
         <table style="background:#fff7ed;border-radius:8px;padding:20px;width:100%;border:2px solid #fed7aa;text-align:center;">
           <tr><td><span style="font-size:32px;font-weight:900;color:#f97316;">${amount}</span></td></tr>
           <tr><td style="color:#6b7280;font-size:13px;">Proposed Amount</td></tr>
           ${quote.message ? `<tr><td style="padding-top:12px;font-style:italic;color:#374151;">"${quote.message}"</td></tr>` : ""}
         </table>
         <p style="color:#374151;margin-top:16px;">Valid until: <strong>${new Date(quote.validUntil).toLocaleDateString("en-IN")}</strong></p>`,
        "Quote Accept/Reject Karo",
        `${process.env.CLIENT_URL}/client/bookings/${quote.booking}`
      ),
    }),
    createInAppNotification({ userId: client._id, title: `Quote Aaya — ${amount}`, message: `${owner.name} ne quote bheja hai. Accept ya reject karo.`, type: "quote", reference: quote._id, referenceModel: "Quote" }),
  ]);
};

// 3. Quote accepted → Owner ko batao
const notifyQuoteAccepted = async (quote, booking, client, owner) => {
  const amount = `₹${quote.amount.toLocaleString("en-IN")}`;
  const msg = `AdWall: ${client.name} ne aapka ${amount} ka quote ACCEPT kar liya! Ab payment ka wait karo.`;

  await Promise.all([
    sendSMS(owner.mobile, msg),
    sendEmail({
      to: owner.email,
      subject: `✅ Quote Accept Ho Gaya — ${amount} — AdWall India`,
      html: emailTemplate(
        "Quote Accept Ho Gaya! 🎉",
        `<p style="color:#374151;">Hello <strong>${owner.name}</strong>,</p>
         <p style="color:#374151;"><strong>${client.name}</strong> ne aapka <strong>${amount}</strong> ka quote accept kar liya hai!</p>
         <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:8px;padding:16px;text-align:center;">
           <p style="color:#166534;font-size:18px;font-weight:700;margin:0;">Payment Pending hai</p>
           <p style="color:#15803d;margin:8px 0 0;">Client jald payment karega. Paisa escrow mein safe rahega.</p>
         </div>`,
        "Booking Dekho",
        `${process.env.CLIENT_URL}/owner/bookings/${booking._id}`
      ),
    }),
    createInAppNotification({ userId: owner._id, title: "Quote Accept Ho Gaya!", message: `${client.name} ne aapka ${amount} ka quote accept kiya. Payment aa raha hai.`, type: "quote", reference: quote._id, referenceModel: "Quote" }),
  ]);
};

// 4. ⭐ PAYMENT DONE → Owner ko batao (yahi sabse important hai!)
const notifyPaymentDone = async (payment, booking, client, owner) => {
  const amount = `₹${payment.amount.toLocaleString("en-IN")}`;
  const payout = `₹${payment.ownerPayout.toLocaleString("en-IN")}`;
  const msg = `AdWall: 💰 PAYMENT HO GAYI! ${client.name} ne ${amount} pay kar diya. Escrow mein safe hai. Ab installation karo aur proof upload karo. App pe dekho.`;

  await Promise.all([
    // Owner ko SMS
    sendSMS(owner.mobile, msg),
    // Owner ko Email
    sendEmail({
      to: owner.email,
      subject: `💰 Payment Received — ${amount} — AdWall India`,
      html: emailTemplate(
        "Payment Ho Gayi! Ab Installation Karo 🎉",
        `<p style="color:#374151;">Hello <strong>${owner.name}</strong>,</p>
         <p style="color:#374151;"><strong>${client.name}</strong> ne payment complete kar li hai. Paisa escrow mein safe hai.</p>
         <table style="background:#f0fdf4;border-radius:12px;padding:20px;width:100%;border:2px solid #86efac;">
           <tr>
             <td style="text-align:center;padding:10px;">
               <p style="margin:0;color:#6b7280;font-size:12px;">Total Payment</p>
               <p style="margin:4px 0 0;font-size:28px;font-weight:900;color:#15803d;">${amount}</p>
             </td>
             <td style="text-align:center;padding:10px;border-left:1px solid #86efac;">
               <p style="margin:0;color:#6b7280;font-size:12px;">Aapka Payout</p>
               <p style="margin:4px 0 0;font-size:28px;font-weight:900;color:#f97316;">${payout}</p>
             </td>
           </tr>
         </table>
         <div style="background:#fefce8;border:1px solid #fde047;border-radius:8px;padding:16px;margin-top:16px;">
           <p style="margin:0;color:#854d0e;font-weight:700;">📋 Aapka Next Step:</p>
           <ol style="color:#92400e;margin:8px 0 0;padding-left:20px;">
             <li>Hoarding install karo</li>
             <li>Clear photos lo (4-5 angles se)</li>
             <li>App pe "Submit Proof" karo</li>
             <li>Client approve karega to payout mil jayega!</li>
           </ol>
         </div>`,
        "App Pe Jao & Proof Upload Karo",
        `${process.env.CLIENT_URL}/owner/bookings/${booking._id}`
      ),
    }),
    // Client ko bhi confirmation
    sendSMS(client.mobile, `AdWall: Payment successful! ₹${payment.amount.toLocaleString("en-IN")} escrow mein safe hai. Owner installation complete karega.`),
    sendEmail({
      to: client.email,
      subject: `✅ Payment Successful — ${amount} — AdWall India`,
      html: emailTemplate(
        "Payment Successful! 🎉",
        `<p style="color:#374151;">Hello <strong>${client.name}</strong>,</p>
         <p style="color:#374151;">Aapka payment successfully complete ho gaya hai. Paisa secure escrow mein hold hai.</p>
         <div style="background:#f0fdf4;border-radius:8px;padding:20px;text-align:center;border:2px solid #86efac;">
           <p style="font-size:32px;font-weight:900;color:#15803d;margin:0;">${amount}</p>
           <p style="color:#6b7280;margin:4px 0 0;">Escrow mein safe hai</p>
         </div>
         <p style="color:#374151;margin-top:16px;">Owner jald installation complete karega. Aap proof dekh ke approve karoge tabhi payment release hogi.</p>`,
        "Booking Status Dekho",
        `${process.env.CLIENT_URL}/client/bookings/${booking._id}`
      ),
    }),
    // In-app notifications
    createInAppNotification({ userId: owner._id, title: "Payment Received! 💰", message: `${client.name} ne ${amount} pay kar diya. Ab installation karo!`, type: "payment", reference: payment._id, referenceModel: "Payment" }),
    createInAppNotification({ userId: client._id, title: "Payment Successful! ✅", message: `${amount} escrow mein safe hai. Owner installation karega.`, type: "payment", reference: payment._id, referenceModel: "Payment" }),
  ]);
};

// 5. Proof submitted → Client ko batao
const notifyProofSubmitted = async (booking, client, owner) => {
  const msg = `AdWall: ${owner.name} ne installation complete kar diya aur proof submit kar diya. App pe dekho aur approve karo taaki payment release ho.`;

  await Promise.all([
    sendSMS(client.mobile, msg),
    sendEmail({
      to: client.email,
      subject: "📸 Installation Proof Submitted — Approve Karo — AdWall India",
      html: emailTemplate(
        "Installation Ho Gayi! Approve Karo 👀",
        `<p style="color:#374151;">Hello <strong>${client.name}</strong>,</p>
         <p style="color:#374151;"><strong>${owner.name}</strong> ne hoarding install kar di aur photo proof submit kar diya hai.</p>
         <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;">
           <p style="margin:0;color:#1e40af;font-weight:700;">📋 Aapka Action Required:</p>
           <p style="color:#1d4ed8;margin:8px 0 0;">App pe jao → Installation proof dekho → Approve karo → Aapka campaign live hai!</p>
         </div>
         <p style="color:#6b7280;font-size:13px;margin-top:12px;">Note: Approve karte hi payment owner ko release ho jayegi.</p>`,
        "Proof Dekho & Approve Karo",
        `${process.env.CLIENT_URL}/client/bookings/${booking._id}`
      ),
    }),
    createInAppNotification({ userId: client._id, title: "Installation Proof Aaya! 📸", message: "Owner ne proof submit kiya. Please verify karo aur approve karo.", type: "booking", reference: booking._id, referenceModel: "Booking" }),
  ]);
};

// 6. Payment released → Owner ko batao
const notifyPaymentReleased = async (payment, owner, booking) => {
  const payout = `₹${payment.ownerPayout.toLocaleString("en-IN")}`;
  const msg = `AdWall: 🎉 PAYMENT RELEASE! ${payout} aapke AdWall wallet mein aa gaya! Withdrawal ke liye app pe dekho.`;

  await Promise.all([
    sendSMS(owner.mobile, msg),
    sendEmail({
      to: owner.email,
      subject: `🎉 Payment Released — ${payout} — AdWall India`,
      html: emailTemplate(
        "Payment Release Ho Gayi! 🎉",
        `<p style="color:#374151;">Hello <strong>${owner.name}</strong>,</p>
         <p style="color:#374151;">Client ne installation approve kar diya. Aapka payout wallet mein aa gaya!</p>
         <div style="background:linear-gradient(135deg,#fff7ed,#fef3c7);border-radius:12px;padding:24px;text-align:center;border:2px solid #fed7aa;">
           <p style="margin:0;color:#6b7280;font-size:13px;">Credited to Wallet</p>
           <p style="margin:8px 0;font-size:40px;font-weight:900;color:#f97316;">${payout}</p>
           <p style="margin:0;color:#92400e;font-size:12px;">AdWall Wallet Balance mein add ho gaya</p>
         </div>`,
        "Wallet Dekho",
        `${process.env.CLIENT_URL}/owner/wallet`
      ),
    }),
    createInAppNotification({ userId: owner._id, title: `Payment Released! ${payout} 🎉`, message: "Client ne approve kar diya. Paisa wallet mein aa gaya!", type: "payment", reference: payment._id, referenceModel: "Payment" }),
  ]);
};

// 7. KYC status → Owner
const notifyKycStatus = async (owner, status, rejectionReason = "") => {
  const isVerified = status === "verified";
  const msg = isVerified
    ? `AdWall: Congratulations! Aapka KYC verify ho gaya. Ab app pe hoarding add kar sakte ho.`
    : `AdWall: Aapka KYC reject hua. Reason: ${rejectionReason || "Documents unclear"}. Dobara submit karo.`;

  await Promise.all([
    sendSMS(owner.mobile, msg),
    sendEmail({
      to: owner.email,
      subject: isVerified ? "✅ KYC Verified — AdWall India" : "❌ KYC Rejected — AdWall India",
      html: emailTemplate(
        isVerified ? "KYC Verified! Hoardings Add Karo 🎉" : "KYC Rejected — Dobara Try Karo",
        isVerified
          ? `<p style="color:#374151;">Hello <strong>${owner.name}</strong>,</p>
             <p>Badhai ho! Aapka KYC verification successful raha. Ab aap platform pe hoardings list kar sakte ho.</p>
             <div style="background:#f0fdf4;border-radius:8px;padding:16px;border:2px solid #86efac;">
               <p style="color:#15803d;font-weight:700;margin:0;">✅ Aap ab kar sakte ho:</p>
               <ul style="color:#166534;margin:8px 0 0;">
                 <li>Hoardings aur ad spaces list karo</li>
                 <li>Client bookings accept karo</li>
                 <li>Payments receive karo</li>
               </ul>
             </div>`
          : `<p style="color:#374151;">Hello <strong>${owner.name}</strong>,</p>
             <p>Aapka KYC reject hua hai.</p>
             <div style="background:#fef2f2;border-radius:8px;padding:16px;border:2px solid #fca5a5;">
               <p style="color:#dc2626;font-weight:700;margin:0;">Rejection Reason:</p>
               <p style="color:#991b1b;margin:8px 0 0;">${rejectionReason || "Documents unclear ya incomplete hain."}</p>
             </div>
             <p style="margin-top:16px;color:#374151;">Sahi aur clear documents ke saath dobara submit karo.</p>`,
        isVerified ? "Hoarding Add Karo" : "Dobara Submit Karo",
        isVerified ? `${process.env.CLIENT_URL}/owner/add-hoarding` : `${process.env.CLIENT_URL}/owner/kyc`
      ),
    }),
    createInAppNotification({ userId: owner._id, title: isVerified ? "KYC Verified! ✅" : "KYC Rejected ❌", message: isVerified ? "Hoardings add karna shuru karo!" : `Reason: ${rejectionReason}. Dobara submit karo.`, type: "kyc" }),
  ]);
};

// 8. Hoarding verified/rejected → Owner
const notifyHoardingStatus = async (hoarding, owner, status, rejectionReason = "") => {
  const isVerified = status === "verified";
  const msg = isVerified
    ? `AdWall: Aapki hoarding "${hoarding.title}" verify ho gayi! Ab advertisers isse book kar sakte hain.`
    : `AdWall: Hoarding "${hoarding.title}" reject hui. Reason: ${rejectionReason}. Update karke resubmit karo.`;

  await Promise.all([
    sendSMS(owner.mobile, msg),
    sendEmail({
      to: owner.email,
      subject: isVerified ? "✅ Hoarding Verified — AdWall India" : "❌ Hoarding Rejected — AdWall India",
      html: emailTemplate(
        isVerified ? `Hoarding Live Ho Gayi! 🎉` : "Hoarding Rejected",
        `<p style="color:#374151;">Hello <strong>${owner.name}</strong>,</p>
         <p><strong>"${hoarding.title}"</strong> — ${isVerified ? "verify aur live ho gayi hai!" : "reject ho gayi hai."}</p>
         ${!isVerified ? `<div style="background:#fef2f2;border-radius:8px;padding:16px;border:2px solid #fca5a5;">
           <p style="color:#dc2626;font-weight:700;margin:0;">Reason: ${rejectionReason}</p>
         </div>` : ""}`,
        isVerified ? "Dashboard Dekho" : "Hoarding Update Karo",
        `${process.env.CLIENT_URL}/owner/hoardings`
      ),
    }),
    createInAppNotification({ userId: owner._id, title: isVerified ? "Hoarding Live! 🎉" : "Hoarding Rejected", message: isVerified ? `"${hoarding.title}" ab visible hai.` : `Reason: ${rejectionReason}`, type: "booking" }),
  ]);
};

// 9. Booking cancellation
const notifyCancellation = async (booking, cancelledBy, client, owner) => {
  const notifyUser = cancelledBy === "client" ? owner : client;
  const cancellerName = cancelledBy === "client" ? client.name : owner.name;
  const msg = `AdWall: Booking cancel ho gayi. ${cancellerName} ne cancel kiya. App pe details dekho.`;

  await Promise.all([
    sendSMS(notifyUser.mobile, msg),
    sendEmail({
      to: notifyUser.email,
      subject: "❌ Booking Cancelled — AdWall India",
      html: emailTemplate(
        "Booking Cancel Ho Gayi",
        `<p style="color:#374151;">Hello <strong>${notifyUser.name}</strong>,</p>
         <p><strong>${cancellerName}</strong> ne booking cancel kar di hai.</p>
         ${booking.cancellationReason ? `<div style="background:#fef2f2;border-radius:8px;padding:12px;"><p style="color:#991b1b;margin:0;"><strong>Reason:</strong> ${booking.cancellationReason}</p></div>` : ""}`,
        "Support Se Contact Karo",
        `mailto:support@adwall.in`
      ),
    }),
    createInAppNotification({ userId: notifyUser._id, title: "Booking Cancelled", message: `${cancellerName} ne booking cancel ki.`, type: "booking", reference: booking._id, referenceModel: "Booking" }),
  ]);
};

module.exports = {
  sendEmail,
  sendSMS,
  createInAppNotification,
  notifyNewBooking,
  notifyQuoteReceived,
  notifyQuoteAccepted,
  notifyPaymentDone,
  notifyProofSubmitted,
  notifyPaymentReleased,
  notifyKycStatus,
  notifyHoardingStatus,
  notifyCancellation,
};

/* ─────────────────────────────────────────
   WhatsApp via Twilio WhatsApp Business API
   (Twilio me WhatsApp sender approve karwao pehle)
───────────────────────────────────────── */
const sendWhatsApp = async (mobile, message) => {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_WHATSAPP_FROM) return;
  const cleaned = mobile?.replace(/\D/g, "");
  if (!cleaned || cleaned.length < 10 || cleaned.startsWith("pending")) return;

  const client = getSmsClient();
  if (!client) return;

  try {
    const to = cleaned.startsWith("91") ? `+${cleaned}` : `+91${cleaned.slice(-10)}`;
    await client.messages.create({
      body: message,
      from: `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}`,
      to: `whatsapp:${to}`,
    });
    console.log(`💬 WhatsApp sent → ${to}`);
  } catch (err) {
    console.error(`❌ WhatsApp failed → ${mobile}:`, err.message);
  }
};

module.exports.sendWhatsApp = sendWhatsApp;
