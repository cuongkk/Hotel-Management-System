const pool = require("../configs/database.config");
const roomModel = require("../models/room.model");

module.exports.list = async (req, res, next) => {
  try {
    const page = req.query.page || 1;
    const pageSize = req.query.pageSize || 10;

    const q = req.query.roomName || "";
    const status = req.query.status || "";
    const roomType = req.query.roomType || "";

    const result = await roomModel.findRoomPaged({
      q,
      status,
      roomType,
      page,
      pageSize,
    });

    const roomTypesList = await roomModel.getAllRoomTypes();

    res.render("pages/room-list.pug", {
      pageTitle: "Quản lý phòng",

      rooms: result.rows,

      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      totalPages: result.totalPages,

      filters: {
        roomName: q,
        status: status,
        roomType: roomType,
      },

      roomTypesList: roomTypesList,
    });
  } catch (err) {
    next(err);
  }
};

exports.showCreate = (req, res) => {
  res.render("pages/room-create.pug", {
    pageTitle: "Tạo phòng mới",
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
      [room_id, room_name, room_type_id, status, note],
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

    const result = await pool.query(
      `
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
    `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).send("Room not found");
    }

    res.render("pages/room-update", {
      pageTitle: "Cập nhật phòng",
      room: result.rows[0],
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
      [room_name, room_type_id, status, note, id],
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
