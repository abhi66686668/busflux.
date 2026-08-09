const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://abhishek:Abhi123456789@cluster0.kis8mkj.mongodb.net/busflux').then(async () => {
  require('./models/Booking');
  require('./models/OwnerTransaction');
  const Bus = require('./models/Bus');
  const User = require('./models/User');
  const Booking = require('./models/Booking');
  
  const golden = await Bus.findOne({busName: 'GOLDEN 54'});
  const mercy = await Bus.findOne({busName: 'MERCY 51'});
  const karavali = await Bus.findOne({busName: 'KARAVALI 51K'});
  
  const ravi = await User.findOne({email: 'conductorgolden@busflux.com'});
  const girish = await User.findOne({email: 'conductormercy@busflux.com'});
  const dinesh = await User.findOne({email: 'conductorkaravali@busflux.com'});
  
  if(golden && ravi) await Booking.updateMany({busId: golden._id}, {$set: {scannedBy: ravi._id}});
  if(mercy && girish) await Booking.updateMany({busId: mercy._id}, {$set: {scannedBy: girish._id}});
  if(karavali && dinesh) await Booking.updateMany({busId: karavali._id}, {$set: {scannedBy: dinesh._id}});
  
  console.log('Bookings updated!');
  process.exit(0);
});
