const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const Booking = require('./models/Booking');
  const Transaction = require('./models/Transaction');

  const bookings = await Booking.find({ totalPrice: { $gt: 1000 } }).sort({ totalPrice: -1 });
  console.log(`Found ${bookings.length} large bookings (totalPrice > 1000)`);
  
  let sum = 0;
  for (let b of bookings) sum += (b.totalPrice || 0);
  console.log(`Total revenue from large bookings: ${sum}`);

  bookings.slice(0, 10).forEach(b => console.log(`${b._id} - ${b.totalPrice}`));

  process.exit(0);
}).catch(console.error);
