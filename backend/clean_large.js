const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Booking = require('./models/Booking');
  const OwnerTransaction = require('./models/OwnerTransaction');
  const Settlement = require('./models/Settlement');

  const bRes = await Booking.deleteMany({ totalPrice: { $gt: 1000 } });
  console.log(`Deleted ${bRes.deletedCount} abnormally large bookings`);

  const otRes = await OwnerTransaction.deleteMany({ ticketAmount: { $gt: 1000 } });
  console.log(`Deleted ${otRes.deletedCount} abnormally large OwnerTransactions`);

  const sRes = await Settlement.deleteMany({ totalSales: { $gt: 1000 } });
  console.log(`Deleted ${sRes.deletedCount} abnormally large Settlements`);

  process.exit(0);
}).catch(console.error);
