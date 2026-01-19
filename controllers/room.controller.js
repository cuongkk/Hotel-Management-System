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

module.exports.showCreate = async (req, res) => {
  try {
    const rawRoomTypes = await roomModel.getAllRoomTypes();
    const roomTypesList = rawRoomTypes.rows ? rawRoomTypes.rows : rawRoomTypes;

    res.render("pages/room-create", {
      pageTitle: "Thêm phòng mới",
      roomTypesList: roomTypesList,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

module.exports.generateNextRoomId = async () => {
  // 1. Lấy room_id lớn nhất hiện tại (Sắp xếp giảm dần)
  const query = "SELECT room_id FROM rooms ORDER BY room_id DESC LIMIT 1";
  const result = await pool.query(query);

  let nextId = "R0001"; // Giá trị mặc định nếu bảng rỗng

  if (result.rows.length > 0) {
    const lastId = result.rows[0].room_id; // Ví dụ: "R0030"

    // 2. Tách phần số: Bỏ chữ "R", lấy "0030" -> chuyển thành số 30
    const currentNumber = parseInt(lastId.replace("R", ""), 10);

    // 3. Tăng lên 1
    const nextNumber = currentNumber + 1;

    // 4. Format lại thành chuỗi 4 chữ số (pad zero) -> "0031"
    // padStart(4, '0') nghĩa là nếu thiếu thì điền số 0 vào trước cho đủ 4 ký tự
    nextId = `R${nextNumber.toString().padStart(4, "0")}`;
  }

  return nextId;
};

module.exports.createRoom = async (data) => {
  const { room_id, room_name, room_type_id, note } = data;
  const query = `
      INSERT INTO rooms (room_id, room_name, room_type_id, status, note)
      VALUES ($1, $2, $3, 'AVAILABLE', $4)
    `;
  return await pool.query(query, [room_id, room_name, room_type_id, note]);
};

exports.create = async (req, res) => {
  const { room_name, room_type_id, note } = req.body;

  if (!room_name || !room_type_id) {
    return res.json({ result: "error", message: "Thiếu thông tin bắt buộc" });
  }

  try {
    const isDuplicate = await roomModel.checkRoomNameExists(room_name);
    if (isDuplicate) {
      return res.json({
        result: "error",
        message: `Tên phòng "${room_name}" đã tồn tại. Vui lòng chọn tên khác.`,
      });
    }

    const newRoomId = await roomModel.generateNextRoomId();

    await roomModel.createRoom({
      room_id: newRoomId,
      room_name,
      room_type_id,
      note,
    });

    return res.json({
      result: "success",
      message: `Thêm phòng thành công! Mã: ${newRoomId}`,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result: "error", message: "Lỗi hệ thống: " + err.message });
  }
};

module.exports.showUpdate = async (req, res) => {
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
    const roomTypesList = await roomModel.getAllRoomTypes();

    if (result.rows.length === 0) {
      return res.status(404).send("Room not found");
    }
    res.render("pages/room-update", {
      pageTitle: "Cập nhật phòng",
      room: result.rows[0],
      roomTypesList: roomTypesList,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

exports.update = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const allowedColumns = ["room_name", "room_type_id", "status", "note"];

  const setClauses = [];
  const values = [];
  let paramIndex = 1;

  allowedColumns.forEach((col) => {
    if (updates[col] !== undefined) {
      setClauses.push(`${col} = $${paramIndex}`);
      values.push(updates[col]);
      paramIndex++;
    }
  });

  if (setClauses.length === 0) {
    return res.json({ result: "info", message: "Không có dữ liệu nào cần cập nhật" });
  }

  values.push(id);

  const queryString = `
    UPDATE rooms
    SET ${setClauses.join(", ")}
    WHERE room_id = $${paramIndex}
  `;

  try {
    if (updates.room_name) {
      const isDuplicate = await roomModel.checkRoomNameExists(updates.room_name, id);
      if (isDuplicate) {
        return res.json({
          result: "error",
          message: `Tên phòng "${updates.room_name}" đã được sử dụng bởi phòng khác.`,
        });
      }
    }
    const result = await pool.query(queryString, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ result: "error", message: "Phòng không tồn tại" });
    }

    return res.json({ result: "success", message: "Cập nhật phòng thành công" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ result: "error", message: "Lỗi cơ sở dữ liệu: " + err.message });
  }
};
