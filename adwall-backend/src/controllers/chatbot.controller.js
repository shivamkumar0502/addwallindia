const { GoogleGenerativeAI } = require("@google/generative-ai");
const ApiResponse = require("../utils/apiResponse");
const Hoarding = require("../models/Hoarding.model");

// ── AdWall India ka full system prompt ──
const ADWALL_SYSTEM_PROMPT = `
Tu AdWall India ka AI Assistant hai — "Addy" naam se jaana jata hai.

AdWall India kya hai:
- India ka #1 Outdoor Advertising Marketplace
- Platform pe Hoardings, Billboards, LED Screens, Wall Painting, Bus Branding, Auto Branding, Cab Branding, Metro Ads, Railway Ads, Airport Ads, Mall Branding, Cinema Ads, Stadium Ads, Petrol Pump Branding, Event Branding available hain
- Pura India cover hota hai — 500+ cities
- 10,000+ verified ad spaces
- 5,000+ advertisers use karte hain

Platform ke 3 User Types:
1. Client (Advertiser) — Ad spaces search, book aur manage karta hai
2. Owner — Apni hoardings list karta hai, KYC verify karwata hai, bookings accept karta hai
3. Admin — Platform manage karta hai

Booking Flow:
Search → Hoarding Select → Quote Request → Owner Quote Bhejta Hai → Client Compare Karta Hai → Accept → Agreement Generate → Razorpay Payment (Escrow) → Owner Install Karta Hai → Proof Upload → Client Approve → Payment Release

Revenue Model:
- 10-12% platform commission (plan ke hisaab se)
- Featured Listing: ₹999/month
- Subscription Plans: Free (12% commission), Pro ₹999/mo (10%), Business+ ₹2499/mo (8%)

Key Features:
- Escrow Payment — Paisa safe rehta hai jab tak client approve na kare
- KYC Verification — Sabhi owners verified hote hain
- Real-time Chat — Client aur Owner direct baat kar sakte hain
- Agreement PDF — Legal document auto-generate hota hai
- GST Invoice — Tax compliant invoice
- AI Media Planner — Best locations AI suggest karta hai
- Broadcast Campaign — Ek saath multiple owners ko request
- Analytics Dashboard — Campaign performance track karo

Pricing:
- Hoardings: ₹5,000 to ₹2,00,000/month (city aur size ke hisaab se)
- LED Screens: ₹10,000 to ₹5,00,000/month
- Bus Branding: ₹3,000 to ₹50,000/month
- Metro Ads: ₹20,000 to ₹2,00,000/month
- Airport Ads: ₹50,000 to ₹10,00,000/month

Support:
- Email: support@adwall.in
- Contact form website pe available hai

Tu kaise help kar sakta hai:
1. Hoarding search aur recommendation
2. Booking process samjhana
3. Pricing guidance
4. KYC process explain karna
5. Campaign planning advice
6. Technical issues ke liye support@adwall.in refer karna
7. Owner ke liye listing process samjhana
8. Payment aur escrow explain karna
9. Features aur subscription plans explain karna

Important Rules:
- Sirf AdWall India ke baare mein baat kar
- Agar koi irrelevant question pooche to politely redirect karo
- Pricing estimates de sakte ho but exact quote ke liye platform pe dekhne bolna
- Hinglish (Hindi + English mix) mein baat karo — friendly aur helpful tone rakho
- Short aur clear answers do — 2-4 sentences maximum jab tak detail required na ho
- Emojis use karo sparingly — friendly tone ke liye
- Real booking ke liye platform pe direct karo
`;

let genAI = null;
let model = null;

const initGemini = () => {
  if (!process.env.GEMINI_API_KEY) {
    console.warn("⚠️  GEMINI_API_KEY not set — Chatbot will use fallback responses");
    return false;
  }
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash", // Fast + free tier available
      systemInstruction: ADWALL_SYSTEM_PROMPT,
    });
    console.log("✅ Gemini AI initialized");
    return true;
  } catch (err) {
    console.error("Gemini init error:", err.message);
    return false;
  }
};

