module.exports.login = (req, res) => {
  res.render("pages/login.pug", {
    pageTitle: "Đăng nhập",
  });
};
