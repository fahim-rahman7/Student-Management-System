const Class = require("../models/Class");
const mongoose = require("mongoose");

const {
  validateClassTeacher,
  validateStudents,
  validateSubjects,
} = require("../helpers/classValidation");

const { AppError } = require("../helpers/utils");

// ======================
// Create Class
// ======================
const createClass = async (req, res) => {
  try {
    const {
      name,
      section,
      classTeacher,
      students = [],
      subjects = [],
    } = req.body;

    if (!name) {
      throw new AppError("Class name is required.", 400);
    }

    const existingClass = await Class.findOne({
      name,
      section,
    });

    if (existingClass) {
      throw new AppError("Class already exists.", 400);
    }

    await validateClassTeacher(classTeacher);
    await validateStudents(students);
    await validateSubjects(subjects);

    const newClass = await Class.create({
      creatorId: req.user._id,
      name,
      section,
      classTeacher,
      students,
      subjects,
    });

    return res.status(201).json({
      success: true,
      message: "Class created successfully.",
      data: newClass,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================
// Get All Classes
// ======================
const getClasses = async (req, res) => {
  try {
    const classes = await Class.find()
      .populate("classTeacher", "name email")
      .populate("students", "name email")
      .populate("subjects.subject", "name code")
      .populate("subjects.teacher", "name email");

    return res.status(200).json({
      success: true,
      message: "Classes fetched successfully.",
      data: classes,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================
// Update Class
// ======================
const updateClass = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid Class ID.", 400);
    }

    const existingClass = await Class.findById(id);

    if (!existingClass) {
      throw new AppError("Class not found.", 404);
    }

    const {
      name,
      section,
      classTeacher,
      students,
      subjects,
    } = req.body;

    // Duplicate Check
    if (name || section) {
      const duplicateClass = await Class.findOne({
        name: name ?? existingClass.name,
        section: section ?? existingClass.section,
        _id: { $ne: id },
      });

      if (duplicateClass) {
        throw new AppError(
          "Another class with the same name and section already exists.",
          400
        );
      }
    }

    // Validate only if values are sent
    if (classTeacher !== undefined) {
      await validateClassTeacher(classTeacher);
      existingClass.classTeacher = classTeacher;
    }

    if (students !== undefined) {
      await validateStudents(students);
      existingClass.students = students;
    }

    if (subjects !== undefined) {
      await validateSubjects(subjects);
      existingClass.subjects = subjects;
    }

    if (name !== undefined) {
      existingClass.name = name;
    }

    if (section !== undefined) {
      existingClass.section = section;
    }

    await existingClass.save();

    return res.status(200).json({
      success: true,
      message: "Class updated successfully.",
      data: existingClass,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================
// Delete Class
// ======================
const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid Class ID.", 400);
    }

    const deletedClass = await Class.findByIdAndDelete(id);

    if (!deletedClass) {
      throw new AppError("Class not found.", 404);
    }

    return res.status(200).json({
      success: true,
      message: "Class deleted successfully.",
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createClass,
  getClasses,
  updateClass,
  deleteClass,
};