// Render free tier sleep prevent — sirf production mein
const keepAlive = () => {
  if (!process.env.RENDER_EXTERNAL_URL) {
    console.log("⏭️  Keepalive skipped (not on Render)");
    return;
  }

  const url = `${process.env.RENDER_EXTERNAL_URL}/api/health`;

  // Har 13 minute pe ek baar (15 min sleep se pehle)
  // Rate limit 300 req/15min hai toh 1 req/13min = safe
  setInterval(async () => {
    try {
      const res = await fetch(url, { method: "GET" });
      if (res.ok) {
        console.log(`💓 Keepalive OK at ${new Date().toLocaleTimeString("en-IN")}`);
      }
    } catch (err) {
      console.log(`⚠️  Keepalive failed: ${err.message}`);
    }
  }, 13 * 60 * 1000); // 13 minutes

  console.log(`💓 Keepalive started → ${url}`);
};

module.exports = keepAlive;
