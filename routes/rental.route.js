const router = require("express").Router();

const rentalController = require("../controllers/rental.controller.js");

router.get("/", rentalController.list);

router.post("/create", rentalController.createPost);

router.get("/create", rentalController.createGet);

module.exports = router;
