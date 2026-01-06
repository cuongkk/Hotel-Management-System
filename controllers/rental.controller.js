module.exports.list = (req, res) => {
  res.render("pages/rental-list.pug", {
    pageTitle: "Quản lý thuê phòng",
  });
};

module.exports.create = (req, res) => {
  res.render("pages/rental-create.pug", {
    pageTitle: "Lập phiếu thuê phòng",
  });
};

module.exports.detail = (req, res) => {
  res.render("pages/rental-detail.pug", {
    pageTitle: "Xem hóa đơn",
  });
};
