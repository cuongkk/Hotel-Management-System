const router = require("express").Router();

const reportController = require("../controllers/report.controller.js");

router.get("/list", reportController.list);

module.exports = router;
