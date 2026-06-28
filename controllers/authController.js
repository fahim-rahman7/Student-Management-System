const User = require("../models/User");
const {
  generateEmailVerificationToken,
  generatePasswordResetToken,
  hashToken,
  signAccessToken,
} = require("../helpers/tokenHelper");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../helpers/emailHelper");

function formatUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt,
  };
}

function getVerificationUrl(token) {
  const baseUrl = process.env.APP_URL || `http://localhost:${process.env.PORT || 8000}`;
  return `${baseUrl}${process.env.BASE_URL}/auth/verify-email/${token}`;
}

function getResetPasswordUrl(token) {
  const frontendUrl = process.env.FRONTEND_URL || process.env.APP_URL || "http://localhost:3000";
  return `${frontendUrl}/reset-password?token=${token}`;
}

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const { token, hashedToken, expires } = generateEmailVerificationToken();

    const user = await User.create({
      name,
      email,
      password,
      emailVerificationToken: hashedToken,
      emailVerificationExpires: expires,
    });

    const verificationUrl = getVerificationUrl(token);
    const emailResult = await sendVerificationEmail({
      to: user.email,
      name: user.name,
      verificationUrl,
    });

    return res.status(201).json({
      success: true,
      message: emailResult.sent
        ? "Registration successful. Please check your email to verify your account."
        : "Registration successful. Email could not be sent — use the verification URL below (dev mode).",
      data: {
        user: formatUser(user),
        ...(emailResult.sent ? {} : { verificationUrl: emailResult.verificationUrl }),
      },
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const message = Object.values(error.errors)
        .map((err) => err.message)
        .join(", ");
      return res.status(400).json({ success: false, message });
    }

    return res.status(500).json({
      success: false,
      message: "Registration failed.",
      error: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in.",
        data: { isEmailVerified: false },
      });
    }

    const token = signAccessToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        user: formatUser(user),
        token,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Login failed.",
      error: error.message,
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required.",
      });
    }

    const hashedToken = hashToken(token);

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: Date.now() },
    }).select("+emailVerificationToken +emailVerificationExpires");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired verification token.",
      });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    const accessToken = signAccessToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Email verified successfully. You can now log in.",
      data: {
        user: formatUser(user),
        token: accessToken,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Email verification failed.",
      error: error.message,
    });
  }
};

const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+emailVerificationToken +emailVerificationExpires"
    );

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If an account exists with this email, a verification link has been sent.",
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified.",
      });
    }

    const { token, hashedToken, expires } = generateEmailVerificationToken();

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = expires;
    await user.save();

    const verificationUrl = getVerificationUrl(token);
    const emailResult = await sendVerificationEmail({
      to: user.email,
      name: user.name,
      verificationUrl,
    });

    return res.status(200).json({
      success: true,
      message: emailResult.sent
        ? "Verification email sent."
        : "Email could not be sent — use the verification URL below (dev mode).",
      ...(emailResult.sent ? {} : { verificationUrl: emailResult.verificationUrl }),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to resend verification email.",
      error: error.message,
    });
  }
};

const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: { user: formatUser(req.user) },
  });
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+passwordResetToken +passwordResetExpires"
    );

    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If an account exists with this email, a password reset link has been sent.",
      });
    }

    const { token, hashedToken, expires } = generatePasswordResetToken();

    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = expires;
    await user.save();

    const resetUrl = getResetPasswordUrl(token);
    const emailResult = await sendPasswordResetEmail({
      to: user.email,
      name: user.name,
      resetUrl,
    });

    return res.status(200).json({
      success: true,
      message: emailResult.sent
        ? "Password reset email sent."
        : "Email could not be sent — use the reset URL below (dev mode).",
      ...(emailResult.sent ? {} : { resetUrl: emailResult.resetUrl }),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to process password reset request.",
      error: error.message,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "New password is required.",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters.",
      });
    }

    const hashedToken = hashToken(token);

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select("+passwordResetToken +passwordResetExpires +password");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token.",
      });
    }

    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    const accessToken = signAccessToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Password reset successful.",
      data: {
        user: formatUser(user),
        token: accessToken,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Password reset failed.",
      error: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerification,
  getMe,
  forgotPassword,
  resetPassword,
};
