// module.exports.list = (req, res) => {
//   res.render("pages/report-list.pug", {
//     pageTitle: "Lập báo cáo",
//   });
// };

module.exports.list = (req, res) => {
  console.log("Gọi controller")
  const { roomType, receptions, dateFrom, dateTo } = req.query;

  console.log(roomType, receptions, dateFrom, dateTo)

  // Render view Pug và truyền dữ liệu xuống
  res.render("pages/report-list", {
    pageTitle: "Lập báo cáo",
  });
};
