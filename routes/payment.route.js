const router = require("express").Router();

const paymentController = require("../controllers/payment.controller.js");

router.get("/create", paymentController.create);

router.get("/detail", paymentController.detail);

module.exports = router;
