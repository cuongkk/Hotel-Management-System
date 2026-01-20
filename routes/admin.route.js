const router = require("express").Router();

const adminController = require("../controllers/admin.controller.js");

router.get("/", adminController.setting);

router.post("/setting", adminController.updateSetting);

router.delete("/customer-type/:id", adminController.deleteCustomerType);

router.delete("/room-type/:id", adminController.deleteRoomType);

module.exports = router;
