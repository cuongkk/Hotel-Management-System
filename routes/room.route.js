const router = require("express").Router();

const roomController = require("../controllers/room.controller.js");

router.get("/", roomController.list);

router.get("/create", roomController.showCreate);

router.post("/create", roomController.create);

router.get("/update/:id", roomController.showUpdate);

router.post("/update/:id", roomController.update);

module.exports = router;
