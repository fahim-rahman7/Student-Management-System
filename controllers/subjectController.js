const Subject = require("../models/Subject");
const mongoose = require("mongoose");
const { AppError } = require("../helpers/utils");

// =====================================
// Create Subject
// =====================================
const createSubject = async (req, res) => {
  try {
    const { name, code, credits, description } = req.body;

    if (!name) {
      throw new AppError("Subject name is required.", 400);
    }

    if (!code) {
      throw new AppError("Subject code is required.", 400);
    }

    if (credits === undefined) {
      throw new AppError("Subject credits are required.", 400);
    }

    const existingSubject = await Subject.findOne({ code });

    if (existingSubject) {
      throw new AppError("Subject code already exists.", 400);
    }

    const newSubject = await Subject.create({
      creatorId: req.user._id,
      name,
      code,
      credits,
      description,
    });

    return res.status(201).json({
      success: true,
      message: "Subject created successfully.",
      data: newSubject,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================
// Get All Subjects
// =====================================
const getSubject = async (req, res) => {
  try {
    const allSubject = await Subject.find().populate(
      "creatorId",
      "name email"
    );

    return res.status(200).json({
      success: true,
      message: "Subjects fetched successfully.",
      total: allSubject.length,
      data: allSubject,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================
// Update Subject
// =====================================
const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid Subject ID.", 400);
    }

    const subject = await Subject.findById(id);

    if (!subject) {
      throw new AppError("Subject not found.", 404);
    }

    const { name, code, credits, description } = req.body;

    if (code) {
      const existingSubject = await Subject.findOne({
        code,
        _id: { $ne: id },
      });

      if (existingSubject) {
        throw new AppError("Subject code already exists.", 400);
      }
    }

    if (name !== undefined) {
      subject.name = name;
    }

    if (code !== undefined) {
      subject.code = code;
    }

    if (credits !== undefined) {
      subject.credits = credits;
    }

    if (description !== undefined) {
      subject.description = description;
    }

    await subject.save();

    return res.status(200).json({
      success: true,
      message: "Subject updated successfully.",
      data: subject,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================
// Delete Subject
// =====================================
const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid Subject ID.", 400);
    }

    const subject = await Subject.findByIdAndDelete(id);

    if (!subject) {
      throw new AppError("Subject not found.", 404);
    }

    return res.status(200).json({
      success: true,
      message: "Subject deleted successfully.",
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createSubject,
  getSubject,
  updateSubject,
  deleteSubject,
};