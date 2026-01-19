const router = require("express").Router();

const reportController = require("../controllers/report.controller.js");

router.get("/", reportController.listGetReport);


module.exports = router;
