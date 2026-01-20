const { query } = require("../configs/database.config.js");

module.exports.getAllRoomTypes = async () => {
  const sql = "SELECT type_name, room_type_id FROM room_types ORDER BY type_name ASC";
  const result = await query(sql);
  return result.rows;
};

module.exports.findRoomPaged = async ({ q, status, roomType, page = 1, pageSize = 10 }) => {
  const keyword = (q || "").trim();

  page = Math.max(parseInt(page, 10) || 1, 1);
  pageSize = Math.min(Math.max(parseInt(pageSize, 10) || 10, 1), 100);

  let where = `WHERE 1=1`;
  const params = [];
  let p = 1;

  if (keyword) {
    where += ` AND r.room_name ILIKE $${p}`;
    params.push(`%${keyword}%`);
    p++;
  }

  if (status) {
    where += ` AND r.status = $${p}::room_status`;
    params.push(status);
    p++;
  }

  if (roomType) {
    where += ` AND rt.type_name = $${p}`;
    params.push(roomType);
    p++;
  }

  const countSql = `
    SELECT COUNT(*)::int AS total 
    FROM rooms r
    LEFT JOIN room_types rt ON r.room_type_id = rt.room_type_id
    ${where}
  `;
  const countRes = await query(countSql, params);
  const total = countRes.rows[0]?.total || 0;
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  if (page > totalPages) {
    page = totalPages;
  }
  const finalOffset = (page - 1) * pageSize;

  const dataSql = `
    SELECT 
      r.room_id, 
      r.room_name, 
      r.status, 
      r.note, 
      rt.type_name AS room_type, 
      rt.max_guests, 
      rt.base_price
    FROM rooms r
    LEFT JOIN room_types rt ON r.room_type_id = rt.room_type_id
    ${where}
    ORDER BY r.room_id ASC
    LIMIT $${p} OFFSET $${p + 1}
  `;

  const dataRes = await query(dataSql, [...params, pageSize, finalOffset]);

  return {
    rows: dataRes.rows,
    total,
    page,
    pageSize,
    totalPages,
  };
};

module.exports.checkRoomNameExists = async (roomName, excludeId = null) => {
  let sql = "SELECT room_id FROM rooms WHERE room_name = $1";
  const params = [roomName];

  if (excludeId) {
    // Nếu là update, tìm các phòng CÓ tên này NHƯNG KHÔNG PHẢI phòng đang sửa
    sql += " AND room_id != $2";
    params.push(excludeId);
  }

  const result = await query(sql, params);
  return result.rows.length > 0; // Trả về true nếu tìm thấy (bị trùng)
};

module.exports.generateNextRoomId = async () => {
  const sql = "SELECT room_id FROM rooms ORDER BY room_id DESC LIMIT 1";

  const result = await query(sql);

  let nextId = "R0001";

  if (result.rows.length > 0) {
    const lastId = result.rows[0].room_id;
    const currentNumber = parseInt(lastId.replace("R", ""), 10);
    const nextNumber = currentNumber + 1;
    nextId = `R${nextNumber.toString().padStart(4, "0")}`;
  }

  return nextId;
};

module.exports.createRoom = async (data) => {
  const { room_id, room_name, room_type_id, note } = data;

  const sql = `
      INSERT INTO rooms (room_id, room_name, room_type_id, status, note)
      VALUES ($1, $2, $3, 'AVAILABLE', $4)
    `;

  return await query(sql, [room_id, room_name, room_type_id, note]);
};
