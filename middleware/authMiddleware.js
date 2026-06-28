const User = require("../models/User");
const { verifyAccessToken } = require("../helpers/tokenHelper");

async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please log in.",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = verifyAccessToken(token);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Not authorized. Invalid or expired token.",
    });
  }
}

async function requireVerifiedEmail(req, res, next) {
  if (!req.user.isEmailVerified) {
    return res.status(403).json({
      success: false,
      message: "Please verify your email before accessing this resource.",
    });
  }

  next();
}

module.exports = {
  protect,
  requireVerifiedEmail,
};
