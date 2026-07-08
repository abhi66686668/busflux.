const mongoose = require("mongoose");
const express = require("express");
const Booking = require("./models/Booking");
const User = require("./models/User");
const Bus = require("./models/Bus");
const OwnerTransaction = require("./models/OwnerTransaction");
const Notification = require("./models/Notification");
require("dotenv").config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  
  // Find a conductor
  const conductor = await User.findOne({ role: "conductor" });
  if (!conductor) return console.log("No conductor found");
  
  // Find a bus
  const bus = await Bus.findOne();
  if (!bus) return console.log("No bus found");
  
  // Find a passenger
  const passenger = await User.findOne({ role: "user" });
  if (!passenger) return console.log("No passenger found");
  
  // Mock req, res
  const req = {
    user: { id: conductor._id, role: "conductor" },
    body: {
      email: passenger.email,
      busId: bus._id.toString(),
      boardingPoint: bus.from,
      droppingPoint: bus.to
    },
    app: { get: () => null } // mock io
  };
  
  const res = {
    status: function(code) {
      this.statusCode = code;
      return this;
    },
    json: function(data) {
      console.log(`RESPONSE: ${this.statusCode}`);
      console.log(JSON.stringify(data, null, 2));
    }
  };
  
  try {
    // 1. Find passenger
    const cleanEmail = req.body.email.trim().toLowerCase();
    const passUser = await User.findOne({ email: cleanEmail });
    
    // 2. Find bus
    const busDoc = await Bus.findById(req.body.busId);
    
    // 3. Calculate price
    const ageGroup = passUser.ageGroup || "";
    
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
    
    const basePrice = getAgeGroupPrice(busDoc, ageGroup);
    const ratio = getStopRatio(busDoc, req.body.boardingPoint, req.body.droppingPoint);
    const totalPrice = Math.round(basePrice * ratio);
    console.log("Total Price calculated:", totalPrice);
    
    // 4. Check balance
    let passUsed = false;
    if (passUser.monthlyPassExpiry && passUser.monthlyPassExpiry > new Date() && (passUser.monthlyPassBalance || 0) >= totalPrice) {
      passUsed = true;
    } else if ((passUser.balance || 0) >= totalPrice) {
      passUsed = false;
    } else {
      console.log("Insufficient balance", passUser.balance, totalPrice);
      return res.status(400).json({ message: "Insufficient balance" });
    }
    
    // 5. Deduct
    if (passUsed) { passUser.monthlyPassBalance -= totalPrice; }
    else { passUser.balance -= totalPrice; }
    await passUser.save();
    
    // 6. Create booking
    console.log("Creating booking...");
    const booking = await Booking.create({
      userId: passUser._id,
      busId: busDoc._id,
      seatsBooked: 1,
      totalPrice: totalPrice,
      boardingPoint: req.body.boardingPoint,
      droppingPoint: req.body.droppingPoint,
      paymentMethod: "wallet",
      paymentStatus: "paid",
      status: "scanned",
      scannedBy: req.user.id,
      scannedAt: Date.now()
    });
    console.log("Booking created:", booking._id);
    
    return res.status(200).json({ booking });
  } catch (err) {
    console.error("CAUGHT ERROR:", err);
  }
  
  process.exit();
}

run();
