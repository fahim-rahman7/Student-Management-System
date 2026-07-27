const express = require("express");
const router = express.Router();
const authController = require("../../controllers/authController.js");
const { protect, requireVerifiedEmail } = require("../../middleware/authMiddleware.js");
const { rateLimiter } = require("../../helpers/utils.js");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/verify-email/:token", authController.verifyEmail);
router.post("/resend-verification", authController.resendVerification);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password/:token", authController.resetPassword);
router.get("/me",rateLimiter, protect, requireVerifiedEmail, authController.getMe);

module.exports = router;
