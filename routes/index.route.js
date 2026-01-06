const router = require("express").Router();

const accountRouter = require("./account.route");
const dashboardRouter = require("./dashboard.route.js");
const roomRouter = require("./room.route.js");
const rentalRouter = require("./rental.route.js");
const reportRouter = require("./report.route.js");
const paymentRouter = require("./payment.route.js");
const adminRouter = require("./admin.route.js");
const staffRouter = require("./staff.route.js");
const profileRouter = require("./profile.route.js");

router.use("/account", accountRouter);
router.use("/dashboard", dashboardRouter);
router.use("/room", roomRouter);
router.use("/rental", rentalRouter);
router.use("/report", reportRouter);
router.use("/payment", paymentRouter);
router.use("/admin", adminRouter);
router.use("/staff", staffRouter);
router.use("/profile", profileRouter);

module.exports = router;
