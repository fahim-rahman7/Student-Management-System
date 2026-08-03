const Notice = require("../models/Notice");
const mongoose = require("mongoose");
const { AppError } = require("../helpers/utils");


const createNotice = async (req, res) => {
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);
  try {
    const {
      title,
      noticeContent,
      audience,
      isPinned,
      isActive,
      expiresAt,
    } = req.body;

    if (!title) {
      throw new AppError("Notice title is required.", 400);
    }

    if (!noticeContent) {
      throw new AppError("Notice content is required.", 400);
    }

    const newNotice = await Notice.create({
      creatorId: req.user._id,
      title,
      noticeContent,
      noticeImg: req.file?.path || "",
      audience,
      isPinned,
      isActive,
      expiresAt,
    });

    return res.status(201).json({
      success: true,
      message: "Notice created successfully.",
      data: newNotice,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};


const getAllNotice = async (req, res) => {
  try {
    const notices = await Notice.find()
      .populate("creatorId", "name email profilePicture")
      .populate("likes", "name profilePicture")
      .sort({
        isPinned: -1,
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      message: "All notices fetched successfully.",
      total: notices.length,
      data: notices,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};


const getSingleNotice = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid Notice ID.", 400);
    }

    const notice = await Notice.findById(id)
      .populate("creatorId", "name email profilePicture")
      .populate("likes", "name profilePicture");

    if (!notice) {
      throw new AppError("Notice not found.", 404);
    }

    return res.status(200).json({
      success: true,
      data: notice,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};


const updateNotice = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid Notice ID.", 400);
    }

    const notice = await Notice.findById(id);

    if (!notice) {
      throw new AppError("Notice not found.", 404);
    }

    const {
      title,
      noticeContent,
      audience,
      isPinned,
      isActive,
      expiresAt,
    } = req.body;

    if (title !== undefined) {
      notice.title = title;
    }

    if (noticeContent !== undefined) {
      notice.noticeContent = noticeContent;
    }

    if (audience !== undefined) {
      notice.audience = audience;
    }

    if (isPinned !== undefined) {
      notice.isPinned = isPinned;
    }

    if (isActive !== undefined) {
      notice.isActive = isActive;
    }

    if (expiresAt !== undefined) {
      notice.expiresAt = expiresAt;
    }

    if (req.file) {
      notice.noticeImg = req.file.path;
    }

    await notice.save();

    return res.status(200).json({
      success: true,
      message: "Notice updated successfully.",
      data: notice,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};


const deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid Notice ID.", 400);
    }

    const notice = await Notice.findByIdAndDelete(id);

    if (!notice) {
      throw new AppError("Notice not found.", 404);
    }

    return res.status(200).json({
      success: true,
      message: "Notice deleted successfully.",
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};


const toggleLikeNotice = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new AppError("Invalid Notice ID.", 400);
    }

    const notice = await Notice.findById(id);

    if (!notice) {
      throw new AppError("Notice not found.", 404);
    }

    const userId = req.user._id.toString();

    const alreadyLiked = notice.likes.some(
      (like) => like.toString() === userId
    );

    if (alreadyLiked) {
      notice.likes = notice.likes.filter(
        (like) => like.toString() !== userId
      );
    } else {
      notice.likes.push(req.user._id);
    }

    await notice.save();

    return res.status(200).json({
      success: true,
      message: alreadyLiked
        ? "Notice unliked successfully."
        : "Notice liked successfully.",
      totalLikes: notice.likes.length,
      data: notice,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createNotice,
  getAllNotice,
  getSingleNotice,
  updateNotice,
  deleteNotice,
  toggleLikeNotice,
};