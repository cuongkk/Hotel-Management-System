const { query } = require("../configs/database.config.js");

module.exports.getSurchargeRule = async () => {
  const sql = `SELECT * FROM surcharge_rules LIMIT 1`;
  const result = await query(sql);
  return result.rows[0];
};

module.exports.findAllCustomerTypes = async () => {
  const sql = `SELECT * FROM customer_types ORDER BY customer_type_id ASC`;
  const result = await query(sql);
  return result.rows;
};

module.exports.findAllRoomTypes = async () => {
  const sql = `SELECT * FROM room_types WHERE is_active = TRUE ORDER BY room_type_id ASC`;
  const result = await query(sql);
  return result.rows;
};

module.exports.updateAllSettings = async (rule, customerTypes, roomTypes) => {
  try {
    // Nên dùng Transaction để đảm bảo tính toàn vẹn (thêm BEGIN/COMMIT nếu thư viện query của bạn hỗ trợ client connect)

    // 1. Cập nhật Quy định (Rule) - Giả sử chỉ có 1 dòng rule_id = 1 hoặc update dòng đầu tiên
    // Lưu ý: Cần update rule_name='Surcharge Rule' nếu chưa có, hoặc chỉ update ratio/threshold
    const sqlRule = `
      UPDATE surcharge_rules 
      SET ratio = $1, extra_guest_threshold = $2 
      WHERE rule_id = (SELECT rule_id FROM surcharge_rules LIMIT 1)
    `;
    await query(sqlRule, [rule.ratio, rule.extra_guest_threshold]);

    // 2. Cập nhật Loại khách (Customer Types)
    for (const item of customerTypes) {
      // Kiểm tra xem ID đã tồn tại chưa
      const checkSql = "SELECT 1 FROM customer_types WHERE customer_type_id = $1";
      const checkRes = await query(checkSql, [item.customer_type_id]);

      if (checkRes.rows.length > 0) {
        // UPDATE: Chỉ cập nhật tên và hệ số
        const updateSql = `
          UPDATE customer_types 
          SET type_name = $1, surcharge_coefficient = $2 
          WHERE customer_type_id = $3
        `;
        await query(updateSql, [item.type_name, item.surcharge_coefficient, item.customer_type_id]);
      } else {
        // INSERT: Tạo mới
        const insertSql = `
          INSERT INTO customer_types (customer_type_id, type_name, surcharge_coefficient)
          VALUES ($1, $2, $3)
        `;
        await query(insertSql, [item.customer_type_id, item.type_name, item.surcharge_coefficient]);
      }
    }

    // 3. Cập nhật Loại phòng (Room Types)
    for (const room of roomTypes) {
      if (room.room_type_id) {
        // UPDATE (Vì đã có ID gửi lên từ form)
        const updateRoomSql = `
          UPDATE room_types 
          SET type_name = $1, base_price = $2, max_guests = $3 
          WHERE room_type_id = $4
        `;
        await query(updateRoomSql, [room.type_name, room.base_price, room.max_guests, room.room_type_id]);
      } else {
        // INSERT (Vì form gửi lên ID là null/rỗng)
        const insertRoomSql = `
          INSERT INTO room_types (type_name, base_price, max_guests, is_active)
          VALUES ($1, $2, $3, TRUE)
        `;
        await query(insertRoomSql, [room.type_name, room.base_price, room.max_guests]);
      }
    }

    return true;
  } catch (err) {
    throw err; // Ném lỗi ra để Controller bắt
  }
};
