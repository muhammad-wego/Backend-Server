const mongoose = require("mongoose");

const personnelSchema = new mongoose.Schema({
  personnelName: {
    type: String,
    required: true,
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
  },
  battalion : {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Battalion"
  },
  rank: {
    type: String,
  },
  metalNo: {
    type: String,
    // unique : true
  },
  dateOfBirth: {
    type: Date,
  },
  followUpRequired: {
    type: Boolean,
    default: false,
  },
  lastEntry:{
    type:Date,
  },
  allEntries: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PersonnelHealth",
    },
  ],
});

module.exports = mongoose.model("Personnel", personnelSchema);
