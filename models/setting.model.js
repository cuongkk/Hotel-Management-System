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
    const sqlRule = `
      UPDATE surcharge_rules 
      SET ratio = $1, extra_guest_threshold = $2 
      WHERE rule_id = (SELECT rule_id FROM surcharge_rules LIMIT 1)
    `;
    await query(sqlRule, [rule.ratio, rule.extra_guest_threshold]);

    for (const item of customerTypes) {
      const checkSql = "SELECT 1 FROM customer_types WHERE customer_type_id = $1";
      const checkRes = await query(checkSql, [item.customer_type_id]);

      if (checkRes.rows.length > 0) {
        const updateSql = `
          UPDATE customer_types 
          SET type_name = $1, surcharge_coefficient = $2 
          WHERE customer_type_id = $3
        `;
        await query(updateSql, [item.type_name, item.surcharge_coefficient, item.customer_type_id]);
      } else {
        const insertSql = `
          INSERT INTO customer_types (customer_type_id, type_name, surcharge_coefficient)
          VALUES ($1, $2, $3)
        `;
        await query(insertSql, [item.customer_type_id, item.type_name, item.surcharge_coefficient]);
      }
    }

    for (const room of roomTypes) {
      if (room.room_type_id) {
        const updateRoomSql = `
          UPDATE room_types 
          SET type_name = $1, base_price = $2, max_guests = $3 
          WHERE room_type_id = $4
        `;
        await query(updateRoomSql, [room.type_name, room.base_price, room.max_guests, room.room_type_id]);
      } else {
        const insertRoomSql = `
          INSERT INTO room_types (type_name, base_price, max_guests, is_active)
          VALUES ($1, $2, $3, TRUE)
        `;
        await query(insertRoomSql, [room.type_name, room.base_price, room.max_guests]);
      }
    }

    return true;
  } catch (err) {
    throw err;
  }
};

module.exports.countCustomersByType = async (customerTypeId) => {
  const sql = `SELECT COUNT(*) FROM customers WHERE customer_type_id = $1`;
  const result = await query(sql, [customerTypeId]);
  return parseInt(result.rows[0].count);
};

module.exports.deleteCustomerType = async (customerTypeId) => {
  const sql = `DELETE FROM customer_types WHERE customer_type_id = $1`;
  await query(sql, [customerTypeId]);
};

module.exports.countRoomsByType = async (roomTypeId) => {
  const sql = `SELECT COUNT(*) FROM rooms WHERE room_type_id = $1`;
  const result = await query(sql, [roomTypeId]);
  return parseInt(result.rows[0].count);
};

module.exports.deleteRoomType = async (roomTypeId) => {
  const sql = `DELETE FROM room_types WHERE room_type_id = $1`;
  await query(sql, [roomTypeId]);
};
