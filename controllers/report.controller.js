const pool = require("../configs/database.config");
const roomModel = require("../models/room.model");

module.exports.listGetReport = async (req, res) => {
  try {
    const { roomType, roomName, endDate, startDate } = req.query;

    const roomTypesList = await roomModel.getAllRoomTypes();

    if ((startDate && !endDate) || (!startDate && endDate)) {
      return res.status(400).json({
        result: "error",
        message: !endDate ? "Vui lòng nhập ngày kết thúc" : "Vui lòng nhập ngày bắt đầu",
      });
    }

    if (!startDate && !endDate) {
      const values = [];
      let idx = 1;

      const metricSelect = roomName ? "COALESCE(SUM(i.total_days), 0) AS total_days" : "COALESCE(SUM(i.total_amount), 0) AS total_revenue";

      let sql = `
        WITH months AS (
          SELECT generate_series(
            date_trunc('month', now()) - interval '4 months',
            date_trunc('month', now()),
            interval '1 month'
          ) AS month
        )
        SELECT
          m.month,
          ${metricSelect}
        FROM months m
        LEFT JOIN invoices i
          ON date_trunc('month', i.payment_date) = m.month
        LEFT JOIN rental_slips rs
          ON rs.rental_slip_id = i.rental_slip_id
          AND rs.status = 'COMPLETED'
        LEFT JOIN rooms r ON rs.room_id = r.room_id
        LEFT JOIN room_types rt ON r.room_type_id = rt.room_type_id
        WHERE 1=1
      `;

      if (roomType) {
        sql += ` AND rt.type_name = $${idx++}`;
        values.push(roomType);
      }
      if (roomName) {
        sql += ` AND r.room_name ILIKE $${idx++}`;
        values.push(`%${roomName}%`);
      }

      sql += `
        GROUP BY m.month
        ORDER BY m.month;
      `;

      const result = await pool.query(sql, values);
      const reports = result.rows;

      return res.render("pages/report-list", {
        pageTitle: "Lập báo cáo",
        roomType,
        roomName,
        roomTypesList,
        reports,
        reportsJson: JSON.stringify(reports),
      });
    }

    const values = [];
    let idx = 1;

    const metricSelect = roomName ? "COALESCE(SUM(i.total_days), 0) AS total_days" : "COALESCE(SUM(i.total_amount), 0) AS total_revenue";

    let sql = `
      WITH months AS (
        SELECT generate_series(
          date_trunc('month', $${idx++}::date),
          date_trunc('month', $${idx++}::date),
          interval '1 month'
        ) AS month
      )
      SELECT
        m.month,
        ${metricSelect}
      FROM months m
      LEFT JOIN invoices i
        ON date_trunc('month', i.payment_date) = m.month
        AND i.payment_date >= $${idx++}::date
        AND i.payment_date <  ($${idx++}::date + interval '1 day')
      LEFT JOIN rental_slips rs
        ON rs.rental_slip_id = i.rental_slip_id
        AND rs.status = 'COMPLETED'
      LEFT JOIN rooms r ON rs.room_id = r.room_id
      LEFT JOIN room_types rt ON r.room_type_id = rt.room_type_id
      WHERE 1=1
    `;

    values.push(startDate, endDate);

    values.push(startDate, endDate);

    if (roomType) {
      sql += ` AND rt.type_name = $${idx++}`;
      values.push(roomType);
    }
    if (roomName) {
      sql += ` AND r.room_name ILIKE $${idx++}`;
      values.push(`%${roomName}%`);
    }

    sql += `
      GROUP BY m.month
      ORDER BY m.month;
    `;

    const result = await pool.query(sql, values);
    const reports = result.rows;

    return res.render("pages/report-list", {
      pageTitle: "Lập báo cáo",
      roomType,
      roomName,
      roomTypesList,
      reports,
      reportsJson: JSON.stringify(reports),
    });
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).send("Server error");
  }
};
