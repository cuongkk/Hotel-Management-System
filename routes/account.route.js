const router = require("express").Router();

const accountController = require("../controllers/account.controller.js");

router.get("/login", accountController.login);

router.post("/login", accountController.loginPost);

router.get("/forgotPassword", accountController.forgotPassword);

router.get("/otpPassword", accountController.otpPassword);

router.get("/resetPassword", accountController.resetPassword);

router.get("/logout", accountController.logout);

module.exports = router;
