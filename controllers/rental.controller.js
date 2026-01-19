const pool = require("../configs/database.config");
const db = require("../configs/database.config");

module.exports.list = async (req, res) => {
  try {
    const { roomName, status, roomType } = req.query;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    let sqlForRental = `
			SELECT
				r.room_id,
				r.room_name,
				rt.type_name AS room_type,
				rt.max_guests AS max_guest,
				rt.base_price AS price,
				r.status,
				CASE
					WHEN r.status = 'OCCUPIED' THEN u.full_name
					ELSE NULL
				END AS eceptionis
			FROM rooms r
			LEFT JOIN room_types rt ON r.room_type_id = rt.room_type_id
			LEFT JOIN LATERAL (
				SELECT rs.created_by, rs.started_at
				FROM rental_slips rs
				WHERE rs.room_id = r.room_id
				ORDER BY rs.started_at DESC
				LIMIT 1
			) last_rs ON TRUE
			LEFT JOIN users u ON u.user_id = last_rs.created_by
			WHERE 1=1
		`;

    const values = [];
    let idx = 1;

    if (roomName) {
      sqlForRental += ` AND r.room_name ILIKE $${idx++}`;
      values.push(`%${roomName}%`);
    }
    if (status) {
      sqlForRental += ` AND r.status = $${idx++}::room_status`;
      values.push(status);
    }
    if (roomType) {
      sqlForRental += ` AND rt.type_name = $${idx++}`;
      values.push(roomType);
    }

    sqlForRental += ` ORDER BY r.room_id LIMIT $${idx++} OFFSET $${idx++}`;
    values.push(pageSize, (page - 1) * pageSize);

    const result = await pool.query(sqlForRental, values);

    let countSql = `
      SELECT COUNT(*) 
      FROM rooms r
      LEFT JOIN room_types rt ON r.room_type_id = rt.room_type_id
      WHERE 1=1
    `;
    const countValues = [];
    let cIdx = 1;
    if (roomName) {
      countSql += ` AND r.room_name ILIKE $${cIdx++}`;
      countValues.push(`%${roomName}%`);
    }
    if (status) {
      countSql += ` AND r.status = $${cIdx++}::room_status`;
      countValues.push(status);
    }
    if (roomType) {
      countSql += ` AND rt.type_name = $${cIdx++}`;
      countValues.push(roomType);
    }

    const countResult = await pool.query(countSql, countValues);
    const total = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(total / pageSize);

    res.render("pages/rental-list", {
      pageTitle: "Quản lý thuê phòng",
      rooms: result.rows,
      filters: { roomName, status, roomType },
      page,
      pageSize,
      total,
      totalPages,
    });
  } catch (err) {
    console.error("DB error:", err);
    res.status(500).send("Server error");
  }
};

module.exports.createPost = async (req, res) => {
  const client = await db.pool.connect();
  try {
    const { roomId, startDate, customers } = req.body;

    if (!roomId || !startDate || !Array.isArray(customers) || customers.length === 0) {
      return res.status(400).json({ result: "error", message: "Dữ liệu không hợp lệ" });
    }

    await client.query("BEGIN");

    const roomRes = await client.query(
      `SELECT r.room_id, r.status, rt.base_price, rt.max_guests
       FROM rooms r
       JOIN room_types rt ON rt.room_type_id = r.room_type_id
       WHERE r.room_id = $1`,
      [roomId],
    );

    if (roomRes.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ result: "error", message: "Không tìm thấy phòng" });
    }

    const room = roomRes.rows[0];
    if (room.status !== "AVAILABLE") {
      await client.query("ROLLBACK");
      return res.status(400).json({ result: "error", message: "Phòng không ở trạng thái AVAILABLE" });
    }

    const ruleRes = await client.query("SELECT ratio, extra_guest_threshold FROM surcharge_rules WHERE rule_id = $1", [1]);
    if (ruleRes.rowCount === 0) {
      throw new Error("Chưa cấu hình surcharge_rules (rule_id=1)");
    }
    const rule = ruleRes.rows[0];

    const hasForeign = customers.some((c) => c.type === "FOR");
    const snapCoefficient = hasForeign ? 1.5 : 1.0;

    const insertSlip = `
      INSERT INTO rental_slips (
        room_id, created_by, started_at, status,
        snap_price, snap_max_guests,
        snap_surcharge_coefficient, snap_extra_guest_threshold, snap_surcharge_ratio
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      RETURNING rental_slip_id
    `;

    const slipResult = await client.query(insertSlip, [
      roomId,
      req.account.user_id,
      startDate,
      "ACTIVE",
      room.base_price, // snap_price = giá gốc
      room.max_guests, // snap_max_guests = max của phòng
      snapCoefficient, // hệ số theo loại khách
      rule.extra_guest_threshold,
      rule.ratio,
    ]);

    const rentalSlipId = slipResult.rows[0].rental_slip_id;
    for (const c of customers) {
      const check = await client.query("SELECT customer_id FROM customers WHERE identity_card = $1", [c.idCard]);

      let customerId;
      if (check.rowCount > 0) {
        customerId = check.rows[0].customer_id;
      } else {
        const customerTypeId = c.type === "FOR" ? "CT002" : "CT001";

        const custResult = await client.query(
          `INSERT INTO customers (full_name, identity_card, address, phone_number, customer_type_id)
           VALUES ($1,$2,$3,$4,$5)
           RETURNING customer_id`,
          [c.name, c.idCard, c.address || null, c.phone, customerTypeId],
        );
        customerId = custResult.rows[0].customer_id;
      }

      await client.query("INSERT INTO rental_details (rental_slip_id, customer_id) VALUES ($1, $2)", [rentalSlipId, customerId]);
    }

    await client.query("UPDATE rooms SET status = $1 WHERE room_id = $2", ["OCCUPIED", roomId]);

    await client.query("COMMIT");
    return res.json({ result: "success", message: "Tạo phiếu thuê phòng thành công", rentalSlipId });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("DB error:", err);
    return res.status(500).json({ result: "error", message: err.message || "Server error" });
  } finally {
    client.release();
  }
};

module.exports.createGet = async (req, res) => {
  try {
    const { roomId } = req.query;

    const sql = ` 
      SELECT 
        r.room_id AS room_id, 
        r.room_name, 
        rt.type_name AS room_type, 
        rt.base_price AS price, 
        rt.max_guests 
      FROM rooms r LEFT JOIN room_types rt ON r.room_type_id = rt.room_type_id 
      WHERE r.room_id = $1 
    `;

    const result = await pool.query(sql, [roomId]);

    const room = result.rows[0];
    res.render("pages/rental-create", {
      pageTitle: "Lập phiếu thuê phòng",
      room,
    });
  } catch (error) {
    res.status(500).send("Server error");
  }
};
