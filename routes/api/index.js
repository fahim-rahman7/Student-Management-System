const express = require("express");
const router = express.Router();

const auth = require("./auth.js");
const admin = require("./admin.js");

router.use("/auth", auth);
router.use("/admin", admin);



module.exports = router;
