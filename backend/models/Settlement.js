const mongoose = require('mongoose');

const settlementSchema = new mongoose.Schema({
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    required: true
  },
  month: {
    type: String,
    required: true
  },
  totalSales: {
    type: Number,
    required: true
  },
  commission: {
    type: Number,
    required: true
  },
  payableAmount: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid'],
    default: 'Paid'
  }
}, { timestamps: true });

module.exports = mongoose.model('Settlement', settlementSchema);
