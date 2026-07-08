const mongoose = require('mongoose');

const ownerTransactionSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  busId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bus',
    required: true
  },
  ticketAmount: {
    type: Number,
    required: true
  },
  commissionAmount: {
    type: Number,
    required: true
  },
  ownerAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending Settlement', 'Settled'],
    default: 'Pending Settlement'
  },
  bookingDate: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('OwnerTransaction', ownerTransactionSchema);
