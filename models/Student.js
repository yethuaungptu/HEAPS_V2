const mongoose = require("mongoose");
const Schema = mongoose.Schema;
var moment = require("moment-timezone");

const StudentSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  regionalCode: {
    type: String,
    required: true,
  },
  rollNo: {
    type: Number,
    required: true,
  },
  myan: {
    type: Number,
    default: 0,
  },
  eng: {
    type: Number,
    default: 0,
  },
  math: {
    type: Number,
    default: 0,
  },
  phy: {
    type: Number,
    default: 0,
  },
  chem: {
    type: Number,
    default: 0,
  },
  bio: {
    type: Number,
    default: 0,
  },
  eco: {
    type: Number,
    default: 0,
  },
  hist: {
    type: Number,
    default: 0,
  },
  geo: {
    type: Number,
    default: 0,
  },
  totalMark: {
    type: Number,
    default: 0,
  },
  gender: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  academicYear: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  created: {
    type: Date,
    default: moment.utc(Date.now()).tz("Asia/Yangon").format(),
  },
  updated: {
    type: Date,
    default: moment.utc(Date.now()).tz("Asia/Yangon").format(),
  },
});

module.exports = mongoose.model("Student", StudentSchema);
