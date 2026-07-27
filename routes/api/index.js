const express = require("express");
const router = express.Router();

const auth = require("./auth.js");
const admin = require("./admin.js");
const subject = require("./subject.js");

router.use("/auth", auth);
router.use("/admin", admin);
router.use("/subject", subject);



module.exports = router;
