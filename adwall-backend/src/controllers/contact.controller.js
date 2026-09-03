const notify = require("../services/notification.service");
const ApiResponse = require("../utils/apiResponse");

// Naya file. Pehle contact form ka koi backend tha hi nahi —
// Contact.jsx me sirf `// TODO: Wire to backend contact API` likha tha
// aur form submit karne pe seedha "Message Send Ho Gaya!" dikha deta tha.
// Message kahin jaata hi nahi tha.

// Simple in-memory rate limit — ek IP 10 min me 3 se zyada message na bheje
const recent = new Map();
const RATE_WINDOW = 10 * 60 * 1000;
const RATE_MAX = 3;

const isRateLimited = (ip) => {
  const now = Date.now();
  const hits = (recent.get(ip) || []).filter((t) => now - t < RATE_WINDOW);
  if (hits.length >= RATE_MAX) return true;
  hits.push(now);
  recent.set(ip, hits);
  return false;
};

// Purane entries hata do taaki memory na bhare
setInterval(() => {
  const now = Date.now();
  for (const [ip, hits] of recent) {
    const live = hits.filter((t) => now - t < RATE_WINDOW);
    if (live.length) recent.set(ip, live);
    else recent.delete(ip);
  }
}, RATE_WINDOW).unref();

const esc = (s) =>
  String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

// @route POST /api/contact
// @access Public
const sendContactMessage = async (req, res) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.toLowerCase().trim();
    const mobile = req.body.mobile?.trim();
    const subject = req.body.subject?.trim();
    const message = req.body.message?.trim();

    if (!name || !email || !subject || !message)
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Name, email, subject aur message required hain"));

    if (!/^\S+@\S+\.\S+$/.test(email))
      return res.status(400).json(new ApiResponse(400, null, "Valid email daalo"));

    if (message.length > 2000)
      return res.status(400).json(new ApiResponse(400, null, "Message bahut lamba hai (max 2000)"));

    const ip = req.headers["x-forwarded-for"]?.split(",")[0] || req.ip;
    if (isRateLimited(ip))
      return res
        .status(429)
        .json(new ApiResponse(429, null, "Bahut messages bhej diye. 10 minute baad try karo."));

    // .env me ADMIN_EMAIL / ADMIN_MOBILE set karo
    const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    const adminMobile = process.env.ADMIN_MOBILE;

    // ── 1. Admin ko poora message ──
    const adminMail = notify.sendEmail({
      to: adminEmail,
      subject: `[Contact] ${subject}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
          <div style="background:#f97316;padding:16px;border-radius:12px 12px 0 0;">
            <h2 style="color:#fff;margin:0;font-size:18px;">Naya Contact Message</h2>
          </div>
          <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:24px;">
            <table style="width:100%;font-size:14px;border-collapse:collapse;">
              <tr><td style="padding:6px 0;color:#6b7280;width:90px;">Naam</td><td><strong>${esc(name)}</strong></td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;">Email</td><td><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;">Mobile</td><td>${esc(mobile) || "—"}</td></tr>
              <tr><td style="padding:6px 0;color:#6b7280;">Subject</td><td>${esc(subject)}</td></tr>
            </table>
            <div style="margin-top:18px;padding:16px;background:#f9fafb;border-radius:8px;border-left:3px solid #f97316;">
              <p style="margin:0;white-space:pre-wrap;color:#111827;font-size:14px;">${esc(message)}</p>
            </div>
            <p style="margin-top:18px;font-size:12px;color:#9ca3af;">
              Reply karne ke liye seedha ${esc(email)} pe mail karo.
            </p>
          </div>
        </div>`,
    });

    // ── 2. Admin ko SMS alert (chhota, kyunki SMS ka kharcha hai) ──
    const adminSms = adminMobile
      ? notify.sendSMS(
          adminMobile,
          `AdWall: Naya contact message. ${name} (${mobile || email}) - ${subject.slice(0, 60)}`
        )
      : Promise.resolve(false);

    // ── 3. User ko confirmation ──
    const userMail = notify.sendEmail({
      to: email,
      subject: "Aapka message mil gaya — AdWall India",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;">
          <div style="background:#f97316;padding:20px;border-radius:12px 12px 0 0;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:22px;">AdWall India</h1>
          </div>
          <div style="border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:28px;">
            <p style="font-size:15px;color:#111827;">Hi ${esc(name)},</p>
            <p style="font-size:14px;color:#4b5563;line-height:1.6;">
              Aapka message mil gaya hai. Hamari team 24 working hours ke andar reply karegi.
            </p>
            <div style="margin:18px 0;padding:14px;background:#f9fafb;border-radius:8px;border-left:3px solid #f97316;">
              <p style="margin:0 0 6px;font-size:12px;color:#6b7280;">Aapka message:</p>
              <p style="margin:0;font-size:14px;color:#111827;white-space:pre-wrap;">${esc(message)}</p>
            </div>
            <p style="font-size:13px;color:#6b7280;">Urgent hai? +91 9955950777 pe call karo.</p>
          </div>
        </div>`,
    });

    const [adminMailOk, adminSmsOk] = await Promise.all([adminMail, adminSms, userMail]);

    // Admin tak koi bhi channel nahi pahuncha to jhooth mat bolo
    if (!adminMailOk && !adminSmsOk) {
      console.error("❌ Contact message kisi channel se nahi gaya:", { name, email, subject, message });
      return res
        .status(502)
        .json(
          new ApiResponse(
            502,
            null,
            "Message bhejne me problem aayi. Seedha contact@adwallindia.com pe mail karo ya +91 9955950777 pe call karo."
          )
        );
    }

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Message bhej diya! Hum 24 hours me contact karenge."));
  } catch (err) {
    console.error("sendContactMessage:", err);
    return res.status(500).json(new ApiResponse(500, null, err.message));
  }
};

module.exports = { sendContactMessage };