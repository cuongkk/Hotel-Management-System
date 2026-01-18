const router = require("express").Router();

const profileController = require("../controllers/profile.controller.js");

router.get("/", profileController.view);

router.patch("/", profileController.update);

// router.get("/change-password", profileController.changePassword);

module.exports = router;
