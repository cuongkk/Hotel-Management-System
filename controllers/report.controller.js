const pool = require("../configs/database.config");

module.exports.listGetReport = async (req, res) => {
  try {
    let sqlForReceptions = `SELECT user_id, full_name FROM users WHERE role = 'STAFF'`;

    const resultForReceptions = await pool.query(sqlForReceptions);

    const resultReceptions = resultForReceptions.rows;

    const { roomType, receptions, roomName, dateFrom, dateTo } = req.query;
    console.log("Dữ liệu Freontend:", req.query);
    let sql = ` 
      SELECT 
        rs.rental_slip_id AS slip_code, 
        r.room_name, 
        rt.type_name AS room_type, 
        i.payer_name , 
        rs.snap_price AS final_price, 
        u.full_name AS receptionist, 
        rs.started_at AS paid_at 
      FROM rental_slips rs JOIN rooms r ON rs.room_id = r.room_id 
      JOIN invoices i ON i.rental_slip_id = rs.rental_slip_id
      JOIN room_types rt ON r.room_type_id = rt.room_type_id 
      LEFT JOIN rental_details rd ON rs.rental_slip_id = rd.rental_slip_id 
      LEFT JOIN users u ON rs.created_by = u.user_id 
      WHERE rs.status = 'COMPLETED' 
    `;

    const values = [];
    let idx = 1;

    if (roomType) {
      sql += ` AND rt.type_name = $${idx++}`;
      values.push(roomType);
    }
    if (receptions) {
      sql += ` AND u.full_name = $${idx++}`;
      values.push(receptions);
    }
    if (roomName) {
      sql += ` AND r.room_name ILIKE $${idx++}`;
      values.push(`%${roomName}%`);
    }
    if (dateFrom) {
      sql += ` AND rs.started_at >= $${idx++}`;
      values.push(dateFrom);
    }
    if (dateTo) {
      sql += ` AND rs.started_at <= $${idx++}`;
      values.push(dateTo);
    }

    sql += ` GROUP BY rs.rental_slip_id, r.room_name, rt.type_name, i.payer_name, rs.snap_price, u.full_name, rs.started_at 
            ORDER BY rs.rental_slip_id`;

    const result = await pool.query(sql, values);

    const reports = result.rows;

    console.log(reports);

    // Render view Pug và truyền dữ liệu xuống
    res.render("pages/report-list", {
      pageTitle: "Lập báo cáo",
      resultReceptions,
      reports,
    });
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).send("Server error");
  }
};
