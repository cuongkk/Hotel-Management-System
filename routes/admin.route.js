const router = require("express").Router();

const adminController = require("../controllers/admin.controller.js");

router.get("/", adminController.setting);

router.post("/setting", adminController.updateSetting);

module.exports = router;
