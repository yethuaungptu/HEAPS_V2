const mongoose = require("mongoose");
var moment = require("moment-timezone");

const FeedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Link to the user giving feedback
    required: true,
  },
  rating: {
    type: Number, // 1–5 stars
    min: 1,
    max: 5,
    required: true,
  },
  feedbackText: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: moment.utc(Date.now()).tz("Asia/Yangon").format(),
  },
});

module.exports = mongoose.model("Feedback", FeedbackSchema);
