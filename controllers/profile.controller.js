module.exports.viewProfile = (req, res) => {
  res.render("pages/profile.pug", {
    pageTitle: "Thông tin cá nhân",
  });
};

module.exports.changePassword = (req, res) => {
  res.render("pages/change-password.pug", {
    pageTitle: "Đổi mật khẩu",
  });
};
