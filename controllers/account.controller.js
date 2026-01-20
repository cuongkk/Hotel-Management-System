const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateHelper = require("../helpers/generate.helper.js");
const mailHelper = require("../helpers/mail.helper.js");

const userModel = require("../models/user.model");
const otpModel = require("../models/password-reset.model");

module.exports.login = (req, res) => {
  res.render("pages/login", { pageTitle: "Đăng nhập" });
};

module.exports.loginPost = async (req, res) => {
  try {
    const { username, password, rememberPassword } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({
        result: "error",
        message: "Thiếu username hoặc mật khẩu",
      });
    }

    if (!process.env.JWT_SECRET_KEY) {
      return res.status(500).json({
        result: "error",
        message: "JWT_SECRET_KEY chưa cấu hình",
      });
    }
    const existAccount = await userModel.findByUsername(username);
    if (!existAccount) {
      return res.status(401).json({
        result: "error",
        message: "Username không tồn tại trong hệ thống",
      });
    }

    if (!existAccount.is_active) {
      return res.status(403).json({
        result: "error",
        message: "Tài khoản chưa được kích hoạt",
      });
    }
    const ok = await bcrypt.compare(password, existAccount.password_hash);
    if (!ok) {
      return res.status(401).json({
        result: "error",
        message: "Mật khẩu không đúng",
      });
    }

    const token = jwt.sign(
      {
        user_id: existAccount.user_id,
        username: existAccount.username,
        role: existAccount.role,
        type: "auth",
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: rememberPassword ? "30d" : "7d" },
    );

    res.cookie("token", token, {
      maxAge: (rememberPassword ? 30 : 7) * 24 * 60 * 60 * 1000,
      httpOnly: true,
    });

    return res.json({
      result: "success",
      message: "Đăng nhập thành công",
    });
  } catch (err) {
    console.error("loginPost error:", err);
    return res.status(500).json({
      result: "error",
      message: "Internal Server Error",
      detail: err.message,
    });
  }
};

module.exports.forgotPassword = (req, res) => {
  res.render("pages/forgot-password", { pageTitle: "Quên mật khẩu" });
};

module.exports.forgotPasswordPost = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res.status(400).json({ result: "error", message: "Thiếu email" });
    }

    const existAccount = await userModel.findByEmail(email);
    if (!existAccount || !existAccount.is_active) {
      return res.json({ result: "error", message: "Email không tồn tại trong hệ thống" });
    }

    await otpModel.cleanupExpired();

    const existingOTP = await otpModel.findByEmail(email);
    if (existingOTP) {
      return res.json({
        result: "error",
        message: "Mã OTP đã được gửi. Vui lòng kiểm tra email của bạn.",
      });
    }

    const otpCode = String(generateHelper.generateRandomNumber(6));
    await otpModel.create({
      email,
      otp: otpCode,
      expire_at: new Date(Date.now() + 5 * 60 * 1000),
    });

    const subject = "Mã OTP đặt lại mật khẩu";
    const content = `Mã OTP của bạn là: <b>${otpCode}</b>. Mã có hiệu lực trong 5 phút.`;
    await mailHelper.sendMail(email, subject, content);

    return res.json({ result: "success", message: "Đã gửi mã OTP đến email của bạn" });
  } catch (err) {
    console.error("forgotPasswordPost error:", err);
    return res.status(500).json({ result: "error", message: "Internal Server Error", detail: err.message });
  }
};

module.exports.otpPassword = (req, res) => {
  res.render("pages/otp-password", { pageTitle: "Xác nhận OTP" });
};

module.exports.otpPasswordPost = async (req, res) => {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) {
      return res.status(400).json({ result: "error", message: "Thiếu email hoặc OTP" });
    }

    const record = await otpModel.findValid(email, otp);
    if (!record) {
      return res.json({ result: "error", message: "Mã OTP không đúng hoặc đã hết hạn" });
    }

    if (new Date(record.expire_at).getTime() < Date.now()) {
      await otpModel.deleteByEmail(email);
      return res.json({ result: "error", message: "Mã OTP đã hết hạn" });
    }

    await otpModel.deleteByEmail(email);

    const existAccount = await userModel.findByEmail(email);
    if (!existAccount) {
      return res.json({ result: "error", message: "Tài khoản không tồn tại" });
    }

    const token = jwt.sign({ user_id: existAccount.user_id, email: existAccount.email, type: "reset" }, process.env.JWT_SECRET_KEY, { expiresIn: "1h" });

    res.cookie("resetToken", token, {
      maxAge: 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "lax",
    });

    return res.json({ result: "success", message: "Xác thực OTP thành công" });
  } catch (err) {
    console.error("otpPasswordPost error:", err);
    return res.status(500).json({ result: "error", message: "Internal Server Error", detail: err.message });
  }
};

module.exports.resetPassword = (req, res) => {
  res.render("pages/reset-password", { pageTitle: "Đặt lại mật khẩu" });
};

module.exports.resetPasswordPost = async (req, res) => {
  try {
    const { password } = req.body || {};
    if (!password) {
      return res.status(400).json({ result: "error", message: "Thiếu mật khẩu mới" });
    }

    const { email, type } = req.account || {};
    if (!email || type !== "reset") {
      return res.status(401).json({ result: "error", message: "Token không hợp lệ hoặc không đúng mục đích" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await userModel.updatePasswordByEmail(email, hashedPassword);

    res.clearCookie("resetToken");
    return res.json({ result: "success", message: "Đặt lại mật khẩu thành công" });
  } catch (err) {
    console.error("resetPasswordPost error:", err);
    return res.status(500).json({ result: "error", message: "Internal Server Error", detail: err.message });
  }
};

module.exports.logout = (req, res) => {
  res.clearCookie("token");
  res.redirect(`/account/login`);
};
