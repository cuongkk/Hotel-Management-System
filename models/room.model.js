const { query } = require("../configs/database.config.js");

module.exports.getAllRoomTypes = async () => {
  const sql = "SELECT type_name FROM room_types ORDER BY type_name ASC";
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

module.exports.createRoom = async ({ room_id, room_name, room_type_id, status, note }) => {
  const sql = `
    INSERT INTO rooms (room_id, room_name, room_type_id, status, note)
    VALUES ($1, $2, $3, $4::room_status, $5)
    RETURNING room_id
  `;
  return query(sql, [room_id, room_name, room_type_id, status || "AVAILABLE", note]);
};
