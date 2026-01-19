const pool = require("../configs/database.config");

exports.list = async (req, res) => {
  try {
    // ===== 1. Lấy filter & pagination từ query =====
    const { roomName, status, roomType } = req.query;
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10;

    // ===== 2. SQL chính =====
    let sql = `
      SELECT
        r.room_id,
        r.room_name,
        r.status,
        r.note,
        rt.room_type_id,
        rt.type_name AS room_type,
        rt.max_guests,
        rt.base_price
      FROM rooms r
      LEFT JOIN room_types rt 
        ON r.room_type_id = rt.room_type_id
      WHERE 1=1 AND r.status != 'REMOVED'
    `;

    const values = [];
    let idx = 1;

    // ===== 3. Filter động =====
    if (roomName) {
      sql += ` AND r.room_name ILIKE $${idx++}`;
      values.push(`%${roomName}%`);
    }

    if (status) {
      sql += ` AND r.status = $${idx++}::room_status`;
      values.push(status);
    }

    if (roomType) {
      sql += ` AND rt.type_name = $${idx++}`;
      values.push(roomType);
    }

    // ===== 4. Pagination =====
    sql += ` ORDER BY r.room_id ASC LIMIT $${idx++} OFFSET $${idx++}`;
    values.push(pageSize, (page - 1) * pageSize);

    const result = await pool.query(sql, values);

    // ===== 5. Query COUNT =====
    let countSql = `
      SELECT COUNT(*)
      FROM rooms r
      LEFT JOIN room_types rt 
        ON r.room_type_id = rt.room_type_id
      WHERE 1=1 AND r.status != 'REMOVED'
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

    // ===== 6. Render =====
    res.render("pages/room-list.pug", {
      pageTitle: "Quản lý phòng",
      rooms: result.rows,
      filters: { roomName, status, roomType },
      page,
      pageSize,
      total,
      totalPages
    });

  } catch (error) {
    console.error("DB error:", error);
    res.status(500).send("Server error");
  }
};


exports.showCreate = (req, res) => {
  res.render("pages/room-create.pug", {
    pageTitle: "Tạo phòng mới"
  });
};

exports.create = async (req, res) => {
  const { room_id, room_name, room_type_id, status, note } = req.body;

  if (!room_id || !room_name) {
    return res.status(400).send("Missing required fields");
  }

  try {
    await pool.query(
      `INSERT INTO rooms (room_id, room_name, room_type_id, status, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [room_id, room_name, room_type_id, status, note]
    );

    res.redirect("/rooms");
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
};


exports.showUpdate = async (req, res) => {
  const { id } = req.params;

  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT
        r.room_id,
        r.room_name,
        r.status,
        r.note,
        r.room_type_id,

        rt.type_name   AS room_type,
        rt.base_price  AS base_price,
        rt.max_guests  AS max_guests
      FROM rooms r
      LEFT JOIN room_types rt
        ON r.room_type_id = rt.room_type_id
      WHERE r.room_id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).send("Room not found");
    }

    res.render("pages/room-update", {
      pageTitle: "Cập nhật phòng",
      room: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const { room_name, room_type_id, status, note } = req.body;

  try {
    const result = await pool.query(
      `UPDATE rooms
       SET room_name = $1,
           room_type_id = $2,
           status = $3,
           note = $4
       WHERE room_id = $5`,
      [room_name, room_type_id, status, note, id]
    );

    if (result.rowCount === 0) {
      return res.status(404).send("Room not found");
    }

    res.redirect("/room");
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
};

exports.delete = async (req, res) => {
  const { id } = req.params;
  console.log("DELETE ROOM ID =", req.params.id);
  try {
    const result = await pool.query(
      "UPDATE rooms SET status = 'REMOVED' WHERE room_id = $1",
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).send("Room not found");
    }

    res.redirect("/room");
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
};
