module.exports.list = (req, res) => {
  res.render("pages/report-list.pug", {
    pageTitle: "Lập báo cáo",
  });
};
