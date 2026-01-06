module.exports.login = (req, res) => {
  res.render("pages/login.pug", {
    pageTitle: "Đăng nhập",
  });
};

module.exports.forgotPassword = (req, res) => {
  res.render("pages/forgot-password.pug", {
    pageTitle: "Quên mật khẩu",
  });
};

module.exports.otpPassword = (req, res) => {
  res.render("pages/otp-password.pug", {
    pageTitle: "Xác nhận OTP",
  });
};

module.exports.resetPassword = (req, res) => {
  res.render("pages/reset-password.pug", {
    pageTitle: "Đặt lại mật khẩu",
  });
};
