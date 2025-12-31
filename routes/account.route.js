const router = require("express").Router();

const accountController = require("../controllers/account.controller.js");

router.get("/login", accountController.login);

module.exports = router;
