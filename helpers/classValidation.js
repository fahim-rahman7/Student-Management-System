const User = require("../models/User");
const Subject = require("../models/Subject");
const { AppError } = require("./utils");
const { default: mongoose } = require("mongoose");



const validateClassTeacher = async (classTeacher) => {
  if (!classTeacher) return;

  if (!mongoose.Types.ObjectId.isValid(classTeacher)) {
    throw new AppError("Invalid class teacher.", 400);
  }

  const teacher = await User.findOne({
    _id: classTeacher,
    role: "teacher",
  });

  if (!teacher) {
    throw new AppError("Class teacher not found.", 404);
  }

};


const validateStudents = async (students = []) => {
  if (!students.length) return;

  for (const studentId of students) {
    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      throw new AppError(`Invalid student ID: ${studentId}`, 400);
    }
  
    const student = await User.findById(studentId);
  
    if (!student) {
      throw new AppError(`Student not found: ${studentId}`, 404);
    }
  
    if (student.role !== "student") {
      throw new AppError(`${student.name} is not a student.`, 400);
    }
  }
};


const validateSubjects = async (subjects = []) => {
  for (const item of subjects) {
    if (!mongoose.Types.ObjectId.isValid(item.subject)) {
        throw new AppError(
          `Invalid subject ID: ${item.subject}`,
          400
        );
      }
  
      // Validate Teacher ID format
      if (!mongoose.Types.ObjectId.isValid(item.teacher)) {
        throw new AppError(
          `Invalid teacher ID: ${item.teacher}`,
          400
        );
      }
      
    const subject = await Subject.findById(item.subject);

    if (!subject) {
      throw new AppError(
        `Subject not found: ${item.subject}`,
        404
      );
    }

    const teacher = await User.findById(item.teacher);

    if (!teacher) {
      throw new AppError(
        `Teacher not found: ${item.teacher}`,
        404
      );
    }

    if (teacher.role !== "teacher") {
        throw new AppError(
          `${teacher.name} is not a teacher.`,
          400
        );
      }

  }
};

module.exports = {
  validateStudents,
  validateSubjects,
  validateClassTeacher,
};