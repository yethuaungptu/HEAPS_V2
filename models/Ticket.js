const mongoose = require("mongoose");
var moment = require("moment-timezone");

const answerSchema = new mongoose.Schema({
  isAuthor: { type: Boolean, default: true }, // who answered
  message: { type: String, required: true }, // answer text
  createdAt: {
    type: Date,
    default: moment.utc(Date.now()).tz("Asia/Yangon").format(),
  },
});

const ticketSchema = new mongoose.Schema({
  title: { type: String, required: true }, // short title of ticket
  question: { type: String, required: true }, // detailed question
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Link to the user giving feedback
    required: true,
  }, // who asked
  status: {
    type: String,
    enum: ["open", "pending", "resolved", "closed"],
    default: "open",
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "medium",
  },
  answers: [answerSchema], // list of answers
  createdAt: {
    type: Date,
    default: moment.utc(Date.now()).tz("Asia/Yangon").format(),
  },
  updatedAt: {
    type: Date,
    default: moment.utc(Date.now()).tz("Asia/Yangon").format(),
  },
});

module.exports = mongoose.model("Ticket", ticketSchema);
