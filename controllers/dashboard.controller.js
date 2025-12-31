module.exports.dashboard = (req, res) => {
  res.render("pages/dashboard.pug", {
    pageTitle: "Tổng quan",
  });
};
