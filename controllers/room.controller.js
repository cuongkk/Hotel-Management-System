module.exports.list = (req, res) => {
  res.render("pages/room-list.pug", {
    pageTitle: "Quản lý phòng",
  });
};

module.exports.create = (req, res) => {
  res.render("pages/room-create.pug", {
    pageTitle: "Tạo phòng mới",
  });
};

module.exports.detail = (req, res) => {
  res.render("pages/room-detail.pug", {
    pageTitle: "Chi tiết phòng",
  });
};
