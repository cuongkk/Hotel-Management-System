module.exports.list = (req, res) => {
  res.render("pages/staff-list.pug", {
    pageTitle: "Quản lý nhân viên",
  });
};

module.exports.create = (req, res) => {
  res.render("pages/staff-create.pug", {
    pageTitle: "Thêm nhân viên",
  });
};
