const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const User = require("../models/User");
const Bus = require("../models/Bus");
const Notification = require("../models/Notification");
const OwnerTransaction = require("../models/OwnerTransaction");
const Setting = require("../models/Setting");
const auth = require("../middleware/auth");

// Helper: get age-group price
function getAgeGroupPrice(bus, ageGroup) {
  const map = {
    "Children": bus.childPrice,
    "Youth": bus.youthPrice,
    "Young Adults": bus.youngAdultPrice,
    "Middle Age": bus.middleAgePrice,
    "Elderly": bus.elderlyPrice,
    "Seniors": bus.seniorPrice,
  };
  const p = map[ageGroup];
  return p && p > 0 ? p : bus.price;
}

function getStopRatio(bus, boardingPoint, droppingPoint) {
  const allStops = [bus.from, ...(bus.stops || []), bus.to];
  const total = allStops.length - 1;
  if (total === 0) return 1;
  const bIdx = allStops.findIndex(s => s.toLowerCase() === boardingPoint.toLowerCase());
  const dIdx = allStops.findIndex(s => s.toLowerCase() === droppingPoint.toLowerCase());
  if (bIdx === -1 || dIdx === -1 || dIdx <= bIdx) return 1;
  return (dIdx - bIdx) / total;
}

// POST /scan
router.post("/scan", auth, async (req, res) => {
  try {
    if (req.user.role !== "conductor") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { ticketId } = req.body;
    if (!ticketId) return res.status(400).json({ message: "Ticket ID is required" });

    let queryStr = ticketId.toString().trim();

    // 1. Try parsing JSON if input is wrapped in JSON format
    try {
      const parsed = JSON.parse(queryStr);
      if (parsed.ticketId) {
        queryStr = parsed.ticketId.trim();
      } else if (parsed.bookingId) {
        queryStr = parsed.bookingId.trim();
      } else if (parsed.id) {
        queryStr = parsed.id.trim();
      }
    } catch (e) {
      // Not JSON, continue
    }

    // 2. Extract ticket ID from URLs if passenger scanned a URL QR code
    try {
      if (queryStr.toLowerCase().includes("http://") || queryStr.toLowerCase().includes("https://")) {
        const urlObj = new URL(queryStr);
        const urlParam = urlObj.searchParams.get("ticketId") || urlObj.searchParams.get("bookingId") || urlObj.searchParams.get("id");
        if (urlParam) {
          queryStr = urlParam.trim();
        }
      }
    } catch (e) {
      // Ignore URL errors
    }

    // Finds booking
    const bookings = await Booking.find()
      .populate("userId", "name email phone userPhoto")
      .populate("busId", "busName from to");
      
    const booking = bookings.find(b => {
      const bIdStr = b._id.toString().toUpperCase();
      const qStr = queryStr.toUpperCase();
      return bIdStr === qStr || bIdStr.endsWith(qStr);
    });

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status === "scanned") {
      return res.status(400).json({ message: "Ticket already scanned" });
    }

    booking.status = "scanned";
    booking.scannedBy = req.user.id;
    booking.scannedAt = Date.now();
    await booking.save();

    // Notify admin
    try {
      const notif = await Notification.create({
        title: "Ticket Scanned",
        message: `Ticket for ${booking.boardingPoint} to ${booking.droppingPoint} was scanned by conductor.`,
        type: "success",
        targetRole: "admin"
      });
      const io = req.app.get('io');
      if (io) {
        io.emit('new_admin_notification', notif);
        io.emit('admin_data_updated');
      }
    } catch(err) { console.error(err); }

    return res.status(200).json({
      message: "Ticket scanned successfully",
      passenger: booking.userId,
      booking: booking
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /settlement-dues
router.get("/settlement-dues", auth, async (req, res) => {
  try {
    if (req.user.role !== "conductor") {
      return res.status(403).json({ message: "Access denied" });
    }

    // Find all bookings scanned by this conductor
    const bookings = await Booking.find({ scannedBy: req.user.id });
    const bookingIds = bookings.map(b => b._id);

    // Find pending settlement transactions for these bookings
    const pendingTransactions = await OwnerTransaction.find({
      bookingId: { $in: bookingIds },
      status: "Pending Settlement"
    });

    let totalCollected = 0;
    let commissionDue = 0;
    let payableToOwner = 0;

    pendingTransactions.forEach(tx => {
      totalCollected += tx.ticketAmount;
      commissionDue += tx.commissionAmount;
      payableToOwner += tx.ownerAmount;
    });

    res.status(200).json({ success: true, totalCollected, commissionDue, payableToOwner });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /search-passenger
router.get("/search-passenger", auth, async (req, res) => {
  try {
    if (req.user.role !== "conductor") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { email } = req.query;
    if (!email) return res.status(400).json({ message: "Email or identifier query param is required" });

    let queryStr = email.trim();

    // 1. Try parsing JSON if input is wrapped in JSON format
    try {
      const parsed = JSON.parse(queryStr);
      if (parsed.email) {
        queryStr = parsed.email.trim();
      } else if (parsed.userId) {
        queryStr = parsed.userId.trim();
      } else if (parsed.id) {
        queryStr = parsed.id.trim();
      }
    } catch (e) {
      // Not a JSON string, proceed
    }

    // 2. Strip "mailto:" or "mailto://" prefix commonly added by QR generators for email addresses
    if (queryStr.toLowerCase().startsWith("mailto:")) {
      queryStr = queryStr.substring(7).trim();
    } else if (queryStr.toLowerCase().startsWith("mailto://")) {
      queryStr = queryStr.substring(9).trim();
    }

    // 3. Extract email or ID from URLs if passenger scanned a URL QR code
    try {
      if (queryStr.toLowerCase().includes("http://") || queryStr.toLowerCase().includes("https://")) {
        const urlObj = new URL(queryStr);
        const urlParam = urlObj.searchParams.get("email") || urlObj.searchParams.get("id") || urlObj.searchParams.get("userId");
        if (urlParam) {
          queryStr = urlParam.trim();
        }
      }
    } catch (e) {
      // Ignore URL parsing errors
    }

    let passenger = null;

    // 4. Try resolving as a 24-character hex MongoDB ObjectId (can be User ID or Booking ID)
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(queryStr);
    if (isObjectId) {
      // A. Check if it's a User ID
      passenger = await User.findOne({ _id: queryStr }).select("name email phone userPhoto balance ageGroup age monthlyPassBalance monthlyPassExpiry");
      
      // B. Check if it's a Booking ID
      if (!passenger) {
        const booking = await Booking.findById(queryStr).populate("userId", "name email phone userPhoto balance ageGroup age monthlyPassBalance monthlyPassExpiry");
        if (booking && booking.userId) {
          passenger = booking.userId;
        }
      }
    }

    // 5. Try resolving as an 8-character Ticket ID suffix (case-insensitive search in bookings)
    const isTicketSuffix = /^[0-9a-zA-Z]{8}$/.test(queryStr);
    if (!passenger && isTicketSuffix) {
      const bookings = await Booking.find().populate("userId", "name email phone userPhoto balance ageGroup age monthlyPassBalance monthlyPassExpiry");
      const booking = bookings.find(b => b._id.toString().toUpperCase().endsWith(queryStr.toUpperCase()));
      if (booking && booking.userId) {
        passenger = booking.userId;
      }
    }

    // 6. Fallback: Search by clean lowercase email address
    if (!passenger) {
      const cleanEmail = queryStr.toLowerCase();
      passenger = await User.findOne({ email: cleanEmail }).select("name email phone userPhoto balance ageGroup age monthlyPassBalance monthlyPassExpiry");
    }

    if (!passenger) {
      return res.status(404).json({ message: "Passenger profile not found in system." });
    }

    return res.status(200).json(passenger);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /deduct-pass
router.post("/deduct-pass", auth, async (req, res) => {
  try {
    if (req.user.role !== "conductor") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { email, busId, boardingPoint, droppingPoint, walletType } = req.body;
    if (!email || !busId || !boardingPoint || !droppingPoint) {
      return res.status(400).json({ message: "All fields (email, busId, boardingPoint, droppingPoint) are required" });
    }

    // 1. Find passenger
    const cleanEmail = email.trim().toLowerCase();
    const passenger = await User.findOne({ email: cleanEmail });
    if (!passenger) {
      return res.status(404).json({ message: "Passenger user not found" });
    }

    // 2. Find bus
    const bus = await Bus.findById(busId);
    if (!bus) {
      return res.status(404).json({ message: "Bus not found" });
    }

    // 3. Calculate price
    const allStops = [bus.from, ...(bus.stops || []), bus.to];
    const bIdx = allStops.findIndex(s => s.toLowerCase() === boardingPoint.toLowerCase());
    const dIdx = allStops.findIndex(s => s.toLowerCase() === droppingPoint.toLowerCase());
    
    let segments = 0;
    if (bIdx !== -1 && dIdx !== -1 && dIdx > bIdx) {
      segments = dIdx - bIdx;
    }
    const totalPrice = segments > 0 ? Math.min(segments * 5, 25) : 0;

    if (totalPrice <= 0) {
      return res.status(400).json({ message: "Deduction failed: Fare cannot be ₹0. Please select a valid route/stops." });
    }

    // 4. Check balance based on walletType
    let passUsed = false;
    let hasBalance = false;

    if (walletType === "monthly") {
      if (passenger.monthlyPassExpiry && passenger.monthlyPassExpiry > new Date() && (passenger.monthlyPassBalance || 0) >= totalPrice) {
        passUsed = true;
        hasBalance = true;
      }
    } else {
      // Default to BusFlux wallet
      if ((passenger.balance || 0) >= totalPrice) {
        passUsed = false;
        hasBalance = true;
      }
    }

    if (!hasBalance) {
      // Transaction failed - but we STILL store it in the database as a failed booking/transaction
      const failedBooking = await Booking.create({
        userId: passenger._id,
        busId: bus._id,
        seatsBooked: 1,
        totalPrice: totalPrice,
        boardingPoint: boardingPoint,
        droppingPoint: droppingPoint,
        paymentMethod: "wallet",
        paymentStatus: "failed",
        status: "failed",
        scannedBy: req.user.id,
        scannedAt: Date.now()
      });

      // Notify admin
      try {
        const notif = await Notification.create({
          title: "Failed Spot Booking",
          message: `${passenger.name} had insufficient balance for a spot booking of ₹${totalPrice}.`,
          type: "warning",
          targetRole: "admin"
        });
        const io = req.app.get('io');
        if (io) {
          io.emit('new_admin_notification', notif);
          io.emit('admin_data_updated');
        }
      } catch(err) { console.error(err); }

      return res.status(400).json({
        message: "Transaction failed: Insufficient balance",
        insufficientBalance: true,
        requiredAmount: totalPrice,
        currentBalance: passenger.balance,
        passenger: {
          name: passenger.name,
          email: passenger.email,
          phone: passenger.phone,
          userPhoto: passenger.userPhoto
        },
        booking: failedBooking
      });
    }

    // 5. Sufficient balance - deduct and log success
    if (passUsed) {
      passenger.monthlyPassBalance -= totalPrice;
    } else {
      passenger.balance -= totalPrice;
    }
    await passenger.save();

    const booking = await Booking.create({
      userId: passenger._id,
      busId: bus._id,
      seatsBooked: 1,
      totalPrice: totalPrice,
      boardingPoint: boardingPoint,
      droppingPoint: droppingPoint,
      paymentMethod: "wallet",
      paymentStatus: "paid",
      status: "scanned",
      scannedBy: req.user.id,
      scannedAt: Date.now()
    });

    // Create Settlement Transaction
    const setting = await Setting.findOne({ key: "commissionPercentage" });
    const commPct = setting && !isNaN(setting.value) ? parseFloat(setting.value) : 10;
    const commissionAmount = Math.round(totalPrice * (commPct / 100));
    const ownerAmount = totalPrice - commissionAmount;

    await OwnerTransaction.create({
      bookingId: booking._id,
      busId: bus._id,
      ticketAmount: totalPrice,
      commissionAmount,
      ownerAmount,
      status: "Pending Settlement"
    });

    // Notify admin & user
    try {
      const notif = await Notification.create({
        title: "Spot Booking Successful",
        message: `Conductor booked ticket for ${passenger.name} for ₹${totalPrice}.`,
        type: "success",
        targetRole: "admin"
      });
      
      const userNotif = await Notification.create({
        title: "Pass Deducted",
        message: `A conductor deducted ₹${totalPrice} from your wallet for a spot booking.`,
        type: "info",
        targetRole: "user",
        targetUser: passenger._id
      });

      const io = req.app.get('io');
      if (io) {
        io.emit('new_admin_notification', notif);
        io.emit('admin_data_updated');
        io.to(passenger._id.toString()).emit('new_notification', userNotif);
        io.to(passenger._id.toString()).emit('user_data_updated');
      }
    } catch(err) { console.error(err); }

    return res.status(200).json({
      message: "Monthly pass spot booking successful",
      passenger: {
        name: passenger.name,
        email: passenger.email,
        phone: passenger.phone,
        userPhoto: passenger.userPhoto,
        balance: passenger.balance
      },
      booking: booking
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /history
router.get("/history", auth, async (req, res) => {
  try {
    if (req.user.role !== "conductor") {
      return res.status(403).json({ message: "Access denied" });
    }

    const bookings = await Booking.find({ scannedBy: req.user.id })
      .sort({ scannedAt: -1 })
      .populate("userId", "name email phone userPhoto age ageGroup balance")
      .populate("busId", "busName from to");

    return res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /refund-booking
router.post("/refund-booking", auth, async (req, res) => {
  try {
    if (req.user.role !== "conductor") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ message: "Booking ID is required" });

    const booking = await Booking.findById(bookingId).populate("userId");
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.status === "refunded") {
      return res.status(400).json({ message: "Booking is already refunded" });
    }

    if (booking.status === "failed") {
      return res.status(400).json({ message: "Cannot refund a failed transaction" });
    }

    const passenger = booking.userId;
    if (!passenger) {
      return res.status(404).json({ message: "Passenger associated with booking not found" });
    }

    // Refund passenger wallet
    passenger.balance = (passenger.balance || 0) + booking.totalPrice;
    await passenger.save();

    // Mark booking as refunded
    booking.status = "refunded";
    booking.paymentStatus = "refunded";
    await booking.save();

    // Notify admin & user
    try {
      const notif = await Notification.create({
        title: "Ticket Refunded",
        message: `Conductor refunded ₹${booking.totalPrice} to ${passenger.name}.`,
        type: "info",
        targetRole: "admin"
      });
      
      const userNotif = await Notification.create({
        title: "Ticket Refunded",
        message: `A conductor refunded ₹${booking.totalPrice} to your wallet.`,
        type: "success",
        targetRole: "user",
        targetUser: passenger._id
      });

      const io = req.app.get('io');
      if (io) {
        io.emit('new_admin_notification', notif);
        io.emit('admin_data_updated');
        io.to(passenger._id.toString()).emit('new_notification', userNotif);
        io.to(passenger._id.toString()).emit('user_data_updated');
      }
    } catch(err) { console.error(err); }

    return res.status(200).json({
      message: "Refund processed successfully",
      refundAmount: booking.totalPrice,
      newBalance: passenger.balance,
      booking
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// PUT /update-stop
router.put("/update-stop", auth, async (req, res) => {
  try {
    if (req.user.role !== "conductor") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { busId, nextStop } = req.body;
    if (!busId || !nextStop) {
      return res.status(400).json({ message: "busId and nextStop are required" });
    }

    const bus = await Bus.findById(busId);
    if (!bus) return res.status(404).json({ message: "Bus not found" });

    bus.nextStop = nextStop;
    await bus.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`bus_${bus._id.toString()}`).emit('bus_location_update', { busId: bus._id, nextStop });
    }

    return res.status(200).json({ message: "Stop updated successfully", bus });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
