const mongoose = require("mongoose");
const OwnerTransaction = require("./models/OwnerTransaction");
const Setting = require("./models/Setting");
require("dotenv").config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const setting = await Setting.findOne({ key: "commissionPercentage" });
  const rate = setting ? parseFloat(setting.value) : 10;
  
  const pendingTxs = await OwnerTransaction.find({ status: "Pending Settlement" });
  for (let tx of pendingTxs) {
    const comm = Math.round(tx.ticketAmount * (rate / 100));
    tx.commissionAmount = comm;
    tx.ownerAmount = tx.ticketAmount - comm;
    await tx.save();
  }
  console.log(`Updated pending transactions to ${rate}%`);
  process.exit();
}).catch(console.error);
