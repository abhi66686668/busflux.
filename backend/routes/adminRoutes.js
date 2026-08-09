const express = require("express");
const router  = express.Router();
const User    = require("../models/User");
const Bus     = require("../models/Bus");
const Booking = require("../models/Booking");
const OwnerTransaction = require("../models/OwnerTransaction");
const SupportTicket = require("../models/SupportTicket");
const jwt     = require("jsonwebtoken");
const bcrypt  = require("bcryptjs");

// ── Admin Auth Middleware ──
function adminAuth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// ================= ADMIN LOGIN =================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email, role: "admin" });
    if (!user) return res.status(400).json({ message: "Admin not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.status(200).json({ message: "Admin login successful", token, name: user.name });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ================= DASHBOARD STATS =================
router.get("/stats", adminAuth, async (req, res) => {
  try {
    const totalUsers      = await User.countDocuments({ role: "user" });
    const totalBuses      = await Bus.countDocuments();
    const totalBookings   = await Booking.countDocuments({ status: { $ne: "failed" } });
    const activeBuses     = await Bus.countDocuments({ isActive: true });
    const totalConductors = await User.countDocuments({ role: "conductor" });

    // Revenue
    const bookings = await Booking.find({ status: { $ne: "failed" } });
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    
    // Total Admin Profit (Commission)
    const transactions = await OwnerTransaction.find();
    const totalAdminProfit = transactions.reduce((sum, tx) => sum + (tx.commissionAmount || 0), 0);

    // Users by age group
    const ageGroups = await User.aggregate([
      { $match: { role: "user", ageGroup: { $ne: "" } } },
      { $group: { _id: "$ageGroup", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.status(200).json({ totalUsers, totalBuses, totalBookings, activeBuses, totalRevenue, totalAdminProfit, ageGroups, totalConductors });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ================= GET PLATFORM PROFIT HISTORY =================
router.get("/profit-history", adminAuth, async (req, res) => {
  try {
    const history = await OwnerTransaction.find({ status: "Settled" })
      .populate('busId')
      .sort({ updatedAt: -1 });
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ================= GET ALL USERS (grouped by age) =================
router.get("/users", adminAuth, async (req, res) => {
  try {
    const users = await User.find({ role: "user" })
      .select("-password -otp -resetOtp")
      .sort({ ageGroup: 1, createdAt: -1 });

    // Group by ageGroup
    const grouped = {};
    users.forEach(u => {
      const group = u.ageGroup || "Unknown";
      if (!grouped[group]) grouped[group] = [];
      grouped[group].push(u);
    });

    res.status(200).json({ users, grouped });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ================= GET SINGLE USER =================
router.get("/users/:id", adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password -otp -resetOtp");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ================= DELETE USER =================
router.delete("/users/:id", adminAuth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ================= GET ALL BOOKINGS =================
router.get("/bookings", adminAuth, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate("userId", "name email ageGroup userPhoto")
      .populate("busId", "busName busNumber from to")
      .populate("scannedBy", "name email role userPhoto")
      .sort({ createdAt: -1 });
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const Transaction = require("../models/Transaction");

// ================= CREATE ADMIN (setup route) =================
router.post("/create", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const admin = await User.create({ name, email, password: hashed, role: "admin", isVerified: true });
    res.status(201).json({ message: "Admin created", admin: { name: admin.name, email: admin.email } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ================= GET ALL TRANSACTIONS =================
router.get("/transactions", adminAuth, async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate("userId", "name email ageGroup")
      .sort({ createdAt: -1 });
    res.status(200).json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const upload = require("../middleware/upload");

// ================= GET ALL CONDUCTORS =================
router.get("/conductors", adminAuth, async (req, res) => {
  try {
    const conductors = await User.find({ role: "conductor" }).sort({ createdAt: -1 });
    res.status(200).json(conductors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ================= ADD CONDUCTOR =================
router.post("/conductors/add", adminAuth, upload.single("userPhoto"), async (req, res) => {
  try {
    const { name, email, password, phone, experience } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Conductor email already exists" });

    const hashed = await bcrypt.hash(password, 10);
    const data = {
      name,
      email,
      password: hashed,
      phone,
      experience: experience ? parseInt(experience) : 0,
      role: "conductor",
      isVerified: true
    };
    if (req.file) {
      data.userPhoto = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    const conductor = await User.create(data);
    res.status(201).json({ message: "Conductor created successfully", conductor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ================= DELETE CONDUCTOR =================
router.delete("/conductors/:id", adminAuth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Conductor deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ================= EDIT CONDUCTOR =================
router.put("/conductors/:id", adminAuth, upload.single("userPhoto"), async (req, res) => {
  try {
    const { name, email, password, phone, experience } = req.body;
    const conductor = await User.findById(req.params.id);
    if (!conductor) return res.status(404).json({ message: "Conductor not found" });

    // If email is changing, check if it's already used
    if (email && email.toLowerCase() !== conductor.email.toLowerCase()) {
      const exists = await User.findOne({ email: email.trim().toLowerCase() });
      if (exists) return res.status(400).json({ message: "Email already exists" });
      conductor.email = email.trim().toLowerCase();
    }

    if (name) conductor.name = name.trim();
    if (phone !== undefined) conductor.phone = phone.trim();
    if (experience !== undefined) conductor.experience = experience ? parseInt(experience) : 0;

    if (password) {
      conductor.password = await bcrypt.hash(password, 10);
    }

    if (req.file) {
      conductor.userPhoto = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    }

    await conductor.save();
    res.status(200).json({ message: "Conductor updated successfully", conductor });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

const Notification = require("../models/Notification");

// ================= GET NOTIFICATIONS =================
router.get("/notifications", adminAuth, async (req, res) => {
  try {
    const notifications = await Notification.find({ targetRole: "admin" })
      .sort({ createdAt: -1 })
      .limit(50);
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ================= MARK NOTIFICATION AS READ =================
router.put("/notifications/read", adminAuth, async (req, res) => {
  try {
    const { id } = req.body;
    if (id === 'all') {
      await Notification.updateMany({ targetRole: "admin", read: false }, { read: true });
    } else if (id) {
      await Notification.findByIdAndUpdate(id, { read: true });
    }
    res.status(200).json({ message: "Notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ================= REMIND CONDUCTOR TO ADD BANK DETAILS =================
router.post("/remind-bank-details/:conductorId", adminAuth, async (req, res) => {
  try {
    const { conductorId } = req.params;
    
    const notifData = {
      title: "Bank Details Missing",
      message: "Please update your Payout/Bank Details in your Profile immediately so your settlement can be processed.",
      type: "warning",
      targetRole: "conductor",
      targetUser: conductorId
    };
    
    await Notification.create(notifData);
    
    const io = req.app.get('io');
    if (io) {
      io.emit('new_notification', notifData);
    }
    
    res.status(200).json({ success: true, message: "Reminder sent to conductor." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ================= SUPPORT TICKETS =================

// Public: Submit a support ticket (optionally auth)
router.post("/support", async (req, res) => {
  try {
    const { subject, details, name, email } = req.body;
    if (!subject || !details) return res.status(400).json({ message: "Subject and details are required" });

    // Try to identify logged-in user via optional auth header
    let userId = null;
    let userName = name || "Guest";
    let userEmail = email || "";
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("name email");
        if (user) { userId = user._id; userName = user.name; userEmail = user.email; }
      } catch (_) {}
    }

    const ticket = await SupportTicket.create({ userId, name: userName, email: userEmail, subject, details });

    const io = req.app.get('io');
    if (io) {
      io.emit('new_admin_notification', { message: "New support ticket: " + subject, type: "info" });
      io.emit('admin_data_updated');
    }

    res.status(201).json({ success: true, message: "Support ticket submitted successfully!", ticket });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Get all support tickets
router.get("/support", adminAuth, async (req, res) => {
  try {
    const tickets = await SupportTicket.find()
      .populate("userId", "name email userPhoto")
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, tickets });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Update ticket status
router.put("/support/:id/status", adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    res.status(200).json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Reply to a ticket
router.put("/support/:id/reply", adminAuth, async (req, res) => {
  try {
    const { adminReply } = req.body;
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { adminReply, status: "resolved" },
      { new: true }
    );
    if (!ticket) return res.status(404).json({ message: "Ticket not found" });
    res.status(200).json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Delete a ticket
router.delete("/support/:id", adminAuth, async (req, res) => {
  try {
    await SupportTicket.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Ticket deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
