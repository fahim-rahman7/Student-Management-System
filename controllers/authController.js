const User = require("../models/User");
const {
  generateEmailVerificationToken,
  signAccessToken,
} = require("../helpers/tokenHelper");

const {
  sendVerificationEmail,
} = require("../helpers/emailHelper");

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

function getVerificationUrl(token) {
  const frontendUrl =
    process.env.FRONTEND_URL ||
    process.env.APP_URL ||
    "http://localhost:3000";

  return `${frontendUrl}/verify-email?token=${token}`;
}

const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name) {
      throw new AppError("Name is required.", 400);
    }

    if (!email) {
      throw new AppError("Email is required.", 400);
    }

    if (!password) {
      throw new AppError("Password is required.", 400);
    }

    if (password.length < 8) {
      throw new AppError(
        "Password must be at least 8 characters.",
        400
      );
    }

    if (
      role &&
      !["admin", "teacher", "student"].includes(role)
    ) {
      throw new AppError(
        "Invalid role. Must be admin, teacher or student.",
        400
      );
    }

    const existingUser = await User.findOne({
      email: email.toLowerCase(),
    });

    if (existingUser) {
      throw new AppError(
        "An account with this email already exists.",
        409
      );
    }

    const {
      token,
      hashedToken,
      expires,
    } = generateEmailVerificationToken();

    const user = await User.create({
      name,
      email,
      password,
      role: role || "student",
      emailVerificationToken: hashedToken,
      emailVerificationExpires: expires,
    });

    const verificationUrl = getVerificationUrl(token);

    let emailResult = {
      sent: false,
      verificationUrl,
    };

    try {
      emailResult = await sendVerificationEmail({
        to: user.email,
        name: user.name,
        verificationUrl,
      });
    } catch (err) {
      console.error(err.message);
    }

    return res.status(201).json({
      success: true,
      message: emailResult.sent
        ? "Registration successful. Please verify your email."
        : "Registration successful. Email could not be sent.",
      data: {
        user: formatUser(user),
        ...(emailResult.previewUrl && {
          previewUrl: emailResult.previewUrl,
        }),
        ...(!emailResult.sent && {
          verificationUrl,
        }),
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      throw new AppError("Email is required.", 400);
    }

    if (!password) {
      throw new AppError("Password is required.", 400);
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
    }).select("+password");

    if (!user) {
      throw new AppError(
        "Invalid email or password.",
        401
      );
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      throw new AppError(
        "Invalid email or password.",
        401
      );
    }

    if (!user.isEmailVerified) {
      throw new AppError(
        "Please verify your email before logging in.",
        403
      );
    }

    if (!user.isApproved) {
      throw new AppError(
        "Your account is pending approval from admin.",
        403
      );
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
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      throw new AppError("Verification token is required.", 400);
    }

    const hashedToken = hashToken(token);

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: {
        $gt: Date.now(),
      },
    }).select(
      "+emailVerificationToken +emailVerificationExpires"
    );

    if (!user) {
      throw new AppError(
        "Invalid or expired verification token.",
        400
      );
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;

    await user.save();

    const accessToken = signAccessToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Email verified successfully.",
      data: {
        user: formatUser(user),
        token: accessToken,
      },
    });

  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

const resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError("Email is required.", 400);
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
    }).select(
      "+emailVerificationToken +emailVerificationExpires"
    );

    /**
     * Security Reason
     * Never tell whether an email exists or not.
     */
    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, a verification email has been sent.",
      });
    }

    if (user.isEmailVerified) {
      throw new AppError(
        "Email is already verified.",
        400
      );
    }

    const {
      token,
      hashedToken,
      expires,
    } = generateEmailVerificationToken();

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = expires;

    await user.save();

    const verificationUrl = getVerificationUrl(token);

    const emailResult =
      await sendVerificationEmail({
        to: user.email,
        name: user.name,
        verificationUrl,
      });

    return res.status(200).json({
      success: true,
      message: emailResult.sent
        ? "Verification email sent successfully."
        : "Email could not be sent.",
      data: {
        ...(emailResult.previewUrl && {
          previewUrl: emailResult.previewUrl,
        }),
        ...(!emailResult.sent && {
          verificationUrl,
        }),
      },
    });

  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

const getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        user: formatUser(req.user),
      },
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, bio, address } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      throw new AppError("User not found.", 404);
    }

    if (name !== undefined) {
      user.name = name;
    }

    if (bio !== undefined) {
      user.bio = bio;
    }

    if (address !== undefined) {
      user.address = address;
    }

    if (req.file) {
      user.profilePicture = req.file.path;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
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

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError("Email is required.", 400);
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
    }).select("+passwordResetToken +passwordResetExpires");

    // Security: Don't reveal whether the email exists
    if (!user) {
      return res.status(200).json({
        success: true,
        message:
          "If an account exists with this email, a password reset link has been sent.",
      });
    }

    const { token, hashedToken, expires } =
      generatePasswordResetToken();

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
        ? "Password reset email sent successfully."
        : "Email could not be sent.",
      data: {
        ...(emailResult.previewUrl && {
          previewUrl: emailResult.previewUrl,
        }),
        ...(!emailResult.sent && {
          resetUrl,
        }),
      },
    });

  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      throw new AppError("Reset token is required.", 400);
    }

    if (!password) {
      throw new AppError("New password is required.", 400);
    }

    if (password.length < 8) {
      throw new AppError(
        "Password must be at least 8 characters.",
        400
      );
    }

    const hashedToken = hashToken(token);

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: {
        $gt: Date.now(),
      },
    }).select(
      "+password +passwordResetToken +passwordResetExpires"
    );

    if (!user) {
      throw new AppError(
        "Invalid or expired reset token.",
        400
      );
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
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  resendVerification,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
};