const mongoose = require("mongoose");

const SupportTicketSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    name:    { type: String, default: "Guest" },
    email:   { type: String, default: "" },
    subject: { type: String, required: true },
    details: { type: String, required: true },
    status:  { type: String, enum: ["open", "in-progress", "resolved", "closed"], default: "open" },
    adminReply: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("SupportTicket", SupportTicketSchema);
