const router = require("express").Router();

const rentalController = require("../controllers/rental.controller.js");

router.get("/list", rentalController.list);

router.get("/create", rentalController.create);

module.exports = router;
