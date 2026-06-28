const crypto = require("crypto");
const jwt = require("jsonwebtoken");

function generateEmailVerificationToken() {
  const token = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  const expiresHours = Number(process.env.EMAIL_VERIFICATION_EXPIRES_HOURS) || 24;

  return {
    token,
    hashedToken,
    expires: new Date(Date.now() + expiresHours * 60 * 60 * 1000),
  };
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generatePasswordResetToken() {
  const token = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  return {
    token,
    hashedToken,
    expires: new Date(Date.now() + 60 * 60 * 1000),
  };
}

function signAccessToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = {
  generateEmailVerificationToken,
  generatePasswordResetToken,
  hashToken,
  signAccessToken,
  verifyAccessToken,
};
