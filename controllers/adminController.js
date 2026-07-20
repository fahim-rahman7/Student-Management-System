const User = require("../models/User");

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
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve pending users.",
      error: error.message,
    });
  }
};

const approveUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.isApproved) {
      return res.status(400).json({
        success: false,
        message: "User is already approved.",
      });
    }

    user.isApproved = true;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "User approved successfully.",
      data: { user: formatUser(user) },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to approve user.",
      error: error.message,
    });
  }
};

const rejectUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (user.role === "admin") {
      return res.status(403).json({
        success: false,
        message: "Cannot reject admin users.",
      });
    }

    await User.findByIdAndDelete(userId);

    return res.status(200).json({
      success: true,
      message: "User rejected and deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to reject user.",
      error: error.message,
    });
  }
};

const getTeachers = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { role: "teacher" };

    if (status === "approved") {
      filter.isApproved = true;
    } else if (status === "pending") {
      filter.isApproved = false;
    }

    const teachers = await User.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Teachers retrieved successfully.",
      data: {
        teachers: teachers.map(formatUser),
        count: teachers.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve teachers.",
      error: error.message,
    });
  }
};

const getStudents = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { role: "student" };

    if (status === "approved") {
      filter.isApproved = true;
    } else if (status === "pending") {
      filter.isApproved = false;
    }

    const students = await User.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Students retrieved successfully.",
      data: {
        students: students.map(formatUser),
        count: students.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve students.",
      error: error.message,
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const { role, status } = req.query;
    const filter = {};

    if (role && ["admin", "teacher", "student"].includes(role)) {
      filter.role = role;
    }

    if (status === "approved") {
      filter.isApproved = true;
    } else if (status === "pending") {
      filter.isApproved = false;
    }

    const users = await User.find(filter).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully.",
      data: {
        users: users.map(formatUser),
        count: users.length,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve users.",
      error: error.message,
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