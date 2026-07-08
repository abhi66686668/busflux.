const mongoose = require('mongoose');
require('dotenv').config();
const OwnerTransaction = require('./models/OwnerTransaction');
mongoose.connect(process.env.MONGO_URI).then(async () => {
  const txs = await OwnerTransaction.find();
  console.log('TXS:', JSON.stringify(txs, null, 2));
  process.exit(0);
});
