const router = require("express").Router();

const rentalController = require("../controllers/rental.controller.js");

console.log("Bắt đầu gọi controller")

router.get("/list", rentalController.list);

router.post("/create", rentalController.createPost);

router.get("/create", rentalController.createGet);

module.exports = router;
