const mongoose = require("mongoose");
const User = require("../models/User");
const { AppError } = require("../helpers/utils");

function formatUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    profilePicture: user.profilePicture,
    bio: user.bio,
    address: user.address,
    role: user.role,
    isApproved: user.isApproved,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
  };
}

const getPendingUsers = async (req, res) => {
  try {
    const pendingUsers = await User.find({
      isApproved: false,
      role: { $in: ["teacher", "student"] },
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Pending users retrieved successfully.",
      data: {
        users: pendingUsers.map(formatUser),
        count: pendingUsers.length,
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

const approveUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError("Invalid User ID.", 400);
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new AppError("User not found.", 404);
    }

    if (user.role === "admin") {
      throw new AppError("Admin users are already approved.", 400);
    }

    if (user.isApproved) {
      throw new AppError("User is already approved.", 400);
    }

    user.isApproved = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "User approved successfully.",
      data: {
        user: formatUser(user),
      },
    });

  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

const rejectUser = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError("Invalid User ID.", 400);
    }

    const user = await User.findById(userId);

    if (!user) {
      throw new AppError("User not found.", 404);
    }

    if (user.role === "admin") {
      throw new AppError("Cannot reject admin user.", 403);
    }

    await user.deleteOne();

    return res.status(200).json({
      success: true,
      message: "User rejected successfully.",
    });

  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

const getTeachers = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = {
      role: "teacher",
    };

    if (status === "approved") {
      filter.isApproved = true;
    }

    if (status === "pending") {
      filter.isApproved = false;
    }

    const teachers = await User.find(filter).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      message: "Teachers retrieved successfully.",
      data: {
        teachers: teachers.map(formatUser),
        count: teachers.length,
      },
    });

  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

const getStudents = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = {
      role: "student",
    };

    if (status === "approved") {
      filter.isApproved = true;
    }

    if (status === "pending") {
      filter.isApproved = false;
    }

    const students = await User.find(filter).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      message: "Students retrieved successfully.",
      data: {
        students: students.map(formatUser),
        count: students.length,
      },
    });

  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { role, status } = req.query;

    const filter = {};

    if (role) {
      if (!["admin", "teacher", "student"].includes(role)) {
        throw new AppError("Invalid role.", 400);
      }

      filter.role = role;
    }

    if (status === "approved") {
      filter.isApproved = true;
    }

    if (status === "pending") {
      filter.isApproved = false;
    }

    const users = await User.find(filter).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully.",
      data: {
        users: users.map(formatUser),
        count: users.length,
      },
    });

  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  getPendingUsers,
  approveUser,
  rejectUser,
  getTeachers,
  getStudents,
  getAllUsers,
};