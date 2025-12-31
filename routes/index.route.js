const router = require("express").Router();

const accountRouter = require("./account.route");
const dashboardRouter = require("./dashboard.route.js");

router.use("/account", accountRouter);
router.use("/dashboard", dashboardRouter);

module.exports = router;
