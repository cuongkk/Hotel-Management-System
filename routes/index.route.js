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

const authMiddleware = require("../middlewares/auth.middleware.js");

router.use("/account", accountRouter);
router.use("/dashboard", authMiddleware.verifyToken, dashboardRouter);
router.use("/room", authMiddleware.verifyToken, roomRouter);
router.use("/rental", authMiddleware.verifyToken, rentalRouter);
router.use("/report", authMiddleware.verifyToken, reportRouter);
router.use("/payment", authMiddleware.verifyToken, paymentRouter);
router.use("/admin", authMiddleware.verifyToken, adminRouter);
router.use("/staff", authMiddleware.verifyToken, staffRouter);
router.use("/profile", authMiddleware.verifyToken, profileRouter);

router.use(authMiddleware.verifyToken, (req, res) => {
  const token = req.cookies.token;
  if (token) {
    res.render("pages/error-404", {
      pageTitle: "Trang không tồn tại",
    });
  } else {
    res.redirect(`/account/login`);
  }
});

module.exports = router;
