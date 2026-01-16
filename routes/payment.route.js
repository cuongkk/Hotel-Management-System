const router = require("express").Router();

const paymentController = require("../controllers/payment.controller.js");

router.get("/:room_id", paymentController.payment);

router.post("/:room_id", paymentController.processPayment);

router.get("/:room_id/success", paymentController.success);

router.get("/:room_id/failed", paymentController.failed);

module.exports = router;
