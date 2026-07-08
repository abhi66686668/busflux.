const express = require("express");
const router = express.Router();
const Setting = require("../models/Setting");
const upload = require("../middleware/upload");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Admin auth middleware
async function adminAuth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.role !== "admin") return res.status(403).json({ message: "Forbidden" });
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// GET all settings (public)
router.get("/", async (req, res) => {
  try {
    const settings = await Setting.find({});
    const settingsMap = {};
    settings.forEach(s => settingsMap[s.key] = s.value);
    res.status(200).json(settingsMap);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET specific setting (public)
router.get("/:key", async (req, res) => {
  try {
    const setting = await Setting.findOne({ key: req.params.key });
    if (!setting) return res.status(404).json({ message: "Setting not found" });
    res.status(200).json({ value: setting.value });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE payment QR Code (Admin only)
router.put("/payment-qr", adminAuth, upload.single("qrCode"), async (req, res) => {
  try {
    let finalValue = "";
    
    if (req.file) {
      finalValue = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    } else if (req.body.qrUrl) {
      finalValue = req.body.qrUrl;
    } else {
      return res.status(400).json({ message: "No QR code image or URL provided" });
    }
    
    let setting = await Setting.findOne({ key: "paymentQRCode" });
    if (setting) {
      setting.value = finalValue;
      await setting.save();
    } else {
      setting = await Setting.create({ key: "paymentQRCode", value: finalValue });
    }
    
    res.status(200).json({ message: "Payment QR Code updated successfully", value: setting.value });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// UPDATE commission rate (Admin only)
router.put("/commission-rate", adminAuth, async (req, res) => {
  try {
    const { rate } = req.body;
    if (rate === undefined || isNaN(rate) || rate < 0 || rate > 100) {
      return res.status(400).json({ message: "Invalid commission rate" });
    }
    let setting = await Setting.findOne({ key: "commissionPercentage" });
    if (setting) {
      setting.value = rate.toString();
      await setting.save();
    } else {
      setting = await Setting.create({ key: "commissionPercentage", value: rate.toString() });
    }

    // Retroactively update all Pending Settlement transactions
    const OwnerTransaction = require("../models/OwnerTransaction");
    const pendingTxs = await OwnerTransaction.find({ status: "Pending Settlement" });
    for (let tx of pendingTxs) {
      const comm = Math.round(tx.ticketAmount * (rate / 100));
      tx.commissionAmount = comm;
      tx.ownerAmount = tx.ticketAmount - comm;
      await tx.save();
    }

    res.status(200).json({ message: "Commission rate updated successfully", value: setting.value });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
