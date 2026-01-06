const router = require("express").Router();

const profileController = require("../controllers/profile.controller.js");

router.get("/", profileController.viewProfile);

router.get("/change-password", profileController.changePassword);

module.exports = router;
