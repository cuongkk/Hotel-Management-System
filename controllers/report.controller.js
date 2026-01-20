const pool = require("../configs/database.config");

module.exports.listGetReport = async (req, res) => {
  try {
    const { roomType, roomName, endDate, startDate } = req.query;

    // if (!startDate) {
    //   return res
    //     .status(400)
    //     .json({ result: "error", message: "Chưa nhập ngày bắt đầu" });
    // }
    // if (!endDate) {
    //   return res
    //     .status(400)
    //     .json({ result: "error", message: "Chưa nhập ngày kết thúc" });
    // }

    let sql = `
      SELECT 
        DATE_TRUNC('month', rs.started_at) AS month,
    `;

    const values = [];
    let idx = 1;

    if (roomType) {
      // Nếu nhập mã phòng → tính doanh
      sql += ` SUM(i.total_amount) AS total_revenue `;
    } else if (roomName) {
      // Nếu nhập tên phòng → tính tổng ngày thuê
      sql += ` SUM(i.total_days) AS total_days `;
    } else {
      // Mặc định → doanh thu
      sql += ` SUM(i.total_amount) AS total_revenue `;
    }

    sql += `
      FROM rental_slips rs
      JOIN rooms r ON rs.room_id = r.room_id
      JOIN room_types rt ON r.room_type_id = rt.room_type_id
      LEFT JOIN invoices i ON rs.rental_slip_id = i.rental_slip_id
      WHERE rs.status = 'COMPLETED'
    `;

    if (startDate && endDate) {
      sql += ` AND rs.started_at BETWEEN $${idx++} AND $${idx++}`;
      values.push(startDate, endDate);
    } else {
      sql += ` AND rs.started_at BETWEEN CURRENT_DATE - INTERVAL '1 year' AND CURRENT_DATE`;
    }

    if (roomType) {
      sql += ` AND rt.type_name = $${idx++}`;
      values.push(roomType);
    }
    if (roomName) {
      sql += ` AND r.room_name ILIKE $${idx++}`;
      values.push(`%${roomName}%`);
    }

    sql += ` GROUP BY DATE_TRUNC('month', rs.started_at)
             ORDER BY DATE_TRUNC('month', rs.started_at);`;

    const result = await pool.query(sql, values);
    const reports = result.rows;

    res.render("pages/report-list", {
      pageTitle: "Lập báo cáo",
      roomType,
      roomName,
      reports,
      reportsJson: JSON.stringify(reports),
    });
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).send("Server error");
  }
};
