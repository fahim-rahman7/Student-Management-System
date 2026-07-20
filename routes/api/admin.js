const express = require("express");
const router = express.Router();
const {
  getPendingUsers,
  approveUser,
  rejectUser,
  getTeachers,
  getStudents,
  getAllUsers,
} = require("../../controllers/adminController");
const { protect, requireAdmin } = require("../../middleware/authMiddleware");

// All admin routes require authentication and admin role
router.use(protect, requireAdmin);

// Get pending users (teachers and students awaiting approval)
router.get("/users/pending", getPendingUsers);

// Approve a user
router.patch("/users/:userId/approve", approveUser);

// Reject a user (deletes the user)
router.delete("/users/:userId/reject", rejectUser);

// Get all teachers (with optional status filter)
router.get("/teachers", getTeachers);

// Get all students (with optional status filter)
router.get("/students", getStudents);

// Get all users (with optional role and status filters)
router.get("/users", getAllUsers);

module.exports = router;