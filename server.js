const express = require("express");
const fs = require("fs");
const cors = require("cors");
const axios = require("axios");
const rateLimit = require("express-rate-limit");
const { Client, GatewayIntentBits } = require("discord.js");

const BOT_TOKEN = "توكن_البوت_الفعلي";
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
client.login(BOT_TOKEN);

// ملف لتخزين الرومات المستهدفة لكل وظيفة
const ROOMS_PATH = "./rooms.json";
let rooms = { police: null, ambulance: null, justice: null };
if (fs.existsSync(ROOMS_PATH)) {
  rooms = JSON.parse(fs.readFileSync(ROOMS_PATH, "utf8"));
}
function saveRooms() {
  fs.writeFileSync(ROOMS_PATH, JSON.stringify(rooms));
}

const app = express();
app.use(express.json());

app.use(cors({ origin: "*", credentials: true }));

app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
}));

// ملفات حالة التقديم لكل وظيفة
const POLICE_DATA_PATH = "./police_apply_status.json";
const AMBULANCE_DATA_PATH = "./ambulance_apply_status.json";
const JUSTICE_DATA_PATH = "./justice_apply_status.json";

// ---- مسارات فتح/قفل الحالة ----
app.get("/api/police-open", (req, res) => {
    fs.readFile(POLICE_DATA_PATH, "utf8", (err, data) => {
        if (err) return res.json({ open: false });
        res.json(JSON.parse(data));
    });
});
app.post("/api/police-open", (req, res) => {
    const open = !!req.body.open;
    fs.writeFile(POLICE_DATA_PATH, JSON.stringify({ open }), err => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, open });
    });
});
// إسعاف
app.get("/api/ambulance-open", (req, res) => {
    fs.readFile(AMBULANCE_DATA_PATH, "utf8", (err, data) => {
        if (err) return res.json({ open: false });
        res.json(JSON.parse(data));
    });
});
app.post("/api/ambulance-open", (req, res) => {
    const open = !!req.body.open;
    fs.writeFile(AMBULANCE_DATA_PATH, JSON.stringify({ open }), err => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, open });
    });
});
// عدل
app.get("/api/justice-open", (req, res) => {
    fs.readFile(JUSTICE_DATA_PATH, "utf8", (err, data) => {
        if (err) return res.json({ open: false });
        res.json(JSON.parse(data));
    });
});
app.post("/api/justice-open", (req, res) => {
    const open = !!req.body.open;
    fs.writeFile(JUSTICE_DATA_PATH, JSON.stringify({ open }), err => {
        if (err) return res.status(500).json({ success: false });
        res.json({ success: true, open });
    });
});

// ---- تعيين روم كل وظيفة ----
app.post("/api/set-room-police", (req, res) => {
    const { channelId } = req.body;
    rooms.police = channelId;
    saveRooms();
    res.json({ success: true });
});
app.post("/api/set-room-ambulance", (req, res) => {
    const { channelId } = req.body;
    rooms.ambulance = channelId;
    saveRooms();
    res.json({ success: true });
});
app.post("/api/set-room-justice", (req, res) => {
    const { channelId } = req.body;
    rooms.justice = channelId;
    saveRooms();
    res.json({ success: true });
});

// ---- إرسال التقديم لكل وظيفة ----
app.post("/api/submit-police", async (req, res) => {
    const { answers } = req.body;
    const formatted = (answers || [])
        .map((ans, i) => `**س${i + 1}:** ${ans}`)
        .join("\n\n");
    try {
        if (!rooms.police) throw new Error("Police room not set");
        await client.channels.cache.get(rooms.police).send({
            content: `استبيان الشرطة:\n${formatted}`,
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});
app.post("/api/submit-ambulance", async (req, res) => {
    const { answers } = req.body;
    const formatted = (answers || [])
        .map((ans, i) => `**س${i + 1}:** ${ans}`)
        .join("\n\n");
    try {
        if (!rooms.ambulance) throw new Error("Ambulance room not set");
        await client.channels.cache.get(rooms.ambulance).send({
            content: `استبيان الإسعاف:\n${formatted}`,
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});
app.post("/api/submit-justice", async (req, res) => {
    const { answers } = req.body;
    const formatted = (answers || [])
        .map((ans, i) => `**س${i + 1}:** ${ans}`)
        .join("\n\n");
    try {
        if (!rooms.justice) throw new Error("Justice room not set");
        await client.channels.cache.get(rooms.justice).send({
            content: `استبيان العدل:\n${formatted}`,
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false });
    }
});

// الاستماع على جميع الشبكات
const PORT = process.env.PORT || 3310;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Backend API running on port ${PORT}`);
});
