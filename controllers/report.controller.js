// module.exports.list = (req, res) => {
//   res.render("pages/report-list.pug", {
//     pageTitle: "Lập báo cáo",
//   });
// };

module.exports.list = (req, res) => {
  const { roomType, receptions, dateFrom, dateTo } = req.query;

  // Render view Pug và truyền dữ liệu xuống
  res.render("pages/report-list", {
    pageTitle: "Lập báo cáo",
  });
};
