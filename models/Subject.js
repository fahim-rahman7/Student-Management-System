const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    creatorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Creator ID is required"]
    },
    name: {
      type: String,
      required: [true, "Subject Name is required"],
      trim: true,
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    code: {
        type: String,
        required: [true, "Subject Code is required"],
        trim: true,
        unique: true,
        maxlength: [10, "Code cannot exceed 10 characters"],
    },
    credits: {
        type: Number,
        required: false,
        min: [0, "Credits cannot be negative"],
    },
    description: {
        type: String,
        required: false,
        maxlength: [200, "Description cannot exceed 200 characters"],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Subject", subjectSchema);