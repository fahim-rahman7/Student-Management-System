const express = require("express");
const router = express.Router();
const classController = require("../../controllers/classController.js");
const { protect, requireVerifiedEmail, requireAdmin } = require("../../middleware/authMiddleware.js");


router.use(protect, requireAdmin, requireVerifiedEmail);


router.post("/create", classController.createClass);
router.get("/get", classController.getClasses);
router.patch("/update/:id", classController.updateClass);
router.delete("/delete/:id", classController.deleteClass);

module.exports = router;