// Fallback responses jab Gemini available nahi ho
const FALLBACK_RESPONSES = [
  "Namaste! Main AdWall India ka AI assistant hoon. Aapki kaise madad kar sakta hoon? 😊",
  "Hoardings search karne ke liye Search page pe jaiye ya Map View use kariye. Koi specific city ya category chahiye?",
  "Booking ke liye pehle hoarding select kariye, phir quote request kariye. Owner quote bhejega aur aap accept/reject kar sakte ho.",
  "Kisi bhi help ke liye support@adwall.in pe email kariye ya Contact page pe form fill kariye.",
  "Hmare platform pe 10,000+ verified ad spaces hain — Hoardings, LED Screens, Metro Ads, Airport Ads aur bahut kuch!",
];

let fallbackIndex = 0;

// @desc   Chat message send karo Gemini ko
// @route  POST /api/chatbot/message
// @access Public
const sendChatMessage = async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || message.trim().length === 0)
      return res.status(400).json(new ApiResponse(400, null, "Message required hai"));

    if (message.length > 500)
      return res.status(400).json(new ApiResponse(400, null, "Message too long (max 500 chars)"));

    // Gemini available nahi hai — fallback use karo
    if (!model) {
      if (!initGemini()) {
        const response = FALLBACK_RESPONSES[fallbackIndex % FALLBACK_RESPONSES.length];
        fallbackIndex++;
        return res.status(200).json(new ApiResponse(200, {
          response,
          isAI: false,
        }, "Fallback response"));
      }
    }

    // Context ke liye platform data fetch karo (agar relevant ho)
    let contextData = "";
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.includes("hoarding") || lowerMsg.includes("price") || lowerMsg.includes("city") || lowerMsg.includes("available")) {
      try {
        const recentHoardings = await Hoarding.find({ verificationStatus: "verified", isActive: true })
          .select("title location.city location.area category pricing.perMonth")
          .sort({ createdAt: -1 })
          .limit(5);

        if (recentHoardings.length > 0) {
          contextData = `\n\nCurrent available hoardings (sample):\n${recentHoardings.map(h =>
            `- ${h.title} in ${h.location?.area}, ${h.location?.city} — ₹${h.pricing?.perMonth?.toLocaleString("en-IN")}/month`
          ).join("\n")}`;
        }
      } catch {}
    }

    // Chat history format karo Gemini ke liye
    const chatHistory = history
      .slice(-10) // Last 10 messages only
      .filter(h => h.role && h.text)
      .map(h => ({
        role: h.role === "user" ? "user" : "model",
        parts: [{ text: h.text }],
      }));

    // Gemini chat start karo
    const chat = model.startChat({
      history: chatHistory,
      generationConfig: {
        maxOutputTokens: 300,
        temperature: 0.7,
        topP: 0.8,
      },
    });

    const finalMessage = contextData
      ? `${message}\n\n[Context: ${contextData}]`
      : message;

    const result = await chat.sendMessage(finalMessage);
    const responseText = result.response.text();

    return res.status(200).json(new ApiResponse(200, {
      response: responseText,
      isAI: true,
    }, "Gemini response"));

  } catch (err) {
    console.error("Chatbot error:", err.message);

    // Graceful fallback on API error
    const fallback = "Abhi thoda busy hoon! 😅 Kisi bhi help ke liye support@adwallindia.com pe contact kariye ya platform pe browse kariye.";
    return res.status(200).json(new ApiResponse(200, {
      response: fallback,
      isAI: false,
    }, "Fallback response"));
  }
};

// @desc   Quick suggestions (home page ke liye)
// @route  GET /api/chatbot/suggestions
// @access Public
const getSuggestions = async (req, res) => {
  const suggestions = [
    "Delhi mein hoarding ki price kya hai?",
    "Owner kaise register kare?",
    "Payment escrow kaise kaam karta hai?",
    "KYC verification process kya hai?",
    "Airport ads kaise book karein?",
    "Campaign broadcast kya hota hai?",
    "Subscription plans kya hain?",
    "LED screen aur hoarding mein kya fark hai?",
  ];
  return res.status(200).json(new ApiResponse(200, suggestions, "Suggestions fetched"));
};

// Initialize on module load
initGemini();

module.exports = { sendChatMessage, getSuggestions };
