module.exports.create = (req, res) => {
  res.render("pages/payment-create.pug", {
    pageTitle: "Tạo hóa đơn thanh toán",
  });
};

module.exports.detail = (req, res) => {
  res.render("pages/payment-detail.pug", {
    pageTitle: "Xem hóa đơn",
  });
};
