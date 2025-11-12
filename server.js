const express = require("express");
const fs = require("fs");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(express.json());

// فتح الـ CORS لكل المواقع (ضروري جداً لاستقبال الطلب من Netlify)
app.use(cors({ origin: "*", credentials: true }));

const DATA_PATH = "./police_apply_status.json";
// رابط ويبهوك ديسكورد كما أرسلته
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1437226777134239774/8vQbtfXFmsdh6uDSj3x1m-QD-A-mCestbC7677cEjyksQg67CPjN8Rx6eUDJnoUmn-PU";

// endpoint لجلب حالة التقديم
app.get("/api/police-open", (req, res) => {
  fs.readFile(DATA_PATH, "utf8", (err, data) => {
    if (err) return res.json({ open: false });
    res.json(JSON.parse(data));
  });
});

// endpoint لتغيير حالة التقديم (فتح/قفل)
app.post("/api/police-open", (req, res) => {
  const open = !!req.body.open;
  fs.writeFile(DATA_PATH, JSON.stringify({ open }), err => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, open });
  });
});

// endpoint إرسال تقديم الشرطة لديسكورد
app.post("/api/submit-police", async (req, res) => {
  const { answers } = req.body;
  const formatted = (answers || [])
    .map((ans, i) => `**س${i + 1}:** ${ans}`)
    .join("\n\n");
  try {
    await axios.post(DISCORD_WEBHOOK_URL, {
      username: "Police Application",
      content: `تقديم جديد للشرطة:\n${formatted}`,
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

// يفضل تغيير البورت حسب منصة الاستضافة
const PORT = process.env.PORT || 3310;
app.listen(PORT, () => {
  console.log(`Backend API running on port ${PORT}`);
});
