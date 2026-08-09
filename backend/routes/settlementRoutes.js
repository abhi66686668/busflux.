const express = require("express");
const router = express.Router();
const OwnerTransaction = require("../models/OwnerTransaction");
const Settlement = require("../models/Settlement");
const Bus = require("../models/Bus");
const Notification = require("../models/Notification");
const Booking = require("../models/Booking");
const auth = require("../middleware/auth");

// GET /api/settlement/dashboard
router.get("/dashboard", async (req, res) => {
  try {
    const pendingTransactions = await OwnerTransaction.find({ status: "Pending Settlement" })
      .populate("busId", "busName busNumber")
      .populate({
        path: "bookingId",
        select: "scannedBy",
        populate: {
          path: "scannedBy",
          select: "bankName accountNumber ifscCode upiId name"
        }
      });

    let totalRevenue = 0;
    let totalCommission = 0;
    let totalPayable = 0;

    const ownerStatsMap = {};

    pendingTransactions.forEach(tx => {
      totalRevenue += tx.ticketAmount;
      totalCommission += tx.commissionAmount;
      totalPayable += tx.ownerAmount;

      const busIdStr = tx.busId._id.toString();
      if (!ownerStatsMap[busIdStr]) {
        let bankDetails = null;
        let conductorId = null;
        if (tx.bookingId && tx.bookingId.scannedBy) {
          bankDetails = tx.bookingId.scannedBy;
          conductorId = tx.bookingId.scannedBy._id;
        }

        ownerStatsMap[busIdStr] = {
          busId: busIdStr,
          ownerName: tx.busId.busName,
          busNumber: tx.busId.busNumber,
          bankDetails: bankDetails,
          conductorId: conductorId,
          ticketsSold: 0,
          totalSales: 0,
          commission: 0,
          payableAmount: 0,
          transactionIds: []
        };
      } else if (!ownerStatsMap[busIdStr].bankDetails && tx.bookingId && tx.bookingId.scannedBy) {
        ownerStatsMap[busIdStr].bankDetails = tx.bookingId.scannedBy;
        ownerStatsMap[busIdStr].conductorId = tx.bookingId.scannedBy._id;
      }
      
      ownerStatsMap[busIdStr].ticketsSold += 1;
      ownerStatsMap[busIdStr].totalSales += tx.ticketAmount;
      ownerStatsMap[busIdStr].commission += tx.commissionAmount;
      ownerStatsMap[busIdStr].payableAmount += tx.ownerAmount;
    });

    const ownerStats = Object.values(ownerStatsMap);

    res.json({
      success: true,
      data: {
        totalRevenue,
        totalCommission,
        totalPayable,
        ownerStats
      }
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /api/settlement/generate
router.post("/generate", async (req, res) => {
  try {
    const pendingTransactions = await OwnerTransaction.find({ status: "Pending Settlement" });
    if (pendingTransactions.length === 0) {
      return res.json({ success: false, message: "No pending settlements." });
    }

    const monthStr = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

    const ownerStatsMap = {};
    pendingTransactions.forEach(tx => {
      const busIdStr = tx.busId.toString();
      if (!ownerStatsMap[busIdStr]) {
        ownerStatsMap[busIdStr] = {
          busId: busIdStr,
          totalSales: 0,
          commission: 0,
          payableAmount: 0,
          transactionIds: []
        };
      }
      ownerStatsMap[busIdStr].totalSales += tx.ticketAmount;
      ownerStatsMap[busIdStr].commission += tx.commissionAmount;
      ownerStatsMap[busIdStr].payableAmount += tx.ownerAmount;
      ownerStatsMap[busIdStr].transactionIds.push(tx._id);
    });

    const settlementsToInsert = [];
    let allTxIds = [];
    const io = req.app.get('io');

    for (let key in ownerStatsMap) {
      const stat = ownerStatsMap[key];
      settlementsToInsert.push({
        busId: stat.busId,
        month: monthStr,
        totalSales: stat.totalSales,
        commission: stat.commission,
        payableAmount: stat.payableAmount,
        paymentStatus: 'Paid'
      });
      allTxIds = allTxIds.concat(stat.transactionIds);
      
      const bus = await Bus.findById(stat.busId);
      const busName = bus ? bus.busName : "Unknown Bus";
      
      const notifMsg = `Settlement generated for ${busName}. Amount: ₹${stat.payableAmount} paid.`;
      const notifData = {
        title: "Settlement Paid",
        message: notifMsg,
        type: "success",
        targetRole: "conductor"
      };
      
      await Notification.create(notifData);
      
      if (io) {
        io.emit('new_notification', notifData);
      }
    }

    await Settlement.insertMany(settlementsToInsert);
    await OwnerTransaction.updateMany(
      { _id: { $in: allTxIds } },
      { $set: { status: "Settled" } }
    );

    res.json({ success: true, message: "Settlement generated and all owners marked as paid." });
  } catch (error) {
    console.error("Settlement generation error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /api/settlement/generate/:busId
router.post("/generate/:busId", async (req, res) => {
  try {
    const { busId } = req.params;
    const pendingTransactions = await OwnerTransaction.find({ busId, status: "Pending Settlement" });
    
    if (pendingTransactions.length === 0) {
      return res.json({ success: false, message: "No pending settlements for this bus." });
    }

    const monthStr = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

    let totalSales = 0;
    let commission = 0;
    let payableAmount = 0;
    const transactionIds = [];

    pendingTransactions.forEach(tx => {
      totalSales += tx.ticketAmount;
      commission += tx.commissionAmount;
      payableAmount += tx.ownerAmount;
      transactionIds.push(tx._id);
    });

    const io = req.app.get('io');
    const bus = await Bus.findById(busId);
    const busName = bus ? bus.busName : "Unknown Bus";
    
    await Settlement.create({
      busId,
      month: monthStr,
      totalSales,
      commission,
      payableAmount,
      paymentStatus: 'Paid'
    });

    await OwnerTransaction.updateMany(
      { _id: { $in: transactionIds } },
      { $set: { status: 'Settled' } }
    );
    
    const notifMsg = `Settlement generated for ${busName}. Amount: ₹${payableAmount} paid.`;
    const notifData = {
      title: "Settlement Paid",
      message: notifMsg,
      type: "success",
      targetRole: "conductor"
    };
    
    await Notification.create(notifData);
    
    if (io) {
      io.emit('new_notification', notifData);
    }

    res.json({ success: true, message: `Settlement generated for ${busName}.` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/settlement/transactions/:busId
router.get("/transactions/:busId", async (req, res) => {
  try {
    const transactions = await OwnerTransaction.find({
      busId: req.params.busId,
      status: "Pending Settlement"
    })
    .sort({ bookingDate: -1 })
    .populate({
      path: "bookingId",
      populate: [
        { path: "userId", select: "name email phone" },
        { path: "scannedBy", select: "name email" }
      ]
    });
    res.json({ success: true, transactions });
  } catch (error) {
    console.error("Fetch transactions error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/settlement/history
router.get("/history", auth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === 'conductor') {
      const bookings = await Booking.find({ scannedBy: req.user.id }).select('busId');
      const busIds = [...new Set(bookings.map(b => b.busId.toString()))];
      query = { busId: { $in: busIds } };
    }
    const settlements = await Settlement.find(query).populate("busId", "busName busNumber").sort({ createdAt: -1 });
    res.json({ success: true, data: settlements });
  } catch (error) {
    console.error("Settlement history error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
