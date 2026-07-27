const express = require("express");
const router = express.Router();
const authController = require("../../controllers/authController.js");
const { protect, requireVerifiedEmail, requireApproved } = require("../../middleware/authMiddleware.js");
const upload = require("../../middleware/fileUpload.js");



router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/verify-email/:token", authController.verifyEmail);
router.post("/resend-verification", authController.resendVerification);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);
router.get("/me", protect, requireVerifiedEmail, requireApproved, authController.getMe);
router.put("/profile", protect, requireVerifiedEmail, requireApproved, upload.single("profilePicture"), authController.updateProfile);

module.exports = router;