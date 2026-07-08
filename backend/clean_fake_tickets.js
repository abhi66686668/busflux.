const mongoose = require("mongoose");
const OwnerTransaction = require("./models/OwnerTransaction");
const Booking = require("./models/Booking");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log("Connected to DB. Finding fake transactions...");
  const txs = await OwnerTransaction.find();
  
  let deletedCount = 0;
  for (const tx of txs) {
    const booking = await Booking.findById(tx.bookingId);
    if (!booking) {
      // It's a fake ticket because the booking doesn't exist
      await OwnerTransaction.findByIdAndDelete(tx._id);
      deletedCount++;
    }
  }
  
  console.log(`Deleted ${deletedCount} fake transactions.`);
  process.exit();
}).catch(console.error);
