const router = require("express").Router();

const roomController = require("../controllers/room.controller.js");

router.get("/list", roomController.list);

router.get("/create", roomController.create);

router.get("/detail", roomController.detail);

module.exports = router;
