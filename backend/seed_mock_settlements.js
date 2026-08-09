const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Bus = require("./models/Bus");
const User = require("./models/User");
const Booking = require("./models/Booking");
const OwnerTransaction = require("./models/OwnerTransaction");
const Settlement = require("./models/Settlement");

async function seedMockSettlements() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB!");

    // 1. Fetch Buses and Conductors
    const buses = await Bus.find();
    const conductors = await User.find({ role: "conductor" });
    const admin = await User.findOne({ role: "admin" });

    if (buses.length === 0) {
      console.log("No buses found! Please create buses first.");
      process.exit(1);
    }
    if (conductors.length === 0) {
      console.log("No conductors found! Please create conductors first.");
      process.exit(1);
    }

    console.log(`Found ${buses.length} buses and ${conductors.length} conductors.`);

    // 2. Clear old test/mock settlements and transactions to give clean documentation screenshots
    console.log("Cleaning up old settlements and test transactions...");
    await Settlement.deleteMany({});
    await OwnerTransaction.deleteMany({});
    await Booking.deleteMany({ isMockSettlement: true });

    const settlementsToInsert = [];
    const ownerTxToInsert = [];
    const bookingsToInsert = [];

    // Historical dates for settlements (descending order for clean table display)
    const historyDates = [
      { date: new Date("2026-08-05T14:30:00Z"), month: "August 2026", base: 84000 },
      { date: new Date("2026-08-01T10:15:00Z"), month: "August 2026", base: 92500 },
      { date: new Date("2026-07-28T16:45:00Z"), month: "July 2026", base: 76000 },
      { date: new Date("2026-07-22T11:20:00Z"), month: "July 2026", base: 68500 },
      { date: new Date("2026-07-15T09:00:00Z"), month: "July 2026", base: 81200 },
      { date: new Date("2026-07-08T15:10:00Z"), month: "July 2026", base: 59000 },
      { date: new Date("2026-07-01T12:00:00Z"), month: "July 2026", base: 64500 },
      { date: new Date("2026-06-25T14:00:00Z"), month: "June 2026", base: 72000 }
    ];

    // --- A. Generate Paid Settlement History Records ---
    // We create historical paid settlements for each bus.
    for (let i = 0; i < buses.length; i++) {
      const bus = buses[i];

      for (const item of historyDates) {
        // Vary slightly per bus so each row looks unique and natural
        const variation = (i * 3500) % 15000;
        const totalSales = item.base + variation;
        const commission = Math.round(totalSales * 0.10);
        const payableAmount = totalSales - commission;

        const settlementDoc = new Settlement({
          busId: bus._id,
          month: item.month,
          totalSales: totalSales,
          commission: commission, // Store positive commission
          payableAmount: payableAmount,
          paymentStatus: "Paid",
          createdAt: item.date,
          updatedAt: item.date
        });
        settlementsToInsert.push(settlementDoc);

        // For EACH conductor, create a dummy booking and settled transaction linked to this bus!
        // Why? Because Conductor history query searches Booking.find({ scannedBy: req.user.id }) to find which buses' settlements to display!
        // By linking every conductor to every bus, ANY conductor logging in will see the full, rich settlement history!
        for (const conductor of conductors) {
          const dummyBooking = new Booking({
            userId: admin ? admin._id : conductor._id,
            busId: bus._id,
            seatsBooked: Math.floor(totalSales / 500) || 1,
            totalPrice: Math.round(totalSales / conductors.length),
            boardingPoint: bus.from || "Terminal A",
            droppingPoint: bus.to || "Terminal B",
            paymentMethod: "wallet",
            paymentStatus: "paid",
            status: "scanned",
            scannedBy: conductor._id,
            scannedAt: item.date,
            isMockSettlement: true
          });
          bookingsToInsert.push(dummyBooking);

          ownerTxToInsert.push({
            bookingId: dummyBooking._id,
            busId: bus._id,
            ticketAmount: dummyBooking.totalPrice,
            commissionAmount: Math.round(dummyBooking.totalPrice * 0.10),
            ownerAmount: dummyBooking.totalPrice - Math.round(dummyBooking.totalPrice * 0.10),
            status: "Settled",
            bookingDate: item.date
          });
        }
      }
    }

    // --- B. Generate Pending Settlement Dues (For Conductor & Admin Dashboards) ---
    // We create pending transactions for EACH conductor across the buses so that:
    // 1) When Admin checks Pending Settlements, they see large numbers (e.g. Total Revenue ₹2,50,000+, Payable ₹2,25,000+)
    // 2) When ANY Conductor checks Pending Settlement Dues, they see impressive figures (e.g. ₹85,000+ Total Collected, ₹76,500+ Owed to Owner, ₹8,500+ Owed to Busflux)
    for (const conductor of conductors) {
      for (let i = 0; i < buses.length; i++) {
        const bus = buses[i];
        const numPendingTx = 6; // 6 per bus per conductor

        for (let j = 0; j < numPendingTx; j++) {
          // Clean ticket amounts between ₹4,000 and ₹8,500
          const ticketAmount = ((Math.floor(Math.random() * 46) + 40) * 100); // e.g. 4000 to 8500 in multiples of 100
          const commissionAmount = Math.round(ticketAmount * 0.10);
          const ownerAmount = ticketAmount - commissionAmount;

          const pendingDate = new Date();
          pendingDate.setHours(pendingDate.getHours() - (j * 4) - (i * 2));

          const pendingBooking = new Booking({
            userId: admin ? admin._id : conductor._id,
            busId: bus._id,
            seatsBooked: Math.floor(ticketAmount / 500) || 1,
            totalPrice: ticketAmount,
            boardingPoint: bus.from || "Terminal A",
            droppingPoint: bus.to || "Terminal B",
            paymentMethod: "wallet",
            paymentStatus: "paid",
            status: "scanned",
            scannedBy: conductor._id,
            scannedAt: pendingDate,
            isMockSettlement: true
          });
          bookingsToInsert.push(pendingBooking);

          ownerTxToInsert.push({
            bookingId: pendingBooking._id,
            busId: bus._id,
            ticketAmount: ticketAmount,
            commissionAmount: commissionAmount,
            ownerAmount: ownerAmount,
            status: "Pending Settlement",
            bookingDate: pendingDate
          });
        }
      }
    }

    console.log(`Inserting ${bookingsToInsert.length} mock bookings...`);
    await Booking.insertMany(bookingsToInsert);

    console.log(`Inserting ${settlementsToInsert.length} mock settlement records...`);
    await Settlement.insertMany(settlementsToInsert);

    console.log(`Inserting ${ownerTxToInsert.length} owner transactions...`);
    await OwnerTransaction.insertMany(ownerTxToInsert);

    console.log("\n✅ SUCCESS! High-value mock settlement data generated successfully.");
    console.log("Admin and Conductor dashboards will now display impressive, corporate figures for documentation screenshots.");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding mock settlements:", error);
    process.exit(1);
  }
}

seedMockSettlements();
