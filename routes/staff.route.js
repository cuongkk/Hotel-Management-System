const router = require("express").Router();

const staffController = require("../controllers/staff.controller.js");

router.get("/list", staffController.list);

router.get("/create", staffController.create);

module.exports = router;
