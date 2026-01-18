const { query } = require("../configs/database.config.js");

module.exports.getById = async (userId) => {
  const sql = `
    SELECT user_id, username, full_name, email, phone_number, role, is_active, created_at
    FROM users
    WHERE user_id = $1
    LIMIT 1
  `;
  const result = await query(sql, [userId]);
  return result.rows[0] || null;
};

module.exports.updateEmailPhone = async (userId, { email, phone_number }) => {
  const sets = [];
  const values = [];
  let i = 1;

  if (email) {
    sets.push(`email = $${i++}`);
    values.push(email);
  }
  if (phone_number) {
    sets.push(`phone_number = $${i++}`);
    values.push(phone_number);
  }

  if (sets.length === 0) return;

  values.push(userId);
  const sql = `
    UPDATE users
    SET ${sets.join(", ")}
    WHERE user_id = $${i}
  `;

  return query(sql, values);
};
