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
router.use("/dashboard", authMiddleware.verifyToken, authMiddleware.requireRole("ADMIN", "MANAGER", "STAFF"), dashboardRouter);
router.use("/room", authMiddleware.verifyToken, authMiddleware.requireRole("MANAGER"), roomRouter);
router.use("/rental", authMiddleware.verifyToken, authMiddleware.requireRole("MANAGER", "STAFF"), rentalRouter);
router.use("/report", authMiddleware.verifyToken, authMiddleware.requireRole("MANAGER"), reportRouter);
router.use("/payment", authMiddleware.verifyToken, authMiddleware.requireRole("MANAGER", "STAFF"), paymentRouter);
router.use("/admin", authMiddleware.verifyToken, authMiddleware.requireRole("ADMIN", "MANAGER"), adminRouter);
router.use("/staff", authMiddleware.verifyToken, authMiddleware.requireRole("MANAGER"), staffRouter);
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
