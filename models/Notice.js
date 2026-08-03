const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema(
  {
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator ID is required"],
    },

    title: {
      type: String,
      required: [true, "Notice title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },

    noticeContent: {
      type: String,
      required: [true, "Notice content is required"],
      trim: true,
      maxlength: [5000, "Notice content cannot exceed 5000 characters"],
    },

    noticeImg: {
      type: String,
      default: "",
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    audience: {
      type: String,
      enum: ["all", "student", "teacher", "admin"],
      default: "all",
    },

    isPinned: {
      type: Boolean,
      default: false,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Notice", noticeSchema);