const mongoose = require("mongoose");

const classSchema = new mongoose.Schema(
  {
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Creator ID is required"],
    },

    name: {
      type: String,
      required: [true, "Class name is required"],
      trim: true,
      maxlength: [50, "Class name cannot exceed 50 characters"],
    },

    section: {
      type: String,
      trim: true,
      maxlength: [10, "Section cannot exceed 10 characters"],
    },

    classTeacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    subjects: [
      {
        subject: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Subject",
          required: true,
        },
        teacher: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Class", classSchema);