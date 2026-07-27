const express = require("express");
const router = express.Router();
const classController = require("../../controllers/classController.js");
const { protect, requireVerifiedEmail, requireAdmin } = require("../../middleware/authMiddleware.js");


router.use(protect, requireAdmin, requireVerifiedEmail);


router.post("/create", classController.createClass);
// router.get("/get", subjectController.getSubject);
// router.delete("/delete/:id", subjectController.deleteSubject);

module.exports = router;