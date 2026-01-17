const pool = require("../configs/database.config");

module.exports.listGetReport = async (req, res) => {
  try {

    const { roomType, roomName} = req.query;
    let sql = ` 
      SELECT 
        DATE_TRUNC('month', rs.started_at) AS month,
        rt.type_name AS room_type,
        r.room_name AS room_name,
        SUM(rs.snap_price) AS total_revenue 
      FROM rental_slips rs
      JOIN rooms r ON rs.room_id = r.room_id
      JOIN room_types rt ON r.room_type_id = rt.room_type_id
      WHERE rs.status = 'COMPLETED' AND rs.started_at BETWEEN CURRENT_DATE - INTERVAL '1 year' AND CURRENT_DATE
    `;

    const values = [];
    let idx = 1;

    if (roomType) {
      sql += ` AND rt.type_name = $${idx++}`;
      values.push(roomType);
    }
    if (roomName) {
      sql += ` AND r.room_name ILIKE $${idx++}`;
      values.push(`%${roomName}%`);
    }

    sql += ` GROUP BY month, rt.type_name, r.room_name
            ORDER BY month;`;

    const result = await pool.query(sql, values);

    const reports = result.rows;


    // Render view Pug và truyền dữ liệu xuống
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
