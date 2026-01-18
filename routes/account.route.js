const router = require("express").Router();

const accountController = require("../controllers/account.controller.js");
const authMiddleware = require("../middlewares/auth.middleware.js");

router.get("/login", accountController.login);

router.post("/login", accountController.loginPost);

router.get("/forgot-password", accountController.forgotPassword);

router.post("/forgot-password", accountController.forgotPasswordPost);

router.get("/otp-password", accountController.otpPassword);

router.post("/otp-password", accountController.otpPasswordPost);

router.get("/reset-password", accountController.resetPassword);

router.post("/reset-password", authMiddleware.verifyResetToken, accountController.resetPasswordPost);

router.get("/logout", accountController.logout);

module.exports = router;
