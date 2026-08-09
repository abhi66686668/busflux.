const mongoose = require('mongoose');
const User = require('./models/User');
mongoose.connect('mongodb+srv://abhishek:Abhi123456789@cluster0.kis8mkj.mongodb.net/busflux').then(async () => {
  await User.updateOne({ email: 'conductorgolden@busflux.com' }, { bankName: 'HDFC Bank', accountNumber: '50100234567890', ifscCode: 'HDFC0001234', upiId: 'golden54@hdfc' });
  await User.updateOne({ email: 'conductormercy@busflux.com' }, { bankName: 'SBI Bank', accountNumber: '30234567890', ifscCode: 'SBIN0004567', upiId: 'mercy51@sbi' });
  await User.updateOne({ email: 'conductorkaravali@busflux.com' }, { bankName: 'Axis Bank', accountNumber: '912010034567890', ifscCode: 'UTIB0000789', upiId: 'karavali51k@axis' });
  console.log('Done updating DB');
  process.exit(0);
});
