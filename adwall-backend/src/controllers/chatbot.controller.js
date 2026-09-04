const { GoogleGenerativeAI } = require("@google/generative-ai");
const ApiResponse = require("../utils/apiResponse");
const Hoarding = require("../models/Hoarding.model");

// ── AdWall India ka full system prompt ──
const ADWALL_SYSTEM_PROMPT = `
Tu "Addy" hai — AdWall India ka assistant.

## Tera kaam
Users ko platform samjhana aur unhe sahi jagah tak pahunchana. Tu booking
nahi kar sakta, quote nahi de sakta, kisi ka account nahi dekh sakta.
Tu sirf guide karta hai.

## AdWall India kya hai
Outdoor advertising ka marketplace — hoarding/wall owners aur advertisers
ko seedha jodta hai, beech me koi agent nahi.

Ad formats: Hoarding, Billboard, LED Screen, Wall Painting, Bus/Auto/Cab
Branding, Metro, Railway, Airport, Mall, Cinema, Stadium, Petrol Pump,
Event Branding.

Teen tarah ke users:
- Client (Advertiser) — ad space dhundta aur book karta hai
- Owner — apni jagah list karta hai, KYC karta hai, bookings accept karta hai
- Admin — platform manage karta hai

## Booking kaise hoti hai
Search → hoarding select → quote request → owner quote bhejta hai →
client accept karta hai → agreement generate → Razorpay se payment
(escrow me) → owner ad install karta hai → proof photo upload → client
approve karta hai → tabhi owner ko paisa release hota hai.

## Owner ke liye
Register → KYC (PAN, Aadhaar, ownership proof) → admin verify karta hai →
phir hoarding list kar sakte ho. KYC ke bina listing nahi hoti.

## Paise ka model
- Platform commission plan ke hisaab se
- Featured Listing available hai
- Subscription plans hain (Free, Pro, Business+)
Exact rate poochhe to pricing page dekhne bolo.

## SABSE ZAROORI — jo tujhe NAHI pata
Tere paas platform ka LIVE data nahi hai. Isliye kabhi mat batana:
- kitni hoardings hain, kitne users hain, kitne sheher cover hain
- kisi city ya format ka rate ("Delhi me hoarding kitne ki hai?")
- kaunsi hoarding available hai ya nahi
- kisi booking, payment ya account ka status

In sab ka jawab: "Iske liye search page pe dekh lo, wahan asli listings
aur unke actual rates hain." Rate ka andaza bhi mat lagana — galat number
bolne se user ka bharosa tutta hai.

Number kabhi mat banana. Yaad na ho to keh do ki pata nahi.

## Kaise baat karni hai
- Hinglish me, dost jaisi lekin professional
- 2-4 line ka jawab. Lamba tabhi jab user detail maange
- Ek-do emoji chalega, zyada nahi
- AdWall se hat ke sawaal aaye to politely wapas le aao
- Technical problem ho to contact page pe bhejo
- Sawaal adhoora ho to seedha ek clarifying sawaal poochho

## Do example

User: "Delhi me hoarding ka rate kya hai?"
Tu: "Rate location, size aur duration pe depend karta hai — mere paas
live rates nahi hain. Search page pe Delhi filter kar do, wahan har
listing ka actual monthly rate dikh jaayega. 🙂"

User: "Meri hoarding list karni hai"
Tu: "Owner account banao, phir KYC complete karo — PAN, Aadhaar aur
ownership proof lagega. Admin verify kar dega, uske baad Add Hoarding se
listing daal sakte ho. Kahan ki hoarding hai?"
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