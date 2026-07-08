const mongoose = require('mongoose');
require('dotenv').config();
const Booking = require('./models/Booking');
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const b = await Booking.findById('6a4ab04683dfba6add03f075');
  console.log('BOOKING:', b);
  process.exit(0);
});
