const router = require("express").Router();

const roomController = require("../controllers/room.controller.js");

router.get("/", roomController.list);

router.get("/create", roomController.showCreate);

router.post("/create", roomController.create);

router.get("/detail/:id", roomController.detail);

router.get("/update/:id", roomController.showEdit);

router.put("/update/:id", roomController.update);

router.post("/delete/:id", roomController.delete);

module.exports = router;
