const express = require("express");
const router = express.Router();
const upload = require("../../middleware/fileUpload");
const noticeController = require("../../controllers/noticeController");
const {
  protect,
  requireVerifiedEmail,
  requireAdmin,
} = require("../../middleware/authMiddleware");

router.get("/get", noticeController.getAllNotice);
router.get("/:id", noticeController.getSingleNotice);

router.use(protect, requireVerifiedEmail);

router.post("/create", requireAdmin,  upload.single("noticeImg"), noticeController.createNotice);

router.patch("/update/:id", requireAdmin,  upload.single("noticeImg"), noticeController.updateNotice);

router.delete("/delete/:id", requireAdmin, noticeController.deleteNotice);

router.patch("/like/:id", noticeController.toggleLikeNotice);

module.exports = router;