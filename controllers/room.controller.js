const pool = require("../configs/database.config");

exports.list = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT room_id, room_name, room_type_id, status FROM rooms ORDER BY room_id ASC"
    );
    res.render("pages/room-list.pug", {
      pageTitle: "Quản lý phòng",
      rooms: result.rows
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Database error"
    });
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

    res.redirect("/room");
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
};

exports.showUpdate = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      "SELECT * FROM rooms WHERE room_id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).send("Room not found");
    }

    res.render("pages/room-update.pug", {
      pageTitle: "Cập nhật phòng",
      room: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
};

exports.update = async (req, res) => {
  console.log(">>> UPDATE CONTROLLER HIT <<<");
  console.log("METHOD:", req.method);
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

  try {
    const result = await pool.query(
      "DELETE FROM rooms WHERE room_id = $1",
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
