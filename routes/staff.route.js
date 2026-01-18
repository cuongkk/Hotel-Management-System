const router = require("express").Router();
const staffController = require("../controllers/staff.controller.js");

router.get("/", staffController.list);

router.get("/find", staffController.find);

router.get("/create", staffController.create);

router.post("/create", staffController.createPost);

module.exports = router;
