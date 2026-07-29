const express = require("express");
const router = express.Router();
const subjectController = require("../../controllers/subjectController.js");
const { protect, requireVerifiedEmail, requireAdmin } = require("../../middleware/authMiddleware.js");


router.use(protect, requireAdmin, requireVerifiedEmail);


router.post("/create", subjectController.createSubject);
router.get("/get", subjectController.getSubject);
router.patch("/update/:id", subjectController.updateSubject);
router.delete("/delete/:id", subjectController.deleteSubject);

module.exports = router;