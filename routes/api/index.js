const express = require("express");
const router = express.Router();

const auth = require("./auth.js");
const admin = require("./admin.js");
const subject = require("./subject.js");
const classRoute = require("./class.js")
const noticeRoute = require("./notice.js")

router.use("/auth", auth);
router.use("/admin", admin);
router.use("/subject", subject);
router.use("/class", classRoute);
router.use("/notice", noticeRoute);



module.exports = router;
