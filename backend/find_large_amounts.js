const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Transaction = require('./models/Transaction');
  const Booking = require('./models/Booking');
  const OwnerTransaction = require('./models/OwnerTransaction');
  const Settlement = require('./models/Settlement');
  
  const bookings = await Booking.find().sort({ totalPrice: -1 }).limit(10);
  console.log("Top 10 Bookings by totalPrice:");
  bookings.forEach(b => console.log(`${b._id} - Total Price: ${b.totalPrice}`));

  const otxs = await OwnerTransaction.find().sort({ ticketAmount: -1 }).limit(10);
  console.log("\nTop 10 OwnerTransactions by ticketAmount:");
  otxs.forEach(t => console.log(`${t._id} - Ticket Amount: ${t.ticketAmount}, Commission: ${t.commissionAmount}`));

  const settlements = await Settlement.find().sort({ totalSales: -1 }).limit(10);
  console.log("\nTop 10 Settlements by totalSales:");
  settlements.forEach(s => console.log(`${s._id} - Total Sales: ${s.totalSales}, Commission: ${s.commission}`));
  
  process.exit(0);
}).catch(console.error);
