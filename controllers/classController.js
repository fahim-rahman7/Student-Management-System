const Class = require("../models/Class");
const User = require("../models/User");
const Subject = require("../models/Subject");

const createClass = async (req, res) => {
  try {
    const {
      name,
      section,
      classTeacher,
      students = [],
      subjects = [],
    } = req.body;

    // Creator ID from authenticated user
    const creatorId = req.user._id;

    // Required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Class name is required",
      });
    }

    // Check duplicate class
    const existingClass = await Class.findOne({
      name,
      section,
    });

    if (existingClass) {
      return res.status(400).json({
        success: false,
        message: "Class already exists",
      });
    }

    // Validate class teacher
    if (classTeacher) {
      const teacher = await User.findOne({
        _id: classTeacher,
        role: "teacher",
      });

      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: "Invalid class teacher",
        });
      }
    }

    // Validate students
    if (students.length > 0) {
      const studentCount = await User.countDocuments({
        _id: { $in: students },
        role: "student",
      });

      if (studentCount !== students.length) {
        return res.status(400).json({
          success: false,
          message: "One or more students are invalid",
        });
      }
    }

    // Validate subjects and teachers
    for (const item of subjects) {
      const subject = await Subject.findById(item.subject);

      if (!subject) {
        return res.status(404).json({
          success: false,
          message: `Subject not found: ${item.subject}`,
        });
      }

      const teacher = await User.findOne({
        _id: item.teacher,
        role: "teacher",
      });

      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: `Invalid teacher for subject ${subject.name}`,
        });
      }
    }

    // Create class
    const newClass = await Class.create({
      creatorId,
      name,
      section,
      classTeacher,
      students,
      subjects,
    });

    return res.status(201).json({
      success: true,
      message: "Class created successfully",
      data: newClass,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createClass,
};