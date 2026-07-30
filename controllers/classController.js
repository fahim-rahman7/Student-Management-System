const Class = require("../models/Class");
const User = require("../models/User");
const Subject = require("../models/Subject");
const { default: mongoose } = require("mongoose");

const createClass = async (req, res) => {
  try {
    const {
      name,
      section,
      classTeacher,
      students = [],
      subjects = [],
    } = req.body;

 
    const creatorId = req.user._id;

   
    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Class name is required",
      });
    }

    // Check existing class
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

const getClasses = async (req, res) => {
    try {
    const AllClasses = await Class.find();
    res.status(200).json({
        success: true,
        message: "Class get successfully",
        data: AllClasses,
      });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
          });
    }
}

const updateClass = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    section,
    classTeacher,
    students = [],
    subjects = [],
  } = req.body;

  try {
    // Validate Class ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Class ID.",
      });
    }

    // Check if class exists
    const existingClass = await Class.findById(id);

    if (!existingClass) {
      return res.status(404).json({
        success: false,
        message: "Class not found.",
      });
    }

    // Check duplicate class
    if (name) {
      const duplicateClass = await Class.findOne({
        name,
        section,
        _id: { $ne: id },
      });

      if (duplicateClass) {
        return res.status(400).json({
          success: false,
          message: "Another class with the same name and section already exists.",
        });
      }
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
          message: "Invalid class teacher.",
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
          message: "One or more students are invalid.",
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

    // Update class
    const updatedClass = await Class.findByIdAndUpdate(
      id,
      {
        name,
        section,
        classTeacher,
        students,
        subjects,
      },
      {
        returnDocument: "after"
      }
    );

    return res.status(200).json({
      success: true,
      message: "Class updated successfully.",
      data: updatedClass,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const deleteClass = async (req, res) => {
    const {id} = req.params;
    console.log(id);
    try {
        if(!id){
        return res.status(400).json({
                success: false,
                message: "Invalid Request",
              });
        }
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
              success: false,
              message: "Invalid Class ID.",
            });
          }
      
        const deletedSubject = await Class.findByIdAndDelete(id)
        console.log(deletedSubject);
        if(!deletedSubject){
            return res.status(404).json({
                success: false,
                message: "Subject not found",
              });
        }

        res.status(200).json({
            success: true,
            message: "Class Deleted successfully.",
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
          });
    }
}

module.exports = {
  createClass,
  getClasses,
  updateClass,
  deleteClass
};