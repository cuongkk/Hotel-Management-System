const router = require("express").Router();

const reportController = require("../controllers/report.controller.js");

console.log("Chạy tới route report")


console.log("bắt đầu chạy tới controller")


router.get("/list", reportController.listGetReport);



module.exports = router;
