const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Booking = require('./models/Booking');
  const OwnerTransaction = require('./models/OwnerTransaction');
  const Settlement = require('./models/Settlement');

  const bookings = await Booking.find({ status: { $ne: "failed" } });
  const totalRevenueBookings = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);

  const transactions = await OwnerTransaction.find({ status: "Settled" });
  const totalAdminProfit = transactions.reduce((sum, tx) => sum + (tx.commissionAmount || 0), 0);

  const settlements = await Settlement.find();
  const totalSalesSettlements = settlements.reduce((sum, s) => sum + (s.totalSales || 0), 0);
  const totalCommissionSettlements = settlements.reduce((sum, s) => sum + (s.commission || 0), 0);

  console.log(`Dashboard Total Revenue (from Bookings): ${totalRevenueBookings}`);
  console.log(`Dashboard Total Profit (from OwnerTx): ${totalAdminProfit}`);
  console.log(`Settlements Total Sales: ${totalSalesSettlements}`);
  console.log(`Settlements Total Commission: ${totalCommissionSettlements}`);

  process.exit(0);
}).catch(console.error);
